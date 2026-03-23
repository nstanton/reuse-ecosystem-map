import { describe, expect, it } from 'vitest'

import {
  ALL_FIELDS,
  BASE_TABLE_CONFIG,
  COLORS_TABLE_CONFIG,
  OPTIONAL_FIELDS,
  REQUIRED_FIELDS,
  C_COLOR_COL,
  C_RECORD_ID_COL,
  C_ROLE_COL,
  COLLABORATION_COL,
  LAT_COL,
  LON_COL,
  ROLE_COL,
} from '../data_constants.js'

describe('data_constants', () => {
  it('exports non-empty core column names', () => {
    ;[
      LAT_COL,
      LON_COL,
      ROLE_COL,
      C_ROLE_COL,
      C_COLOR_COL,
      C_RECORD_ID_COL,
    ].forEach(value => {
      expect(value).toEqual(expect.any(String))
      expect(value.length).toBeGreaterThan(0)
    })
  })

  it('exports Airtable config objects with the expected shape', () => {
    expect(BASE_TABLE_CONFIG).toEqual({
      name: 'data',
      fields: REQUIRED_FIELDS,
      view: 'View for map',
    })

    expect(COLORS_TABLE_CONFIG).toEqual({
      name: 'Role Colors',
      fields: [C_ROLE_COL, C_COLOR_COL, C_RECORD_ID_COL],
      view: 'Grid view',
    })
  })

  it('keeps required and optional fields aligned with the aggregate list', () => {
    expect(REQUIRED_FIELDS).toEqual(expect.arrayContaining([LAT_COL, LON_COL, ROLE_COL]))
    expect(OPTIONAL_FIELDS).toEqual([COLLABORATION_COL])
    expect(ALL_FIELDS).toEqual([...REQUIRED_FIELDS, ...OPTIONAL_FIELDS])
  })
})
