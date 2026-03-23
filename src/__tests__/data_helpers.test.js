import { describe, expect, it } from 'vitest'

import {
  C_RECORD_ID_COL,
  C_ROLE_COL,
  ROLE_COL,
  SECONDARY_ROLE_COL,
} from '../data_constants.js'
import {
  buildRoleLookup,
  transformMainData,
} from '../data_helpers.js'

describe('data_helpers', () => {
  it('builds a role lookup map from colors data', () => {
    const colorsData = [
      { [C_RECORD_ID_COL]: 'rec-maker', [C_ROLE_COL]: 'Maker' },
      { [C_RECORD_ID_COL]: 'rec-recycler', [C_ROLE_COL]: 'Recycler' },
    ]

    const lookup = buildRoleLookup(colorsData)

    expect(lookup).toBeInstanceOf(Map)
    expect(lookup.get('rec-maker')).toBe('Maker')
    expect(lookup.get('rec-recycler')).toBe('Recycler')
  })

  it('returns an empty map when no colors data is present', () => {
    const lookup = buildRoleLookup([])

    expect(lookup).toBeInstanceOf(Map)
    expect(lookup.size).toBe(0)
  })

  it('replaces role ids with role names and drops unknown ids', () => {
    const roleLookup = new Map([
      ['rec-maker', 'Maker'],
      ['rec-recycler', 'Recycler'],
    ])
    const input = [
      {
        [ROLE_COL]: ['rec-maker', 'missing'],
        [SECONDARY_ROLE_COL]: ['rec-recycler'],
        entity: 'Example',
      },
      {
        [ROLE_COL]: undefined,
        [SECONDARY_ROLE_COL]: null,
        entity: 'Empty',
      },
    ]

    const result = transformMainData(input, roleLookup)

    expect(result).toEqual([
      {
        [ROLE_COL]: ['Maker'],
        [SECONDARY_ROLE_COL]: ['Recycler'],
        entity: 'Example',
      },
      {
        [ROLE_COL]: [],
        [SECONDARY_ROLE_COL]: [],
        entity: 'Empty',
      },
    ])
    expect(input[0][ROLE_COL]).toEqual(['rec-maker', 'missing'])
  })
})
