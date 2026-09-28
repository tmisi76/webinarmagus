import { describe, it, expect } from 'vitest'
import { resolveProviderEnv } from '../web/agent-process.js'

describe('resolveProviderEnv', () => {
  it('keeps OAuth behaviour for Claude when no shared Vault API key exists', () => {
    const r = resolveProviderEnv('claude-sonnet-5', () => null)
    expect(r.provider).toBe('claude')
    expect(r.exportsStr).toBe('')
  })

  it('routes Claude specialists through the shared Vault Anthropic API key when configured', () => {
    const seen: string[] = []
    const r = resolveProviderEnv('claude-sonnet-5', (id) => {
      seen.push(id)
      return id === 'ANTHROPIC_API_KEY' ? 'claude-secret' : null
    })
    expect(seen).toEqual(['ANTHROPIC_API_KEY'])
    expect(r.provider).toBe('claude')
    expect(r.exportsStr).toContain('ANTHROPIC_API_KEY="claude-secret"')
    expect(r.exportsStr).toContain(`ANTHROPIC_MODEL='claude-sonnet-5'`)
    expect(r.exportsStr).toContain('unset ANTHROPIC_AUTH_TOKEN')
  })

  it('routes deepseek- models to the DeepSeek Anthropic-compatible endpoint with DEEPSEEK_API_KEY', () => {
    const seen: string[] = []
    const r = resolveProviderEnv('deepseek-v4-pro', (id) => {
      seen.push(id)
      return 'ds-secret'
    })
    expect(r.provider).toBe('deepseek')
    expect(seen).toEqual(['DEEPSEEK_API_KEY'])
    expect(r.exportsStr).toContain('ANTHROPIC_AUTH_TOKEN="ds-secret"')
    expect(r.exportsStr).toContain('ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic')
    expect(r.exportsStr).toContain('unset ANTHROPIC_API_KEY')
    expect(r.exportsStr).toContain(`ANTHROPIC_MODEL='deepseek-v4-pro'`)
  })

  it('routes minimax- models to the MiniMax Anthropic-compatible endpoint with MINIMAX_API_KEY', () => {
    const seen: string[] = []
    const r = resolveProviderEnv('minimax-m3', (id) => {
      seen.push(id)
      return 'mm-secret'
    })
    expect(r.provider).toBe('minimax')
    expect(seen).toEqual(['MINIMAX_API_KEY'])
    expect(r.exportsStr).toContain('ANTHROPIC_AUTH_TOKEN="mm-secret"')
    expect(r.exportsStr).toContain('ANTHROPIC_BASE_URL=https://api.minimax.io/anthropic')
    expect(r.exportsStr).toContain(`ANTHROPIC_MODEL='minimax-m3'`)
  })

  it('forces CLAUDE_CODE_MAX_CONTEXT_TOKENS=1000000 for minimax- models -- the /anthropic compat layer misreports 200K (MiniMax-AI/MiniMax-M2.7#46), so the CLI must be told the real window explicitly', () => {
    const r = resolveProviderEnv('minimax-m3', () => 'mm-secret')
    expect(r.exportsStr).toContain('CLAUDE_CODE_MAX_CONTEXT_TOKENS=1000000')
  })

  it('does NOT force CLAUDE_CODE_MAX_CONTEXT_TOKENS for a claude- model -- the override is minimax-specific, not a blanket setting', () => {
    const r = resolveProviderEnv('claude-sonnet-5', () => null)
    expect(r.exportsStr).not.toContain('CLAUDE_CODE_MAX_CONTEXT_TOKENS')
  })


  it('routes OpenAI GPT models to the local Webinár Mágus provider bridge', () => {
    const r = resolveProviderEnv('gpt-6-sol', () => null)
    expect(r.provider).toBe('openai')
    expect(r.exportsStr).toContain('ANTHROPIC_BASE_URL=http://127.0.0.1:4010')
    expect(r.exportsStr).toContain('.ai-provider-bridge-token')
    expect(r.exportsStr).toContain(`ANTHROPIC_MODEL='gpt-6-sol'`)
  })

  it('routes Gemini models to the local Webinár Mágus provider bridge', () => {
    const r = resolveProviderEnv('gemini-3.8-flash', () => null)
    expect(r.provider).toBe('google')
    expect(r.exportsStr).toContain('ANTHROPIC_BASE_URL=http://127.0.0.1:4010')
    expect(r.exportsStr).toContain(`ANTHROPIC_MODEL='gemini-3.8-flash'`)
  })

  it('routes provider/model ids (containing "/") to OpenRouter, not minimax or ollama', () => {
    const seen: string[] = []
    const r = resolveProviderEnv('minimax/minimax-m3', (id) => {
      seen.push(id)
      return 'or-secret'
    })
    expect(r.provider).toBe('openrouter')
    expect(seen).toEqual(['openrouter-fleet-key'])
    expect(r.exportsStr).toContain('ANTHROPIC_BASE_URL=https://openrouter.ai/api')
  })

  it('falls back to Ollama for a bare tag (no "claude-"/"deepseek-"/"minimax-" prefix, no "/")', () => {
    const r = resolveProviderEnv('qwen3.6:27b', () => null)
    expect(r.provider).toBe('ollama')
    expect(r.exportsStr).toContain('ANTHROPIC_AUTH_TOKEN=ollama')
    expect(r.exportsStr).toContain(`ANTHROPIC_MODEL='qwen3.6:27b'`)
  })

  it('asks only for the shared Anthropic key on a claude- model', () => {
    const seen: string[] = []
    resolveProviderEnv('claude-sonnet-5', (id) => {
      seen.push(id)
      return null
    })
    expect(seen).toEqual(['ANTHROPIC_API_KEY'])
  })
})
