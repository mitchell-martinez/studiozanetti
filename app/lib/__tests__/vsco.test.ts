import { afterEach, describe, expect, it, vi } from 'vitest'

import { sendVscoLead } from '../vsco'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('sendVscoLead', () => {
  it('posts URL-encoded lead data to the VSCO Workspace endpoint', async () => {
    vi.stubEnv('VSCO_WORKSPACE_STUDIO_ID', '123456')
    vi.stubEnv('VSCO_WORKSPACE_SECRET_KEY', 'secret-key')
    vi.stubEnv('VSCO_WORKSPACE_API_BASE', 'https://workspace.vsco.co')

    const fetchMock = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await sendVscoLead({
      fields: {
        FirstName: 'Mitchell',
        JobType: 'Wedding',
        Email: 'mitchell@example.com',
      },
      sendEmailNotification: false,
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]

    expect(url).toBe('https://workspace.vsco.co/webservice/create-lead/123456')
    expect(options.method).toBe('POST')
    expect(options.headers).toMatchObject({
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'X-Tave-No-Email-Notification': 'true',
    })

    const body = String(options.body || '')
    const bodyParams = new URLSearchParams(body)

    expect(bodyParams.get('FirstName')).toBe('Mitchell')
    expect(bodyParams.get('JobType')).toBe('Wedding')
    expect(bodyParams.get('Email')).toBe('mitchell@example.com')
    expect(bodyParams.get('SecretKey')).toBe('secret-key')
  })

  it('throws when required VSCO credentials are missing', async () => {
    await expect(
      sendVscoLead({
        fields: {
          FirstName: 'Mitchell',
          JobType: 'Wedding',
        },
      }),
    ).rejects.toThrow(/VSCO_WORKSPACE_STUDIO_ID and VSCO_WORKSPACE_SECRET_KEY/)
  })

  it('throws when VSCO returns a non-OK response body', async () => {
    vi.stubEnv('VSCO_WORKSPACE_STUDIO_ID', '123456')
    vi.stubEnv('VSCO_WORKSPACE_SECRET_KEY', 'secret-key')

    const fetchMock = vi.fn().mockResolvedValue(new Response('Unexpected', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      sendVscoLead({
        fields: {
          FirstName: 'Mitchell',
          JobType: 'Wedding',
        },
      }),
    ).rejects.toThrow(/expected "OK"/)
  })
})
