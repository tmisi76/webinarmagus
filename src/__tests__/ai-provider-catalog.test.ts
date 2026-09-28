import { describe, expect, it } from 'vitest'
import { AI_PROVIDER_CATALOG, findAiModel, findAiProvider } from '../ai-provider-catalog.js'

describe('AI_PROVIDER_CATALOG', () => {
  it('ships exactly the four first-party provider choices required by onboarding', () => {
    expect(AI_PROVIDER_CATALOG.map((p) => p.id)).toEqual([
      'deepseek',
      'anthropic',
      'openai',
      'google',
    ])
  })

  it('has a valid recommended model for every provider', () => {
    for (const provider of AI_PROVIDER_CATALOG) {
      expect(findAiModel(provider, provider.recommendedModel)).not.toBeNull()
    }
  })

  it('keeps provider credentials out of the public catalog', () => {
    const serialized = JSON.stringify(AI_PROVIDER_CATALOG)
    expect(serialized).not.toMatch(/apiKey\s*:/i)
    expect(serialized).not.toContain('Bearer ')
  })

  it('uses the documented price/value defaults', () => {
    expect(findAiProvider('deepseek')?.recommendedModel).toBe('deepseek-flash')
    expect(findAiProvider('anthropic')?.recommendedModel).toBe('claude-sonnet-5')
    expect(findAiProvider('openai')?.recommendedModel).toBe('gpt-6-sol')
    expect(findAiProvider('google')?.recommendedModel).toBe('gemini-3.8-flash')
  })
})
