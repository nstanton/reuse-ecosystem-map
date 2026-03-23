import { describe, expect, it } from 'vitest'

import {
  LAT_COL,
  LON_COL,
  ROLE_COL,
} from '../data_constants.js'
import {
  buildFeature,
  buildGeoJSON,
  convertDMSToDD,
  getFeatureColor,
  normalizeRoles,
  parseDMS,
} from '../map_helpers.js'

describe('map_helpers', () => {
  it('returns the first configured color or the default fallback', () => {
    expect(getFeatureColor(['#abc123', '#000000'])).toBe('#abc123')
    expect(getFeatureColor([])).toBe('#333')
    expect(getFeatureColor(null)).toBe('#333')
    expect(getFeatureColor(undefined)).toBe('#333')
  })

  it('normalizes role inputs into a clean array', () => {
    expect(normalizeRoles(['Maker', '', null, 'Recycler'])).toEqual(['Maker', 'Recycler'])
    expect(normalizeRoles('Maker')).toEqual(['Maker'])
    expect(normalizeRoles(null)).toEqual([])
  })

  it('converts DMS coordinate parts into decimal degrees', () => {
    expect(convertDMSToDD('122', '24', '30', 'W')).toBeCloseTo(-122.408333, 6)
    expect(convertDMSToDD('37', '46', '15', 'N')).toBeCloseTo(37.770833, 6)
  })

  it('parses DMS strings into decimal degrees', () => {
    expect(parseDMS('122 24 30 W')).toBeCloseTo(-122.408333, 6)
    expect(parseDMS('37 46 15 N')).toBeCloseTo(37.770833, 6)
  })

  it('builds a single GeoJSON point feature', () => {
    const row = {
      [LON_COL]: '-122.40',
      [LAT_COL]: '37.76',
      name: 'Example',
    }

    expect(buildFeature(row)).toEqual({
      type: 'Feature',
      properties: row,
      geometry: {
        type: 'Point',
        coordinates: [-122.4, 37.76],
      },
    })
  })

  it('builds a feature collection from valid coordinate rows', () => {
    const rows = [
      {
        [LON_COL]: '-122.40',
        [LAT_COL]: '37.76',
        [ROLE_COL]: ['Maker'],
      },
      {
        [LON_COL]: '-121,50',
        [LAT_COL]: '38,10',
      },
      {
        [LON_COL]: '122 24 30 W',
        [LAT_COL]: '37 46 15 N',
      },
      {
        [LON_COL]: '',
        [LAT_COL]: '37.00',
      },
      {
        [LON_COL]: 'not-a-coordinate',
        [LAT_COL]: '37.00',
      },
    ]

    const geoJson = buildGeoJSON(rows)

    expect(geoJson.type).toBe('FeatureCollection')
    expect(geoJson.features).toHaveLength(3)
    expect(geoJson.features[0].geometry.coordinates).toEqual([-122.4, 37.76])
    expect(geoJson.features[1].geometry.coordinates).toEqual([-121.5, 38.1])
    expect(geoJson.features[2].geometry.coordinates[0]).toBeCloseTo(-122.408333, 6)
    expect(geoJson.features[2].geometry.coordinates[1]).toBeCloseTo(37.770833, 6)
  })

  it('returns an empty feature collection for empty input', () => {
    expect(buildGeoJSON([])).toEqual({
      type: 'FeatureCollection',
      features: [],
    })
  })
})
