import { describe, expect, it } from 'vitest'
import { probeAiProviderCredential } from '../ai-provider-probe.js'

function okFetch(calls: Array<{ url: string; init?: RequestInit }>) {
  return async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    calls.push({ url: String(input), init })
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }
}

describe('probeAiProviderCredential', () => {
  it('uses Anthropic Messages API for Claude', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = []
    const r = await probeAiProviderCredential('anthropic', 'claude-sonnet-5', 'provider-key-fixture', okFetch(calls))
    expect(r.ok).toBe(true)
    expect(calls[0].url).toBe('https://api.anthropic.com/v1/messages')
    expect(new Headers(calls[0].init?.headers).get('x-api-key')).toBe('provider-key-fixture')
  })

  it('uses DeepSeek Anthropic-compatible Messages API', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = []
    const r = await probeAiProviderCredential('deepseek', 'deepseek-flash', 'provider-key-fixture', okFetch(calls))
    expect(r.ok).toBe(true)
    expect(calls[0].url).toBe('https://api.deepseek.com/anthropic/v1/messages')
  })

  it('uses the OpenAI Responses API', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = []
    const r = await probeAiProviderCredential('openai', 'gpt-5.6-terra', 'provider-key-fixture', okFetch(calls))
    expect(r.ok).toBe(true)
    expect(calls[0].url).toBe('https://api.openai.com/v1/responses')
    expect(new Headers(calls[0].init?.headers).get('authorization')).toBe('Bearer provider-key-fixture')
  })

  it('uses Gemini generateContent with x-goog-api-key', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = []
    const r = await probeAiProviderCredential('google', 'gemini-3.8-flash', 'provider-key-fixture', okFetch(calls))
    expect(r.ok).toBe(true)
    expect(calls[0].url).toContain('/models/gemini-3.8-flash:generateContent')
    expect(new Headers(calls[0].init?.headers).get('x-goog-api-key')).toBe('provider-key-fixture')
  })

  it('classifies rejected credentials without exposing the key', async () => {
    const fake = async (): Promise<Response> => new Response(
      JSON.stringify({ error: { message: 'Unauthorized' } }),
      { status: 401, headers: { 'content-type': 'application/json' } },
    )
    const r = await probeAiProviderCredential('openai', 'gpt-5.6-terra', 'provider-key-fixture', fake)
    expect(r.ok).toBe(false)
    expect(r.kind).toBe('auth-rejected')
    expect(JSON.stringify(r)).not.toContain('provider-key-fixture')
  })

  it('classifies an unavailable model separately', async () => {
    const fake = async (): Promise<Response> => new Response(
      JSON.stringify({ error: { message: 'model not found' } }),
      { status: 404, headers: { 'content-type': 'application/json' } },
    )
    const r = await probeAiProviderCredential('google', 'gemini-missing', 'provider-key-fixture', fake)
    expect(r.ok).toBe(false)
    expect(r.kind).toBe('model-unavailable')
  })
})
