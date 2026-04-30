import type { ActionFunctionArgs } from 'react-router'
import { sendFormSubmissionEmail } from '~/lib/email'
import {
  buildFormSubmissionEmailText,
  getFormSuccessMessage,
  getTrustedFormSubmissionConfig,
  parseFormSubmissionPayload,
  validateFormSubmission,
} from '~/lib/forms'
import { consumeRateLimit } from '~/lib/rateLimit'

const getClientIp = (request: Request): string => {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(',')
    if (firstIp?.trim()) return firstIp.trim()
  }

  return (
    request.headers.get('cf-connecting-ip')?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    'anonymous'
  )
}

/**
 * Resource route for form submissions.
 *
 * The browser is allowed to submit only the page path, form id, and values.
 * Recipient and subject are always resolved server-side from the current
 * WordPress form block so they cannot be injected by the frontend.
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed.' }, { status: 405 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON payload.' }, { status: 400 })
  }

  const payload = parseFormSubmissionPayload(body)
  if (!payload) {
    return Response.json({ error: 'Invalid form submission payload.' }, { status: 400 })
  }

  const trustedConfig = await getTrustedFormSubmissionConfig(payload.pagePath, payload.formId)
  if (!trustedConfig) {
    return Response.json({ error: 'Form configuration not found.' }, { status: 404 })
  }

  if (payload.honeypot?.trim()) {
    return Response.json({ success: true, message: getFormSuccessMessage(trustedConfig.form) })
  }

  const clientIp = getClientIp(request)
  const rateLimitResult = consumeRateLimit(
    `${trustedConfig.normalizedPagePath}:${trustedConfig.form.form_id}:${clientIp}`,
  )
  if (!rateLimitResult.allowed) {
    return Response.json(
      { error: 'Too many submissions. Please wait a moment and try again.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimitResult.retryAfterSeconds) },
      },
    )
  }

  if (!trustedConfig.emailTo || !trustedConfig.emailSubject) {
    return Response.json({ error: 'Form email settings are incomplete.' }, { status: 422 })
  }

  const validatedSubmission = validateFormSubmission(trustedConfig.form, payload.values)
  if (Object.keys(validatedSubmission.fieldErrors).length > 0) {
    return Response.json(
      {
        error: 'Please correct the highlighted fields and try again.',
        fieldErrors: validatedSubmission.fieldErrors,
      },
      { status: 422 },
    )
  }

  try {
    await sendFormSubmissionEmail({
      to: trustedConfig.emailTo,
      subject: trustedConfig.emailSubject,
      text: buildFormSubmissionEmailText(trustedConfig, validatedSubmission),
      replyTo: validatedSubmission.replyTo,
    })
  } catch (error) {
    console.error('[forms.submit] failed to send email', error)
    return Response.json(
      { error: 'We could not send your message right now. Please try again shortly.' },
      { status: 502 },
    )
  }

  return Response.json({ success: true, message: getFormSuccessMessage(trustedConfig.form) })
}