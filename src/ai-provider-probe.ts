export type AiProbeProvider = 'deepseek' | 'anthropic' | 'openai' | 'google'

export interface AiProbeResult {
  ok: boolean
  kind: 'ok' | 'auth-rejected' | 'model-unavailable' | 'network-error' | 'provider-error'
  status?: number
  message?: string
}

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

function safeProviderMessage(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return ''
  const obj = payload as Record<string, any>
  const candidates = [
    obj.error?.message,
    obj.error?.status,
    obj.message,
    obj.detail,
  ]
  return candidates.find((v) => typeof v === 'string')?.slice(0, 300) ?? ''
}

function classifyHttp(status: number, message: string): AiProbeResult {
  if (status === 401 || status === 403) return { ok: false, kind: 'auth-rejected', status, message }
  if (status === 404) return { ok: false, kind: 'model-unavailable', status, message }
  if (status === 400 && /model|not found|unsupported|unknown/i.test(message)) {
    return { ok: false, kind: 'model-unavailable', status, message }
  }
  return { ok: false, kind: 'provider-error', status, message }
}

async function parseFailure(res: Response): Promise<AiProbeResult> {
  let payload: unknown = null
  try { payload = await res.json() } catch { /* provider may return text/html */ }
  return classifyHttp(res.status, safeProviderMessage(payload) || `HTTP ${res.status}`)
}

/**
 * Tiny live inference used by onboarding to prove both credential AND chosen
 * model access. The prompt is intentionally minimal; this is not a quality
 * benchmark and should consume only a negligible number of tokens.
 */
export async function probeAiProviderCredential(
  provider: AiProbeProvider,
  model: string,
  apiKey: string,
  fetchImpl: FetchLike = fetch,
): Promise<AiProbeResult> {
  const key = apiKey.trim()
  if (!key) return { ok: false, kind: 'auth-rejected', message: 'Hiányzó API kulcs.' }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20_000)

  try {
    let url: string
    let init: RequestInit

    if (provider === 'anthropic' || provider === 'deepseek') {
      url = provider === 'anthropic'
        ? 'https://api.anthropic.com/v1/messages'
        : 'https://api.deepseek.com/anthropic/v1/messages'
      init = {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'OK' }],
        }),
      }
    } else if (provider === 'openai') {
      url = 'https://api.openai.com/v1/responses'
      init = {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          input: 'Reply OK',
          max_output_tokens: 8,
        }),
      }
    } else {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
      init = {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': key,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Reply OK' }] }],
          generationConfig: { maxOutputTokens: 8 },
        }),
      }
    }

    const res = await fetchImpl(url, init)
    if (!res.ok) return await parseFailure(res)
    return { ok: true, kind: 'ok', status: res.status }
  } catch (err) {
    const message = err instanceof Error ? err.message.slice(0, 300) : 'Hálózati hiba'
    return { ok: false, kind: 'network-error', message }
  } finally {
    clearTimeout(timer)
  }
}
