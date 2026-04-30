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