export const LAT_COL = 'Latitude'
export const LON_COL = 'Longitude'
export const ENTITY_COL = "Entity Name"
export const LOCATION_COL = "Region"
export const ROLE_COL = "Primary Role"
export const SECONDARY_ROLE_COL = "Secondary Role (if applicable)"
export const ADDRESS_COL = "Full Address"
export const CONTACT_COL = "Contact Name"
export const EMAIL_COL = "Email"
export const PHONE_COL = "Phone Number"
export const WEBSITE_COL = "Website"
export const COLLABORATION_COL = "Collaboration Opportunities"
export const COLOR_COL = "Colors (HEX) (from Primary Role copy)"

// Core required fields
export const REQUIRED_FIELDS = [
  LAT_COL,
  LON_COL,
  ENTITY_COL,
  LOCATION_COL,
  ROLE_COL,
  SECONDARY_ROLE_COL,
  ADDRESS_COL,
  CONTACT_COL,
  EMAIL_COL,
  PHONE_COL,
  WEBSITE_COL,
  COLOR_COL,
]

// Optional fields that may not exist in all Airtable bases
export const OPTIONAL_FIELDS = [
  COLLABORATION_COL,
]

// All fields (required + optional)
export const ALL_FIELDS = [
  ...REQUIRED_FIELDS,
  ...OPTIONAL_FIELDS,
]

export const BASE_TABLE_CONFIG = {
  name: 'data',
  fields: REQUIRED_FIELDS, // Only request required fields to avoid errors with missing optional fields
  view: 'View for map'
}

export const C_ROLE_COL = "Role"
export const C_COLOR_COL = "Colors (HEX)"
export const C_RECORD_ID_COL = "record_id"

export const COLORS_TABLE_CONFIG = {
  name: 'Role Colors',
  fields: [C_ROLE_COL, C_COLOR_COL, C_RECORD_ID_COL],
  view: 'Grid view'
}
