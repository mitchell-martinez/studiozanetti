import { useState } from 'react'
import { useLocation } from 'react-router'
import Button from '~/components/Button'
import RichText from '~/components/RichText'
import {
  getEffectiveNumberFieldMin,
  getSubmitterCopyTargetFields,
  validateFormConfiguration,
} from '~/lib/formConfiguration'
import type { WPFormFieldOption } from '~/types/wordpress'
import { getBackgroundImageStyle, getSectionStyle } from '../helpers/styleOptions'
import sharedStyles from '../shared.module.scss'
import styles from './FormBlock.module.scss'
import {
  createInitialClientFormValues,
  type ClientFormValue,
  validateClientFormValues,
} from './helpers/clientForm'
import type { FormBlockProps } from './types'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

const SUBMIT_ERROR_RESHOW_DELAY_MS = 80
const SUBMITTER_COPY_LABEL = 'Receive a copy of this form to my email'

interface SubmitResponse {
  success?: boolean
  message?: string
  error?: string
  fieldErrors?: Record<string, string>
}

const headingAlignClass: Record<string, string> = {
  left: styles.alignLeft,
  center: styles.alignCenter,
  right: styles.alignRight,
}

const formAlignClass: Record<string, string> = {
  left: styles.formAlignLeft,
  center: styles.formAlignCenter,
}

const submitAlignClass: Record<string, string> = {
  left: styles.submitLeft,
  center: styles.submitCenter,
}

const getCheckboxOptions = (field: {
  field_id: string
  label: string
  options?: WPFormFieldOption[]
  checkbox_label?: string
}): WPFormFieldOption[] => {
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

const FormBlock = ({ block }: FormBlockProps) => {
  const location = useLocation()
  const [values, setValues] = useState(() => createInitialClientFormValues(block.fields))
  const [honeypot, setHoneypot] = useState('')
  const [requestSubmitterCopy, setRequestSubmitterCopy] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null)
  const [isSubmitErrorVisible, setIsSubmitErrorVisible] = useState(false)

  const HeadingTag = block.heading_tag ?? 'h2'
  const backgroundImageStyle = getBackgroundImageStyle(block)
  const headingAlignment = headingAlignClass[block.heading_align ?? 'left'] ?? styles.alignLeft
  const formAlignment = formAlignClass[block.form_alignment ?? 'left'] ?? styles.formAlignLeft
  const submitAlignment =
    submitAlignClass[block.submit_alignment ?? 'left'] ?? styles.submitLeft
  const submitText = block.submit_text?.trim() || 'Send message'
  const sectionId = block.form_id?.trim() || undefined
  const formConfigurationErrors = validateFormConfiguration(block)
  const isFormAvailable = formConfigurationErrors.length === 0
  const shouldOfferSubmitterCopy =
    isFormAvailable &&
    block.offer_submitter_email_copy === true &&
    getSubmitterCopyTargetFields(block).length === 1

  const showSubmitError = (nextMessage: string) => {
    setSubmitErrorMessage(nextMessage)

    // Force a brief clear/re-show cycle when users submit again with errors,
    // so the bottom error notice reads like a fresh response to the new click.
    window.setTimeout(() => {
      setIsSubmitErrorVisible(true)
    }, SUBMIT_ERROR_RESHOW_DELAY_MS)
  }

  const handleValueChange = (fieldId: string, value: ClientFormValue) => {
    setValues((currentValues) => ({ ...currentValues, [fieldId]: value }))
    setFieldErrors((currentErrors) => {
      if (!currentErrors[fieldId]) return currentErrors
      const nextErrors = { ...currentErrors }
      delete nextErrors[fieldId]
      return nextErrors
    })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (submitState === 'submitting') {
      return
    }

    setIsSubmitErrorVisible(false)
    setSubmitErrorMessage(null)

    const nextErrors = validateClientFormValues(block.fields, values, {
      requestSubmitterCopy: shouldOfferSubmitterCopy && requestSubmitterCopy,
    })
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      setSubmitState('error')
      showSubmitError('Please correct the highlighted fields and try again.')
      return
    }

    setSubmitState('submitting')
    setFieldErrors({})
    setSuccessMessage(null)

    try {
      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pagePath: location.pathname,
          formId: block.form_id,
          honeypot,
          requestSubmitterCopy: shouldOfferSubmitterCopy && requestSubmitterCopy,
          values,
        }),
      })

      const payload = (await response.json()) as SubmitResponse
      if (!response.ok) {
        setFieldErrors(payload.fieldErrors ?? {})
        setSubmitState('error')
        showSubmitError(payload.error ?? 'We could not send your message right now. Please try again.')
        return
      }

      setValues(createInitialClientFormValues(block.fields))
      setHoneypot('')
      setRequestSubmitterCopy(false)
      setFieldErrors({})
      setSubmitState('success')
      setSuccessMessage(payload.message ?? 'Thanks. Your message has been sent.')
    } catch (error) {
      console.error('[FormBlock] submit failed', error)
      setSubmitState('error')
      showSubmitError('We could not send your message right now. Please try again shortly.')
    }
  }

  return (
    <section id={sectionId} className={styles.section} style={getSectionStyle(block)}>
      {backgroundImageStyle && (
        <div
          className={sharedStyles.backgroundImage}
          style={backgroundImageStyle}
          aria-hidden="true"
        />
      )}

      <div className={styles.inner}>
        {(block.heading || block.intro) && (
          <header className={`${styles.header} ${headingAlignment} ${formAlignment}`.trim()}>
            {block.heading && <HeadingTag className={styles.heading}>{block.heading}</HeadingTag>}
            {block.intro && (
              <div className={styles.intro}>
                <RichText html={block.intro} fontSize="sm" />
              </div>
            )}
          </header>
        )}

        <div className={`${styles.panel} ${formAlignment}`.trim()}>
          {!isFormAvailable && (
            <div className={`${styles.notice} ${styles.noticeTop} ${styles.noticeError}`.trim()} role="alert">
              This form is unavailable right now. Please contact us another way while the form settings are fixed.
            </div>
          )}

          {submitState === 'success' && successMessage && (
            <div
              className={`${styles.notice} ${styles.noticeTop} ${styles.noticeSuccess}`.trim()}
              role="status"
            >
              {successMessage}
            </div>
          )}

          {isFormAvailable && submitState !== 'success' && (
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <div className={styles.honeypot} aria-hidden="true">
                <label htmlFor={`${block.form_id}-website`}>Website</label>
                <input
                  id={`${block.form_id}-website`}
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(event) => setHoneypot(event.currentTarget.value)}
                />
              </div>

              <fieldset className={styles.fieldset} disabled={submitState === 'submitting'}>
                {block.fields.map((field) => {
                  const inputId = `${block.form_id}-${field.field_id}`
                  const helpId = field.help_text ? `${inputId}-help` : undefined
                  const errorId = fieldErrors[field.field_id] ? `${inputId}-error` : undefined
                  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined
                  const rawValue = values[field.field_id]
                  const stringValue = typeof rawValue === 'string' ? rawValue : ''
                  const hasError = Boolean(fieldErrors[field.field_id])

                  if (field.type === 'radio') {
                    return (
                      <fieldset key={field.field_id} className={styles.fieldGroup}>
                        <legend className={styles.legend}>
                          {field.label}
                          {field.required && <span className={styles.required}> *</span>}
                        </legend>
                        {field.help_text && (
                          <p id={helpId} className={styles.helpText}>
                            {field.help_text}
                          </p>
                        )}
                        <div className={styles.choiceGroup} role="radiogroup" aria-describedby={describedBy}>
                          {field.options.map((option) => (
                            <label key={option.value} className={styles.choiceLabel}>
                              <input
                                type="radio"
                                name={field.field_id}
                                value={option.value}
                                checked={stringValue === option.value}
                                onChange={(event) => handleValueChange(field.field_id, event.currentTarget.value)}
                                aria-invalid={hasError}
                              />
                              <span>{option.label}</span>
                            </label>
                          ))}
                        </div>
                        {fieldErrors[field.field_id] && (
                          <p id={errorId} className={styles.errorText}>
                            {fieldErrors[field.field_id]}
                          </p>
                        )}
                      </fieldset>
                    )
                  }

                  if (field.type === 'checkbox') {
                    const checkboxOptions = getCheckboxOptions(field)
                    const selectedValues =
                      Array.isArray(rawValue)
                        ? rawValue.filter((value): value is string => typeof value === 'string')
                        : []

                    return (
                      <fieldset
                        key={field.field_id}
                        className={`${styles.fieldGroup} ${styles.checkboxFieldset}`.trim()}
                      >
                        <legend className={styles.legend}>
                          {field.label}
                          {field.required && <span className={styles.required}> *</span>}
                        </legend>
                        {field.help_text && (
                          <p id={helpId} className={styles.helpText}>
                            {field.help_text}
                          </p>
                        )}
                        <div className={styles.choiceGroup} role="group" aria-describedby={describedBy}>
                          {checkboxOptions.map((option) => (
                            <label key={option.value} className={styles.choiceLabel}>
                              <input
                                id={`${inputId}-${option.value}`}
                                name={`${field.field_id}[]`}
                                type="checkbox"
                                value={option.value}
                                checked={selectedValues.includes(option.value)}
                                onChange={(event) => {
                                  const nextSelection = event.currentTarget.checked
                                    ? Array.from(new Set([...selectedValues, option.value]))
                                    : selectedValues.filter((value) => value !== option.value)
                                  handleValueChange(field.field_id, nextSelection)
                                }}
                                aria-invalid={hasError}
                              />
                              <span>{option.label}</span>
                            </label>
                          ))}
                        </div>
                        {fieldErrors[field.field_id] && (
                          <p id={errorId} className={styles.errorText}>
                            {fieldErrors[field.field_id]}
                          </p>
                        )}
                      </fieldset>
                    )
                  }

                  return (
                    <div key={field.field_id} className={styles.fieldGroup}>
                      <label htmlFor={inputId} className={styles.label}>
                        {field.label}
                        {field.required && <span className={styles.required}> *</span>}
                      </label>
                      {field.help_text && (
                        <p id={helpId} className={styles.helpText}>
                          {field.help_text}
                        </p>
                      )}

                      {field.type === 'textarea' ? (
                        <textarea
                          id={inputId}
                          name={field.field_id}
                          className={`${styles.input} ${styles.textarea}`.trim()}
                          placeholder={field.placeholder}
                          rows={field.rows ?? 5}
                          value={stringValue}
                          onChange={(event) => handleValueChange(field.field_id, event.currentTarget.value)}
                          aria-invalid={hasError}
                          aria-describedby={describedBy}
                        />
                      ) : field.type === 'select' ? (
                        <div className={styles.selectWrap}>
                          <select
                            id={inputId}
                            name={field.field_id}
                            className={`${styles.input} ${styles.select}`.trim()}
                            value={stringValue}
                            onChange={(event) => handleValueChange(field.field_id, event.currentTarget.value)}
                            aria-invalid={hasError}
                            aria-describedby={describedBy}
                          >
                            <option value="">{field.placeholder || 'Select an option'}</option>
                            {field.options.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <input
                          id={inputId}
                          name={field.field_id}
                          className={styles.input}
                          type={field.type}
                          placeholder={field.placeholder}
                          value={stringValue}
                          autoComplete={field.type === 'text' || field.type === 'email' || field.type === 'tel' ? field.autocomplete : undefined}
                          min={field.type === 'number' ? getEffectiveNumberFieldMin(field) : undefined}
                          max={field.type === 'number' && typeof field.max === 'number' ? field.max : undefined}
                          step={field.type === 'number' && typeof field.step === 'number' ? field.step : undefined}
                          onChange={(event) => handleValueChange(field.field_id, event.currentTarget.value)}
                          aria-invalid={hasError}
                          aria-describedby={describedBy}
                        />
                      )}

                      {fieldErrors[field.field_id] && (
                        <p id={errorId} className={styles.errorText}>
                          {fieldErrors[field.field_id]}
                        </p>
                      )}
                    </div>
                  )
                })}

                {shouldOfferSubmitterCopy && (
                  <div className={styles.fieldGroup}>
                    <label htmlFor={`${block.form_id}-request-submitter-copy`} className={styles.checkboxLabel}>
                      <input
                        id={`${block.form_id}-request-submitter-copy`}
                        name="requestSubmitterCopy"
                        type="checkbox"
                        checked={requestSubmitterCopy}
                        onChange={(event) => setRequestSubmitterCopy(event.currentTarget.checked)}
                      />
                      <span>{SUBMITTER_COPY_LABEL}</span>
                    </label>
                  </div>
                )}
              </fieldset>

              <div className={`${styles.submitRow} ${submitAlignment}`.trim()}>
                <Button
                  type="submit"
                  variant="primary"
                  className={styles.submitButton}
                  disabled={submitState === 'submitting'}
                >
                  {submitState === 'submitting' ? 'Sending…' : submitText}
                </Button>
              </div>

              {isSubmitErrorVisible && submitErrorMessage && (
                <div className={`${styles.notice} ${styles.noticeBottom} ${styles.noticeError}`.trim()} role="alert">
                  {submitErrorMessage}
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

export default FormBlock