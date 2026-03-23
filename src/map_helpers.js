import {
  LAT_COL,
  LON_COL,
} from './data_constants.js'

function getFeatureColor(colorCol) {
  const fallbackColor = '#333'
  if (!colorCol || !colorCol.length) {
    return fallbackColor
  }
  return colorCol[0]
}

function normalizeRoles(roles) {
  if (Array.isArray(roles)) {
    return roles.filter(Boolean)
  }
  if (roles) {
    return [roles]
  }
  return []
}

// https://stackoverflow.com/questions/1140189/converting-latitude-and-longitude-to-decimal-values
function parseDMS(input) {
  const parts = input.split(/[^\d\w\.]+/)
  return convertDMSToDD(parts[0], parts[1], parts[2], parts[3])
}

function convertDMSToDD(degrees, minutes, seconds, direction) {
  let dd = parseInt(degrees, 10) + parseInt(minutes, 10) / 60 + parseFloat(seconds) / (60 * 60)

  if (direction === 'S' || direction === 'W') {
    dd *= -1
  }

  return dd
}

function buildFeature(feature) {
  return {
    type: 'Feature',
    properties: feature,
    geometry: {
      type: 'Point',
      coordinates: [
        parseFloat(feature[LON_COL]),
        parseFloat(feature[LAT_COL]),
      ],
    },
  }
}

function buildGeoJSON(data) {
  const featureCollection = {
    type: 'FeatureCollection',
    features: [],
  }

  data.forEach((row, index) => {
    if (!row?.[LON_COL] || !row?.[LAT_COL]) {
      return
    }

    const normalizedFeature = {
      ...row,
      [LON_COL]: String(row[LON_COL]).replace(',', '.'),
      [LAT_COL]: String(row[LAT_COL]).replace(',', '.'),
    }

    if (
      /[a-z]/i.test(normalizedFeature[LON_COL]) &&
      /[a-z]/i.test(normalizedFeature[LAT_COL])
    ) {
      normalizedFeature[LON_COL] = parseDMS(normalizedFeature[LON_COL])
      normalizedFeature[LAT_COL] = parseDMS(normalizedFeature[LAT_COL])
    }

    try {
      const lon = parseFloat(normalizedFeature[LON_COL])
      const lat = parseFloat(normalizedFeature[LAT_COL])

      if (!Number.isNaN(lon) && !Number.isNaN(lat)) {
        featureCollection.features.push(buildFeature(normalizedFeature))
      }
    } catch (error) {
      console.log('error parsing row', index, normalizedFeature, error)
    }
  })

  return featureCollection
}

export {
  buildFeature,
  buildGeoJSON,
  convertDMSToDD,
  getFeatureColor,
  normalizeRoles,
  parseDMS,
}
