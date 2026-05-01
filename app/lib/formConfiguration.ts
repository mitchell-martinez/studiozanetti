import type { FormBlock, WPFormField } from '~/types/wordpress'

export const RESERVED_NAME_FIELD_ID = 'name'
export const RESERVED_VSCO_FIRST_NAME_KEY = 'FirstName'

const normalizeFieldToken = (value?: string): string => value?.trim().toLowerCase() ?? ''

export const isReservedNameField = (field: Pick<WPFormField, 'field_id'>): boolean =>
  normalizeFieldToken(field.field_id) === RESERVED_NAME_FIELD_ID

export function validateFormConfiguration(form: Pick<FormBlock, 'fields'>): string[] {
  const errors: string[] = []

  if (!form.fields.length) {
    return ['Form must contain at least one field.']
  }

  const duplicateFieldIds = new Set<string>()
  const seenFieldIds = new Set<string>()
  const reservedNameRows: WPFormField[] = []
  const firstNameMappedRows: WPFormField[] = []

  for (const field of form.fields) {
    const normalizedFieldId = normalizeFieldToken(field.field_id)
    const normalizedVscoFieldKey = normalizeFieldToken(field.vsco_field_key)

    if (normalizedFieldId) {
      if (seenFieldIds.has(normalizedFieldId)) {
        duplicateFieldIds.add(normalizedFieldId)
      }
      seenFieldIds.add(normalizedFieldId)
    }

    if (normalizedFieldId === RESERVED_NAME_FIELD_ID) {
      reservedNameRows.push(field)

      if (field.type !== 'text') {
        errors.push('The reserved Name field must use the Text field type.')
      }

      if (!field.required) {
        errors.push('The reserved Name field must have Required enabled.')
      }

      if (
        normalizedVscoFieldKey &&
        normalizedVscoFieldKey !== RESERVED_VSCO_FIRST_NAME_KEY.toLowerCase()
      ) {
        errors.push('The reserved Name field must map to VSCO Field Key FirstName.')
      }
    }

    if (normalizedVscoFieldKey === RESERVED_VSCO_FIRST_NAME_KEY.toLowerCase()) {
      firstNameMappedRows.push(field)

      if (normalizedFieldId !== RESERVED_NAME_FIELD_ID) {
        errors.push('VSCO Field Key FirstName is reserved for the Name field.')
      }
    }
  }

  if (duplicateFieldIds.size > 0) {
    for (const duplicateFieldId of duplicateFieldIds) {
      errors.push(`Field ID ${duplicateFieldId} is duplicated. Field IDs must be unique.`)
    }
  }

  if (reservedNameRows.length === 0) {
    errors.push('The form must include one reserved Name field with Field ID name.')
  }

  if (reservedNameRows.length > 1) {
    errors.push('Only one reserved Name field is allowed in a form.')
  }

  if (firstNameMappedRows.length > 1) {
    errors.push('VSCO Field Key FirstName can only be used once in a form.')
  }

  if (
    reservedNameRows.length === 1 &&
    firstNameMappedRows.length === 1 &&
    reservedNameRows[0] !== firstNameMappedRows[0]
  ) {
    errors.push('The reserved Name field must be the same row that maps to VSCO Field Key FirstName.')
  }

  return Array.from(new Set(errors))
}