import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { AI_PROVIDER_CATALOG } from '../ai-provider-catalog.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')

describe('Webinár Mágus UX contract', () => {
  it('defaults the dashboard to Hungarian', () => {
    const app = read('web/app.js')
    expect(app).toContain("applyLang(localStorage.getItem(LS_KEY) || 'hu')")
  })

  it('uses the AutoWebinar blue/cyan design system on web and desktop', () => {
    const web = read('web/style.css')
    const desktop = read('desktop/renderer/base.css')
    for (const css of [web, desktop]) {
      expect(css).toContain('#2563EB')
      expect(css).toContain('#0EA5E9')
    }
  })

  it('offers four freely selectable AI providers', () => {
    expect(AI_PROVIDER_CATALOG.map((p) => p.id)).toEqual(['deepseek', 'anthropic', 'openai', 'google'])
    const onboarding = read('web/ai-provider-onboarding.js')
    expect(onboarding).toContain('Nincs kötelező Claude-előfizetés')
    expect(onboarding).toContain('később bármikor válthatsz')
  })

  it('uses current supported provider defaults', () => {
    const selected = Object.fromEntries(AI_PROVIDER_CATALOG.map((p) => [p.id, p.recommendedModel]))
    expect(selected).toEqual({
      deepseek: 'deepseek-flash',
      anthropic: 'claude-sonnet-5-5',
      openai: 'gpt-6-sol',
      google: 'gemini-3.8-flash',
    })
  })
})
