import type { WPFormField } from '~/types/wordpress'

export type ClientFormValue = boolean | string
export type ClientFormValues = Record<string, ClientFormValue>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const getInitialValue = (field: WPFormField): ClientFormValue => {
  switch (field.type) {
    case 'checkbox':
      return field.default_value === true
    case 'number':
      return typeof field.default_value === 'number' ? String(field.default_value) : ''
    case 'select':
    case 'radio':
      return field.default_value ?? ''
    case 'text':
    case 'email':
    case 'tel':
    case 'date':
    case 'time':
    case 'datetime-local':
    case 'textarea':
      return field.default_value ?? ''
  }
}

export function createInitialClientFormValues(fields: WPFormField[]): ClientFormValues {
  return Object.fromEntries(fields.map((field) => [field.field_id, getInitialValue(field)]))
}

export function validateClientFormValues(
  fields: WPFormField[],
  values: ClientFormValues,
): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const field of fields) {
    const rawValue = values[field.field_id]

    if (field.type === 'checkbox') {
      if (field.required && rawValue !== true) {
        errors[field.field_id] = `${field.label} is required.`
      }
      continue
    }

    const stringValue = typeof rawValue === 'string' ? rawValue.trim() : ''

    if (field.required && !stringValue) {
      errors[field.field_id] = `${field.label} is required.`
      continue
    }

    if (!stringValue) continue

    if (field.type === 'email' && !EMAIL_PATTERN.test(stringValue)) {
      errors[field.field_id] = `${field.label} must be a valid email address.`
    }

    if (field.type === 'number' && Number.isNaN(Number(stringValue))) {
      errors[field.field_id] = `${field.label} must be a valid number.`
    }

    if ((field.type === 'select' || field.type === 'radio') && !field.options.some((option) => option.value === stringValue)) {
      errors[field.field_id] = `Please choose a valid option for ${field.label}.`
    }
  }

  return errors
}