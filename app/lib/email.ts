import nodemailer from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'

export interface SendFormSubmissionEmailArgs {
  to: string
  subject: string
  text: string
  replyTo?: string
}

interface SmtpConfig {
  fromEmail: string
  fromName?: string
  transportOptions: SMTPTransport.Options
}

let cachedTransport: nodemailer.Transporter | null = null
let cachedTransportKey = ''

const buildFromAddress = (email: string, name?: string): string => {
  if (!name?.trim()) return email
  return `${name.trim()} <${email}>`
}

const normalizeEhloName = (value?: string): string | undefined => {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return undefined
  }

  const withoutProtocol = trimmedValue.replace(/^[a-z]+:\/\//i, '')
  const hostname = withoutProtocol.split('/')[0]?.trim().replace(/:\d+$/, '')

  if (!hostname || hostname.includes(' ')) {
    return undefined
  }

  return hostname
}

const getEhloName = (fromEmail: string): string | undefined => {
  const explicitName = normalizeEhloName(process.env.SMTP_HELO_NAME)

  if (explicitName) {
    return explicitName
  }

  const siteUrlName = normalizeEhloName(process.env.SITE_URL)

  if (siteUrlName) {
    return siteUrlName
  }

  const fromDomain = fromEmail.split('@')[1]?.trim()

  return normalizeEhloName(fromDomain)
}

function getSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST?.trim()
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim()

  if (!host || !fromEmail) {
    throw new Error('SMTP_HOST and SMTP_FROM_EMAIL must be configured.')
  }

  const port = Math.max(1, Number.parseInt(process.env.SMTP_PORT ?? '', 10) || 587)
  const secure =
    process.env.SMTP_SECURE?.trim() === 'true'
      ? true
      : process.env.SMTP_SECURE?.trim() === 'false'
        ? false
        : port === 465

  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS ?? ''

  const transportOptions: SMTPTransport.Options = {
    host,
    port,
    secure,
  }

  const name = getEhloName(fromEmail)

  if (name) {
    transportOptions.name = name
  }

  if (user) {
    transportOptions.auth = { user, pass }
  }

  return {
    fromEmail,
    fromName: process.env.SMTP_FROM_NAME?.trim() || undefined,
    transportOptions,
  }
}

function getTransport(): {
  fromEmail: string
  fromName?: string
  transporter: nodemailer.Transporter
} {
  const config = getSmtpConfig()
  const transportKey = JSON.stringify(config.transportOptions)

  if (!cachedTransport || cachedTransportKey !== transportKey) {
    cachedTransport = nodemailer.createTransport(config.transportOptions)
    cachedTransportKey = transportKey
  }

  return {
    fromEmail: config.fromEmail,
    fromName: config.fromName,
    transporter: cachedTransport,
  }
}

export async function sendFormSubmissionEmail(args: SendFormSubmissionEmailArgs) {
  const { fromEmail, fromName, transporter } = getTransport()

  await transporter.sendMail({
    from: buildFromAddress(fromEmail, fromName),
    to: args.to,
    subject: args.subject,
    text: args.text,
    replyTo: args.replyTo,
    envelope: {
      from: fromEmail,
      to: [args.to],
    },
  })
}

export function clearEmailTransportCache() {
  cachedTransport = null
  cachedTransportKey = ''
}