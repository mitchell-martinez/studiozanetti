export interface SendVscoLeadArgs {
  fields: Record<string, string>
  sendEmailNotification?: boolean
}

interface VscoConfig {
  studioId: string
  secretKey: string
  endpoint: string
  timeoutMs: number
}

const DEFAULT_VSCO_API_BASE = 'https://workspace.vsco.co'
const DEFAULT_VSCO_TIMEOUT_MS = 10_000

const parseTimeout = (rawValue?: string): number => {
  if (!rawValue) return DEFAULT_VSCO_TIMEOUT_MS

  const parsed = Number.parseInt(rawValue, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_VSCO_TIMEOUT_MS
  }

  return parsed
}

function getVscoConfig(): VscoConfig {
  const studioId = process.env.VSCO_WORKSPACE_STUDIO_ID?.trim()
  const secretKey = process.env.VSCO_WORKSPACE_SECRET_KEY?.trim()

  if (!studioId || !secretKey) {
    throw new Error('VSCO_WORKSPACE_STUDIO_ID and VSCO_WORKSPACE_SECRET_KEY must be configured.')
  }

  const baseUrl = (process.env.VSCO_WORKSPACE_API_BASE?.trim() || DEFAULT_VSCO_API_BASE).replace(
    /\/+$/,
    '',
  )

  return {
    studioId,
    secretKey,
    endpoint: `${baseUrl}/webservice/create-lead/${encodeURIComponent(studioId)}`,
    timeoutMs: parseTimeout(process.env.VSCO_WORKSPACE_TIMEOUT_MS),
  }
}

export async function sendVscoLead(args: SendVscoLeadArgs): Promise<void> {
  const config = getVscoConfig()

  const bodyParams = new URLSearchParams()
  for (const [key, value] of Object.entries(args.fields)) {
    const normalizedKey = key.trim()
    const normalizedValue = value.trim()

    if (!normalizedKey || !normalizedValue) continue
    bodyParams.append(normalizedKey, normalizedValue)
  }
  bodyParams.set('SecretKey', config.secretKey)

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
  }
  if (args.sendEmailNotification === false) {
    headers['X-Tave-No-Email-Notification'] = 'true'
  }

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers,
    body: bodyParams.toString(),
    signal: AbortSignal.timeout(config.timeoutMs),
  })

  const responseText = (await response.text()).trim()

  if (!response.ok) {
    throw new Error(`VSCO request failed with status ${response.status}: ${responseText || response.statusText}`)
  }

  if (responseText !== 'OK') {
    throw new Error(`VSCO request failed: expected "OK" but received "${responseText || '(empty)'}".`)
  }
}
