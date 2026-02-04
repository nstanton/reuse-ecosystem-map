import Papa from 'papaparse'
import Airtable from "airtable"
import * as MapModule from './map.js'
import * as Table from './table.js'

import {
  BASE_TABLE_CONFIG,
  COLORS_TABLE_CONFIG,
  ROLE_COL,
  SECONDARY_ROLE_COL,
  C_ROLE_COL,
  C_COLOR_COL,
  C_RECORD_ID_COL,
} from './data_constants.js'

const databaseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
const airtableApiKey = import.meta.env.VITE_AIRTABLE_API_KEY;

if (!airtableApiKey) {
  throw new Error('VITE_AIRTABLE_API_KEY is required. Please set it in your .env.local file.');
}

if (!databaseId) {
  throw new Error('VITE_AIRTABLE_BASE_ID is required. Please set it in your .env.local file.');
}
const base = new Airtable({apiKey: airtableApiKey}).base(databaseId);

const publicSpreadsheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSZ_aRgmKOVqj1Ch4zy8zzjkQREuYo0xXzPlJUKv4-7ULfWNNQdJbOFJgVFayS4zbT7vvkIaJ5JZaBa/pub?output=csv'

export {
  getAirtableData,
  getAirtableDataStreaming,
  getColorsData,
  getSpreadsheetData,
}

const getAirtableRecords = async ({
  name,
  fields,
  view
}) => {
  return new Promise((resolve, reject) => {
    let allRecords = [];

    base(name).select({
      view: view,
      fields: fields,
     })
      .eachPage(
        (records, fetchNextPage) => {
          allRecords = [
            ...allRecords,
            ...records.map(r => r.fields)
          ];
          fetchNextPage();
        },
        err => {
          // If error is about unknown fields, try fetching all fields instead
          if (err && err.message && err.message.includes('UNKNOWN_FIELD_NAME')) {
            console.warn('Some optional fields not found in Airtable, fetching all available fields instead');
            // Retry without field specification to get all available fields
            base(name).select({
              view: view,
            })
              .eachPage(
                (records, fetchNextPage) => {
                  allRecords = [
                    ...allRecords,
                    ...records.map(r => r.fields)
                  ];
                  fetchNextPage();
                },
                retryErr => {
                  if (retryErr) reject(retryErr);
                  resolve(allRecords);
                }
              );
          } else {
            if (err) reject(err);
            resolve(allRecords);
          }
        }
      );
  });
}

const getAirtableData = async () => {
  let mainData = await getAirtableRecords(BASE_TABLE_CONFIG)
  let colorsData = await getAirtableRecords(COLORS_TABLE_CONFIG)
  const roleLookup = buildRoleLookup(colorsData)

  // join main data to colors to find role names
  mainData = mainData.map(d => {
    const obj = {...d}
    obj[ROLE_COL] = (obj[ROLE_COL] || []).map(r => roleLookup.get(r))
    obj[SECONDARY_ROLE_COL] = (obj[SECONDARY_ROLE_COL] || []).map(r => roleLookup.get(r))
    return obj
  })

  colorsData = colorsData.map(d => [d[C_ROLE_COL], d[C_COLOR_COL]])
  return [mainData, colorsData]
};

// Get colors data first (needed for legend and color mapping)
const getColorsData = async () => {
  let colorsData = await getAirtableRecords(COLORS_TABLE_CONFIG)
  const colorsLookup = colorsData // Keep full data for lookups
  const colorsForLegend = colorsData.map(d => [d[C_ROLE_COL], d[C_COLOR_COL]])
  return { colorsLookup, colorsForLegend }
};

// Helper to transform a page of main data with colors lookup
const transformMainData = (pageData, roleLookup) => {
  return pageData.map(d => {
    const obj = {...d}
    obj[ROLE_COL] = (obj[ROLE_COL] || []).map(r => roleLookup.get(r))
    obj[SECONDARY_ROLE_COL] = (obj[SECONDARY_ROLE_COL] || []).map(r => roleLookup.get(r))
    return obj
  })
};

// Stream main data page by page, calling onPage callback for each batch
const getAirtableDataStreaming = async (colorsLookup, onPage) => {
  return new Promise((resolve, reject) => {
    let totalRecords = 0;
    const roleLookup = buildRoleLookup(colorsLookup)
    
    base(BASE_TABLE_CONFIG.name).select({
      view: BASE_TABLE_CONFIG.view,
      fields: BASE_TABLE_CONFIG.fields,
    })
      .eachPage(
        (records, fetchNextPage) => {
          const pageData = records.map(r => r.fields);
          const transformedData = transformMainData(pageData, roleLookup);
          totalRecords += transformedData.length;
          console.log(`Loaded page with ${transformedData.length} records (${totalRecords} total)`);
          onPage(transformedData);
          fetchNextPage();
        },
        err => {
          if (err) {
            console.error('Error fetching Airtable data:', err);
            reject(err);
          } else {
            console.log(`Finished loading all ${totalRecords} records`);
            resolve(totalRecords);
          }
        }
      );
  });
};

const buildRoleLookup = (colorsData) => {
  const roleLookup = new globalThis.Map()
  colorsData.forEach(color => {
    roleLookup.set(color?.[C_RECORD_ID_COL], color?.[C_ROLE_COL])
  })
  return roleLookup
}

function getSpreadsheetData() {
  Papa.parse(publicSpreadsheetUrl, {
  download: true,
  header: true,
  complete: function(results) {
      const data = results.data
      const publishedData = data.filter(function(obj){
        if ('STATUS' in obj) {
          return obj['STATUS'].trim().toLowerCase() == 'published'
        }
      })
      MapModule.init(publishedData)
      Table.init(publishedData, '#table')
    }
  })
}
