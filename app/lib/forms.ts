import { getPageByPath, getPageBySlug } from './wordpress'
import { stripHtml } from './html'
import {
  getSubmitterCopyTargetFields,
  isReservedNameField,
  validateFormConfiguration,
} from './formConfiguration'
import type {
  ContentBlock,
  FormBlock,
  FormDeliveryTarget,
  WPFormField,
  WPFormFieldOption,
  WPPage,
} from '~/types/wordpress'

export type FormSubmissionValue = boolean | number | string | string[] | null

export interface FormSubmissionPayload {
  pagePath: string
  formId: string
  values: Record<string, FormSubmissionValue>
  honeypot?: string
  requestSubmitterCopy?: boolean
}

export interface TrustedFormSubmissionConfig {
  page: WPPage
  normalizedPagePath: string
  form: FormBlock
  emailTo: string
  emailSubject: string
  deliveryTarget: FormDeliveryTarget
  offerSubmitterEmailCopy?: boolean
  submitterCopyFieldId?: string
  vscoSendEmailNotification: boolean
}

export interface ValidatedFormSubmission {
  fieldErrors: Record<string, string>
  sanitizedValues: Record<string, FormSubmissionValue>
  displayValues: Array<{ fieldId: string; label: string; value: string }>
  replyTo?: string
  submitterCopyTo?: string
}

interface ValidateFormSubmissionOptions {
  requestSubmitterCopy?: boolean
}

const HOME_SLUG = 'home'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isFormBlock = (block: ContentBlock): block is FormBlock => block.acf_fc_layout === 'form_block'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isFormSubmissionValue = (value: unknown): value is FormSubmissionValue => {
  if (value === null) return true
  if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
    return true
  }

  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

export function normalizeFormPagePath(pagePath: string): string {
  const trimmedPath = pagePath.trim()
  if (!trimmedPath) return HOME_SLUG

  const withoutOrigin = trimmedPath.replace(/^https?:\/\/[^/]+/i, '')
  const [withoutQuery] = withoutOrigin.split(/[?#]/, 1)
  const normalized = withoutQuery.replace(/^\/+|\/+$/g, '')

  return normalized || HOME_SLUG
}

const normalizeStringArray = (value: unknown): string[] => {
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
export { validateFormConfiguration } from './formConfiguration'

const getCheckboxOptions = (field: Extract<WPFormField, { type: 'checkbox' }>): WPFormFieldOption[] => {
  const options =
    field.options
      ?.map((option) => ({
        label: option.label?.trim() || option.value?.trim() || field.label,
        value: option.value?.trim() || '',
      }))
      .filter((option) => option.value) ?? []

  if (options.length > 0) {
    return options
  }

  return [
    {
      label: field.checkbox_label?.trim() || field.label,
      value: field.field_id,
    },
  ]
}

const getCheckboxSelectedValues = (
  field: Extract<WPFormField, { type: 'checkbox' }>,
  value: FormSubmissionValue,
): string[] => {
  const optionValues = new Set(getCheckboxOptions(field).map((option) => option.value))
  const rawValues = normalizeStringArray(value)

  if (rawValues.length > 0) {
    return rawValues.filter((candidate) => optionValues.has(candidate))
  }

  if (value === true) {
    const [firstOption] = getCheckboxOptions(field)
    return firstOption ? [firstOption.value] : []
  }

  return []
}

const isNameField = (field: WPFormField): boolean =>
  isReservedNameField(field)

const isFieldRequiredAndEmpty = (field: WPFormField, value: FormSubmissionValue): boolean => {
  if (!field.required && !isNameField(field)) return false
  if (field.type === 'checkbox') return !Array.isArray(value) || value.length === 0
  if (value === null) return true
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'string') return value.trim() === ''
  return false
}

const formatSelectOption = (field: WPFormField, rawValue: string): string => {
  if (field.type !== 'select' && field.type !== 'radio') return rawValue
  return field.options.find((option) => option.value === rawValue)?.label ?? rawValue
}

const formatDisplayValue = (field: WPFormField, value: FormSubmissionValue): string => {
  if (value === null) return 'Not provided'
  if (field.type === 'checkbox') {
    const selectedValues = getCheckboxSelectedValues(field, value)
    if (selectedValues.length === 0) return 'None selected'

    const labels = selectedValues.map((selectedValue) => {
      const option = getCheckboxOptions(field).find((candidate) => candidate.value === selectedValue)
      return option?.label ?? selectedValue
    })

    return labels.join(', ')
  }
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.join(', ') || 'Not provided'
  if ((field.type === 'select' || field.type === 'radio') && typeof value === 'string') {
    return formatSelectOption(field, value)
  }
  if (typeof value === 'string') return value || 'Not provided'
  return 'Not provided'
}

const sanitizeStringValue = (value: FormSubmissionValue): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

const normalizeDeliveryTarget = (value?: string): FormDeliveryTarget => {
  if (value === 'email' || value === 'vsco' || value === 'both') {
    return value
  }

  return 'email'
}

const toVscoSubmissionValue = (value: FormSubmissionValue): string | null => {
  if (value === null || value === undefined) return null

  if (Array.isArray(value)) {
    const normalized = value
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter(Boolean)

    if (normalized.length === 0) return null
    return normalized.join(', ')
  }

  if (typeof value === 'number') {
    return String(value)
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }

  return null
}

const hasValidChoiceOption = (field: WPFormField, candidate: string): boolean => {
  if (field.type !== 'select' && field.type !== 'radio') return false
  return field.options.some((option) => option.value === candidate)
}

export function validateFormSubmission(
  form: FormBlock,
  values: Record<string, FormSubmissionValue>,
  options: ValidateFormSubmissionOptions = {},
): ValidatedFormSubmission {
  const fieldErrors: Record<string, string> = {}
  const sanitizedValues: Record<string, FormSubmissionValue> = {}
  const displayValues: Array<{ fieldId: string; label: string; value: string }> = []
  const knownFieldIds = new Set(form.fields.map((field) => field.field_id))
  const submitterCopyTargetFieldId = getSubmitterCopyTargetFields(form)[0]?.field_id

  for (const key of Object.keys(values)) {
    if (!knownFieldIds.has(key)) {
      fieldErrors[key] = 'Unknown field.'
    }
  }

  let firstValidEmail: string | undefined
  let submitterCopyTargetEmail: string | undefined

  for (const field of form.fields) {
    const rawValue = values[field.field_id]
    let sanitizedValue: FormSubmissionValue = null

    switch (field.type) {
      case 'checkbox': {
        const options = getCheckboxOptions(field)
        const optionValues = new Set(options.map((option) => option.value))
        const selectedValues = getCheckboxSelectedValues(field, rawValue)
        const submittedValues =
          Array.isArray(rawValue) && rawValue.every((item) => typeof item === 'string')
            ? normalizeStringArray(rawValue)
            : typeof rawValue === 'string'
              ? normalizeStringArray([rawValue])
              : rawValue === true
                ? selectedValues
                : []

        const hasInvalidSelection = submittedValues.some((candidate) => !optionValues.has(candidate))

        if (hasInvalidSelection) {
          fieldErrors[field.field_id] = `Please choose valid options for ${field.label}.`
        }

        sanitizedValue = selectedValues
        break
      }
      case 'number': {
        if (rawValue === null || rawValue === undefined || rawValue === '') {
          sanitizedValue = null
          break
        }
        const numericValue =
          typeof rawValue === 'number'
            ? rawValue
            : typeof rawValue === 'string'
              ? Number(rawValue)
              : Number.NaN

        if (Number.isNaN(numericValue)) {
          fieldErrors[field.field_id] = `${field.label} must be a valid number.`
        } else {
          if (typeof field.min === 'number' && numericValue < field.min) {
            fieldErrors[field.field_id] = `${field.label} must be at least ${field.min}.`
          }
          if (typeof field.max === 'number' && numericValue > field.max) {
            fieldErrors[field.field_id] = `${field.label} must be no more than ${field.max}.`
          }
          sanitizedValue = numericValue
        }
        break
      }
      case 'select':
      case 'radio': {
        const stringValue = sanitizeStringValue(rawValue)
        sanitizedValue = stringValue
        if (stringValue && !hasValidChoiceOption(field, stringValue)) {
          fieldErrors[field.field_id] = `Please choose a valid option for ${field.label}.`
        }
        break
      }
      case 'text':
      case 'email':
      case 'tel':
      case 'date':
      case 'time':
      case 'datetime-local':
      case 'textarea': {
        sanitizedValue = sanitizeStringValue(rawValue)
        if (field.type === 'email' && typeof sanitizedValue === 'string' && !EMAIL_PATTERN.test(sanitizedValue)) {
          fieldErrors[field.field_id] = `${field.label} must be a valid email address.`
        } else if (field.type === 'email' && typeof sanitizedValue === 'string') {
          if (!firstValidEmail) {
            firstValidEmail = sanitizedValue
          }

          if (field.field_id === submitterCopyTargetFieldId) {
            submitterCopyTargetEmail = sanitizedValue
          }
        }
        break
      }
    }

    if (!fieldErrors[field.field_id] && isFieldRequiredAndEmpty(field, sanitizedValue)) {
      fieldErrors[field.field_id] = `${field.label} is required.`
    }

    if (
      options.requestSubmitterCopy &&
      field.field_id === submitterCopyTargetFieldId &&
      !fieldErrors[field.field_id] &&
      (typeof sanitizedValue !== 'string' || !sanitizedValue)
    ) {
      fieldErrors[field.field_id] = `${field.label} is required to receive a copy of the form.`
    }

    sanitizedValues[field.field_id] = sanitizedValue
    displayValues.push({
      fieldId: field.field_id,
      label: field.label,
      value: formatDisplayValue(field, sanitizedValue),
    })
  }

  return {
    fieldErrors,
    sanitizedValues,
    displayValues,
    replyTo: submitterCopyTargetEmail || firstValidEmail,
    submitterCopyTo: options.requestSubmitterCopy ? submitterCopyTargetEmail : undefined,
  }
}

const buildSubmittedFieldLines = (
  form: FormBlock,
  validated: ValidatedFormSubmission,
): string[] =>
  form.fields.flatMap((field) => {
    const value = validated.sanitizedValues[field.field_id] ?? null

    if (field.type !== 'checkbox') {
      return [`- ${field.label}: ${formatDisplayValue(field, value)}`]
    }

    const selectedValues = new Set(getCheckboxSelectedValues(field, value))
    const options = getCheckboxOptions(field)

    return [
      `- ${field.label}:`,
      ...options.map(
        (option) => `  - ${option.label}: ${selectedValues.has(option.value) ? 'True' : 'False'}`,
      ),
    ]
  })

export function buildFormSubmissionEmailText(
  config: TrustedFormSubmissionConfig,
  validated: ValidatedFormSubmission,
): string {
  const heading = config.form.heading?.trim() || 'Website form submission'
  const pagePath = config.normalizedPagePath === HOME_SLUG ? '/' : `/${config.normalizedPagePath}`
  const submittedFieldLines = buildSubmittedFieldLines(config.form, validated)

  const lines = [
    heading,
    '',
    `Page: ${pagePath}`,
    `Form ID: ${config.form.form_id}`,
    `Page title: ${stripHtml(config.page.title.rendered)}`,
    '',
    'Submitted fields:',
    ...submittedFieldLines,
  ]

  return lines.join('\n')
}

export function buildSubmitterCopyEmailText(
  config: TrustedFormSubmissionConfig,
  validated: ValidatedFormSubmission,
): string {
  const lines = [
    'Thanks for your submission.',
    '',
    'Here is a copy of the information you sent:',
    ...buildSubmittedFieldLines(config.form, validated),
  ]

  return lines.join('\n')
}

export function buildVscoLeadSubmissionData(
  config: TrustedFormSubmissionConfig,
  validated: ValidatedFormSubmission,
): Record<string, string> {
  const configurationErrors = validateFormConfiguration(config.form)
  if (configurationErrors.length > 0) {
    throw new Error(configurationErrors.join(' '))
  }

  const valuesByKey: Record<string, string> = {}

  for (const field of config.form.fields) {
    const rawFieldId = field.field_id?.trim()
    const integrationKey =
      field.vsco_field_key?.trim() || (rawFieldId?.toLowerCase() === 'name' ? 'FirstName' : rawFieldId)
    if (!integrationKey) continue

    const normalizedValue = toVscoSubmissionValue(validated.sanitizedValues[field.field_id] ?? null)
    if (!normalizedValue) continue

    valuesByKey[integrationKey] = normalizedValue
  }

  const getCaseInsensitiveValue = (targetKey: string): string | undefined => {
    const matchedEntry = Object.entries(valuesByKey).find(
      ([candidateKey]) => candidateKey.toLowerCase() === targetKey.toLowerCase(),
    )

    const matchedValue = matchedEntry?.[1]?.trim()
    return matchedValue || undefined
  }

  const setIfMissing = (targetKey: string, rawValue?: string) => {
    const value = rawValue?.trim()
    if (!value) return

    const hasKey = Object.keys(valuesByKey).some(
      (candidateKey) => candidateKey.toLowerCase() === targetKey.toLowerCase(),
    )
    if (hasKey) return

    valuesByKey[targetKey] = value
  }

  const fullName = getCaseInsensitiveValue('Name') || getCaseInsensitiveValue('FullName')
  if (!getCaseInsensitiveValue('FirstName') && fullName) {
    const [firstName, ...restOfName] = fullName.split(/\s+/)
    setIfMissing('FirstName', firstName)
    if (restOfName.length > 0) {
      setIfMissing('LastName', restOfName.join(' '))
    }
  }

  setIfMissing('FirstName', 'Website')
  setIfMissing('Email', validated.replyTo)
  setIfMissing('JobType', config.form.vsco_job_type)
  setIfMissing(
    'Source',
    config.form.vsco_source ||
      `Website (${config.normalizedPagePath === HOME_SLUG ? '/' : `/${config.normalizedPagePath}`})`,
  )
  setIfMissing('Brand', config.form.vsco_brand)

  if (!getCaseInsensitiveValue('Message')) {
    const fallbackMessage = validated.displayValues
      .map((item) => `${item.label}: ${item.value}`)
      .join('\n')
      .trim()

    setIfMissing('Message', fallbackMessage)
  }

  if (!getCaseInsensitiveValue('FirstName')) {
    throw new Error('VSCO integration requires FirstName.')
  }

  if (!getCaseInsensitiveValue('JobType')) {
    throw new Error(
      'VSCO integration requires JobType. Set a field mapped to JobType or configure VSCO Job Type in WordPress.',
    )
  }

  return valuesByKey
}

export function getFormSuccessMessage(form: FormBlock): string {
  return form.success_message?.trim() || 'Thanks. Your message has been sent.'
}

export function stripSensitiveFormBlockData(page: WPPage): WPPage {
  if (!page.acf?.blocks?.length) return page

  return {
    ...page,
    acf: {
      ...page.acf,
      blocks: page.acf.blocks.map((block) => {
        if (!isFormBlock(block)) return block

        const {
          email_subject: _emailSubject,
          email_to: _emailTo,
          delivery_target: _deliveryTarget,
          vsco_job_type: _vscoJobType,
          vsco_source: _vscoSource,
          vsco_brand: _vscoBrand,
          vsco_send_email_notification: _vscoSendEmailNotification,
          ...publicBlock
        } = block
        return publicBlock as FormBlock
      }),
    },
  }
}

export function parseFormSubmissionPayload(input: unknown): FormSubmissionPayload | null {
  if (!isRecord(input)) return null

  const { formId, honeypot, pagePath, requestSubmitterCopy, values } = input

  if (typeof pagePath !== 'string' || typeof formId !== 'string' || !isRecord(values)) {
    return null
  }

  if (requestSubmitterCopy !== undefined && typeof requestSubmitterCopy !== 'boolean') {
    return null
  }

  const normalizedValues: Record<string, FormSubmissionValue> = {}

  for (const [key, value] of Object.entries(values)) {
    if (!isFormSubmissionValue(value)) return null
    normalizedValues[key] = value
  }

  return {
    pagePath,
    formId,
    values: normalizedValues,
    honeypot: typeof honeypot === 'string' ? honeypot : undefined,
    requestSubmitterCopy,
  }
}

async function getPageForFormPath(pagePath: string): Promise<WPPage | null> {
  const normalizedPath = normalizeFormPagePath(pagePath)
  const flatPage = await getPageBySlug(normalizedPath)
  if (flatPage) return flatPage

  if (!normalizedPath.includes('/')) return null

  return getPageByPath(normalizedPath)
}

export async function getTrustedFormSubmissionConfig(
  pagePath: string,
  formId: string,
): Promise<TrustedFormSubmissionConfig | null> {
  const normalizedFormId = formId.trim()
  if (!normalizedFormId) return null

  const normalizedPagePath = normalizeFormPagePath(pagePath)
  const page = await getPageForFormPath(normalizedPagePath)

  if (!page?.acf?.blocks?.length) return null

  const form = page.acf.blocks.find(
    (block): block is FormBlock => isFormBlock(block) && block.form_id === normalizedFormId,
  )

  if (!form) return null

  return {
    page,
    normalizedPagePath,
    form,
    emailTo: form.email_to?.trim() ?? '',
    emailSubject: form.email_subject?.trim() ?? '',
    deliveryTarget: normalizeDeliveryTarget(form.delivery_target),
    offerSubmitterEmailCopy: form.offer_submitter_email_copy === true,
    submitterCopyFieldId: getSubmitterCopyTargetFields(form)[0]?.field_id,
    vscoSendEmailNotification: form.vsco_send_email_notification !== false,
  }
}