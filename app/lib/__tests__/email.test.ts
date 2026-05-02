import { afterEach, describe, expect, it, vi } from 'vitest'

const { createTransport, sendMail } = vi.hoisted(() => {
  const sendMailMock = vi.fn()
  const createTransportMock = vi.fn(() => ({ sendMail: sendMailMock }))

  return {
    createTransport: createTransportMock,
    sendMail: sendMailMock,
  }
})

vi.mock('nodemailer', () => ({
  default: {
    createTransport,
  },
}))

import { clearEmailTransportCache, sendFormSubmissionEmail } from '../email'

afterEach(() => {
  clearEmailTransportCache()
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('sendFormSubmissionEmail', () => {
  it('creates an SMTP transport from env vars and sends the message', async () => {
    vi.stubEnv('SMTP_HOST', 'smtp.example.com')
    vi.stubEnv('SMTP_PORT', '587')
    vi.stubEnv('SMTP_USER', 'mailer@example.com')
    vi.stubEnv('SMTP_PASS', 'secret')
    vi.stubEnv('SMTP_FROM_EMAIL', 'noreply@example.com')
    vi.stubEnv('SMTP_FROM_NAME', 'Studio Zanetti')
    vi.stubEnv('SITE_URL', 'https://www.studiozanetti.com.au')

    await sendFormSubmissionEmail({
      to: 'hello@example.com',
      subject: 'New message',
      text: 'Test body',
      replyTo: 'client@example.com',
    })

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        name: 'www.studiozanetti.com.au',
        auth: { user: 'mailer@example.com', pass: 'secret' },
      }),
    )
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Studio Zanetti <noreply@example.com>',
        to: 'hello@example.com',
        subject: 'New message',
        text: 'Test body',
        replyTo: 'client@example.com',
        envelope: {
          from: 'noreply@example.com',
          to: ['hello@example.com'],
        },
      }),
    )
  })

  it('uses an explicit SMTP_HELO_NAME when provided', async () => {
    vi.stubEnv('SMTP_HOST', 'smtp-relay.gmail.com')
    vi.stubEnv('SMTP_PORT', '587')
    vi.stubEnv('SMTP_FROM_EMAIL', 'michael@studiozanetti.com.au')
    vi.stubEnv('SMTP_HELO_NAME', 'studiozanetti.com.au')

    await sendFormSubmissionEmail({
      to: 'hello@example.com',
      subject: 'New message',
      text: 'Test body',
    })

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp-relay.gmail.com',
        port: 587,
        secure: false,
        name: 'studiozanetti.com.au',
      }),
    )
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'info@studiozanetti.com.au',
        envelope: {
          from: 'michael@studiozanetti.com.au',
          to: ['hello@example.com'],
        },
      }),
    )
  })

  it('allows the visible From header to be overridden explicitly', async () => {
    vi.stubEnv('SMTP_HOST', 'smtp-relay.gmail.com')
    vi.stubEnv('SMTP_PORT', '587')
    vi.stubEnv('SMTP_FROM_EMAIL', 'michael@studiozanetti.com.au')
    vi.stubEnv('SMTP_FROM_HEADER_EMAIL', 'custom@studiozanetti.com.au')

    await sendFormSubmissionEmail({
      to: 'hello@example.com',
      subject: 'New message',
      text: 'Test body',
    })

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'custom@studiozanetti.com.au',
        envelope: {
          from: 'michael@studiozanetti.com.au',
          to: ['hello@example.com'],
        },
      }),
    )
  })

  it('throws when required SMTP configuration is missing', async () => {
    await expect(
      sendFormSubmissionEmail({
        to: 'hello@example.com',
        subject: 'New message',
        text: 'Test body',
      }),
    ).rejects.toThrow(/SMTP_HOST and SMTP_FROM_EMAIL/)
  })
})