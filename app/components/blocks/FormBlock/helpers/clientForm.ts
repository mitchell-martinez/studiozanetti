import {
  getEffectiveNumberFieldMin,
  getSubmitterCopyTargetFields,
  isReservedNameField,
} from '~/lib/formConfiguration'
import type { WPFormField } from '~/types/wordpress'

export type ClientFormValue = string | string[]
export type ClientFormValues = Record<string, ClientFormValue>

interface ClientFormValidationOptions {
  requestSubmitterCopy?: boolean
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const getCheckboxOptionValues = (field: Extract<WPFormField, { type: 'checkbox' }>): string[] => {
  const configuredValues =
    field.options
      ?.map((option) => option.value?.trim())
      .filter((value): value is string => Boolean(value)) ?? []

  if (configuredValues.length > 0) {
    return configuredValues
  }

  return [field.field_id]
}

const normalizeSelectionArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  )
}

const normalizeQueryValue = (value: string | null): string | null => {
  if (typeof value !== 'string') return null

  const trimmedValue = value.trim()
  return trimmedValue || null
}

const normalizeLookupToken = (value: string): string =>
  value.trim().toLowerCase().replace(/[\s_-]+/g, '_')

const getParamValueByFieldId = (searchParams: URLSearchParams, fieldId: string): string | null => {
  const directValue = normalizeQueryValue(searchParams.get(fieldId))
  if (directValue) {
    return directValue
  }

  const normalizedFieldId = normalizeLookupToken(fieldId)

  for (const [paramName, paramValue] of searchParams.entries()) {
    if (normalizeLookupToken(paramName) !== normalizedFieldId) {
      continue
    }

    const normalizedValue = normalizeQueryValue(paramValue)
    if (normalizedValue) {
      return normalizedValue
    }
  }

  return null
}

const getParamValuesByFieldId = (searchParams: URLSearchParams, fieldId: string): string[] => {
  const directValues = normalizeSelectionArray(searchParams.getAll(fieldId))
  if (directValues.length > 0) {
    return directValues
  }

  const normalizedFieldId = normalizeLookupToken(fieldId)
  const matchingValues: string[] = []

  for (const [paramName, paramValue] of searchParams.entries()) {
    if (normalizeLookupToken(paramName) !== normalizedFieldId) {
      continue
    }

    const normalizedValue = normalizeQueryValue(paramValue)
    if (normalizedValue) {
      matchingValues.push(normalizedValue)
    }
  }

  return normalizeSelectionArray(matchingValues)
}

const getNormalizedChoiceOption = (
  field: Extract<WPFormField, { type: 'select' | 'radio' }>,
  value: string,
): { label: string; value: string } | undefined =>
  field.options.find((option) => normalizeLookupToken(option.value ?? '') === normalizeLookupToken(value))

const getInitialValue = (field: WPFormField): ClientFormValue => {
  switch (field.type) {
    case 'checkbox':
      if (Array.isArray(field.default_value)) {
        const optionValues = new Set(getCheckboxOptionValues(field))
        return normalizeSelectionArray(field.default_value).filter((value) => optionValues.has(value))
      }

      if (field.default_value === true) {
        const [firstOptionValue] = getCheckboxOptionValues(field)
        return firstOptionValue ? [firstOptionValue] : []
      }

      return []
    case 'number':
      return typeof field.default_value === 'number'
        ? String(Math.max(getEffectiveNumberFieldMin(field), field.default_value))
        : ''
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

export function getPrefilledClientFormValues(
  fields: WPFormField[],
  search: string,
  formId?: string,
): Partial<ClientFormValues> {
  const searchParams = new URLSearchParams(search)
  const requestedFormId = getParamValueByFieldId(searchParams, 'form_id')

  if (requestedFormId && normalizeLookupToken(requestedFormId) !== normalizeLookupToken(formId?.trim() || '')) {
    return {}
  }

  const prefilledValues: Partial<ClientFormValues> = {}

  for (const field of fields) {
    if (field.type === 'checkbox') {
      const optionValues = new Set(getCheckboxOptionValues(field))
      const selectedValues = getParamValuesByFieldId(searchParams, field.field_id).filter(
        (value) => optionValues.has(value),
      )

      if (selectedValues.length > 0) {
        prefilledValues[field.field_id] = selectedValues
      }

      continue
    }

    const queryValue = getParamValueByFieldId(searchParams, field.field_id)
    if (!queryValue) {
      continue
    }

    if (
      (field.type === 'select' || field.type === 'radio') &&
      !getNormalizedChoiceOption(field, queryValue)
    ) {
      continue
    }

    prefilledValues[field.field_id] =
      field.type === 'select' || field.type === 'radio'
        ? (getNormalizedChoiceOption(field, queryValue)?.value ?? queryValue)
        : queryValue
  }

  return prefilledValues
}

export function validateClientFormValues(
  fields: WPFormField[],
  values: ClientFormValues,
  options: ClientFormValidationOptions = {},
): Record<string, string> {
  const errors: Record<string, string> = {}
  const submitterCopyTargetField = getSubmitterCopyTargetFields({ fields })[0]

  for (const field of fields) {
    const rawValue = values[field.field_id]

    if (field.type === 'checkbox') {
      const optionValues = new Set(getCheckboxOptionValues(field))
      const selectedValues = normalizeSelectionArray(rawValue)
      const hasInvalidSelection = selectedValues.some((value) => !optionValues.has(value))

      if (hasInvalidSelection) {
        errors[field.field_id] = `Please choose valid options for ${field.label}.`
        continue
      }

      if (field.required && selectedValues.length === 0) {
        errors[field.field_id] = `${field.label} is required.`
      }
      continue
    }

    const stringValue = typeof rawValue === 'string' ? rawValue.trim() : ''

    if ((field.required || isReservedNameField(field)) && !stringValue) {
      errors[field.field_id] = `${field.label} is required.`
      continue
    }

    if (!stringValue) continue

    if (field.type === 'email' && !EMAIL_PATTERN.test(stringValue)) {
      errors[field.field_id] = `${field.label} must be a valid email address.`
    }

    if (
      options.requestSubmitterCopy &&
      field.field_id === submitterCopyTargetField?.field_id &&
      !stringValue
    ) {
      errors[field.field_id] = `${field.label} is required to receive a copy of the form.`
    }

    if (field.type === 'number' && Number.isNaN(Number(stringValue))) {
      errors[field.field_id] = `${field.label} must be a valid number.`
    }

    if (field.type === 'number' && !Number.isNaN(Number(stringValue))) {
      const numericValue = Number(stringValue)
      const effectiveMin = getEffectiveNumberFieldMin(field)

      if (numericValue < effectiveMin) {
        errors[field.field_id] = `${field.label} must be at least ${effectiveMin}.`
      }

      if (typeof field.max === 'number' && numericValue > field.max) {
        errors[field.field_id] = `${field.label} must be no more than ${field.max}.`
      }
    }

    if (
      (field.type === 'select' || field.type === 'radio') &&
      !getNormalizedChoiceOption(field, stringValue)
    ) {
      errors[field.field_id] = `Please choose a valid option for ${field.label}.`
    }
  }

  return errors
}