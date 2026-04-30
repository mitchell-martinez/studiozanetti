import { getPageByPath, getPageBySlug } from './wordpress'
import type { ContentBlock, FormBlock, WPFormField, WPPage } from '~/types/wordpress'

export type FormSubmissionValue = boolean | number | string | string[] | null

export interface FormSubmissionPayload {
  pagePath: string
  formId: string
  values: Record<string, FormSubmissionValue>
  honeypot?: string
}

export interface TrustedFormSubmissionConfig {
  page: WPPage
  normalizedPagePath: string
  form: FormBlock
  emailTo: string
  emailSubject: string
}

export interface ValidatedFormSubmission {
  fieldErrors: Record<string, string>
  sanitizedValues: Record<string, FormSubmissionValue>
  displayValues: Array<{ fieldId: string; label: string; value: string }>
  replyTo?: string
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

const isFieldRequiredAndEmpty = (field: WPFormField, value: FormSubmissionValue): boolean => {
  if (!field.required) return false
  if (field.type === 'checkbox') return value !== true
  if (value === null) return true
  if (typeof value === 'string') return value.trim() === ''
  return false
}

const formatSelectOption = (field: WPFormField, rawValue: string): string => {
  if (field.type !== 'select' && field.type !== 'radio') return rawValue
  return field.options.find((option) => option.value === rawValue)?.label ?? rawValue
}

const formatDisplayValue = (field: WPFormField, value: FormSubmissionValue): string => {
  if (value === null) return 'Not provided'
  if (field.type === 'checkbox') return value === true ? 'Yes' : 'No'
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.join(', ')
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

const hasValidChoiceOption = (field: WPFormField, candidate: string): boolean => {
  if (field.type !== 'select' && field.type !== 'radio') return false
  return field.options.some((option) => option.value === candidate)
}

export function validateFormSubmission(
  form: FormBlock,
  values: Record<string, FormSubmissionValue>,
): ValidatedFormSubmission {
  const fieldErrors: Record<string, string> = {}
  const sanitizedValues: Record<string, FormSubmissionValue> = {}
  const displayValues: Array<{ fieldId: string; label: string; value: string }> = []
  const knownFieldIds = new Set(form.fields.map((field) => field.field_id))

  for (const key of Object.keys(values)) {
    if (!knownFieldIds.has(key)) {
      fieldErrors[key] = 'Unknown field.'
    }
  }

  let replyTo: string | undefined

  for (const field of form.fields) {
    const rawValue = values[field.field_id]
    let sanitizedValue: FormSubmissionValue = null

    switch (field.type) {
      case 'checkbox': {
        sanitizedValue = rawValue === true
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
        } else if (field.type === 'email' && typeof sanitizedValue === 'string' && !replyTo) {
          replyTo = sanitizedValue
        }
        break
      }
    }

    if (!fieldErrors[field.field_id] && isFieldRequiredAndEmpty(field, sanitizedValue)) {
      fieldErrors[field.field_id] = `${field.label} is required.`
    }

    sanitizedValues[field.field_id] = sanitizedValue
    displayValues.push({
      fieldId: field.field_id,
      label: field.label,
      value: formatDisplayValue(field, sanitizedValue),
    })
  }

  return { fieldErrors, sanitizedValues, displayValues, replyTo }
}

export function buildFormSubmissionEmailText(
  config: TrustedFormSubmissionConfig,
  validated: ValidatedFormSubmission,
): string {
  const heading = config.form.heading?.trim() || 'Website form submission'
  const pagePath = config.normalizedPagePath === HOME_SLUG ? '/' : `/${config.normalizedPagePath}`
  const lines = [
    heading,
    '',
    `Page: ${pagePath}`,
    `Form ID: ${config.form.form_id}`,
    `Page title: ${config.page.title.rendered}`,
    '',
    'Submitted fields:',
    ...validated.displayValues.flatMap((field) => [`- ${field.label}: ${field.value}`]),
  ]

  return lines.join('\n')
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

        const { email_subject: _emailSubject, email_to: _emailTo, ...publicBlock } = block
        return publicBlock as FormBlock
      }),
    },
  }
}

export function parseFormSubmissionPayload(input: unknown): FormSubmissionPayload | null {
  if (!isRecord(input)) return null

  const { formId, honeypot, pagePath, values } = input

  if (typeof pagePath !== 'string' || typeof formId !== 'string' || !isRecord(values)) {
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
  }
}