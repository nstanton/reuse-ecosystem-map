import {
  ROLE_COL,
  SECONDARY_ROLE_COL,
  C_ROLE_COL,
  C_RECORD_ID_COL,
} from './data_constants.js'

function buildRoleLookup(colorsData) {
  const roleLookup = new globalThis.Map()

  colorsData.forEach(color => {
    if (!color?.[C_RECORD_ID_COL]) {
      return
    }
    roleLookup.set(color[C_RECORD_ID_COL], color?.[C_ROLE_COL])
  })

  return roleLookup
}

function replaceRoleIds(roleIds, roleLookup) {
  return (roleIds || [])
    .map(roleId => roleLookup.get(roleId))
    .filter(Boolean)
}

function transformMainData(pageData, roleLookup) {
  return pageData.map(row => {
    const nextRow = { ...row }
    nextRow[ROLE_COL] = replaceRoleIds(nextRow[ROLE_COL], roleLookup)
    nextRow[SECONDARY_ROLE_COL] = replaceRoleIds(nextRow[SECONDARY_ROLE_COL], roleLookup)
    return nextRow
  })
}

export {
  buildRoleLookup,
  transformMainData,
}
