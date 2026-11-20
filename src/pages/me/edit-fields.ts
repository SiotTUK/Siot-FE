/** Onboarding answers editable from M10, in the order the screen lists them. */
export const editFields = [
  { field: 'userType', labelKey: 'me.situation' },
  { field: 'purpose', labelKey: 'me.purpose' },
  { field: 'entryDate', labelKey: 'me.entryDate' },
  { field: 'stayExpiry', labelKey: 'me.stayExpiry' },
  { field: 'residences', labelKey: 'me.residences' },
] as const

export type EditField = (typeof editFields)[number]['field']

export function isEditField(value: unknown): value is EditField {
  return editFields.some((item) => item.field === value)
}
