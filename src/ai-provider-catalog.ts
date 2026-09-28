/**
 * Webinár Mágus AI provider catalog.
 *
 * Pricing snapshot checked: 2026-09-28.
 * Prices are USD / 1M text tokens and are intentionally kept as display
 * strings because vendors can have cache, batch, long-context and peak/off-peak
 * tiers that cannot be represented by a single number without being misleading.
 *
 * Hungarian-quality labels are product guidance based on representative
 * marketing/writing usage, NOT an official Hungarian-language benchmark.
 */
export type AiProviderId = 'deepseek' | 'anthropic' | 'openai' | 'google'

export interface AiModelOption {
  id: string
  name: string
  tier: 'budget' | 'recommended' | 'premium'
  inputUsdPerM: number | null
  outputUsdPerM: number | null
  priceNote?: string
  bestFor: string[]
}

export interface AiProviderOption {
  id: AiProviderId
  name: string
  company: string
  vaultKeyId: string
  apiKeyLabel: string
  apiKeyPlaceholder: string
  recommendedModel: string
  priceLevel: 'nagyon-olcso' | 'olcso' | 'kozepes' | 'draga'
  priceLabel: string
  precisionLabel: string
  hungarianLabel: string
  recommendation: string
  recommendedFor: string[]
  caveat?: string
  models: AiModelOption[]
}

export const AI_PROVIDER_CATALOG: readonly AiProviderOption[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    company: 'DeepSeek',
    vaultKeyId: 'DEEPSEEK_API_KEY',
    apiKeyLabel: 'DeepSeek API kulcs',
    apiKeyPlaceholder: 'sk-...',
    recommendedModel: 'deepseek-flash',
    priceLevel: 'nagyon-olcso',
    priceLabel: 'Nagyon olcsó',
    precisionLabel: 'Erős agent és elemző munka',
    hungarianLabel: 'Jó magyar',
    recommendation: 'AJÁNLOTT: nagy volumenű háttérmunkára',
    recommendedFor: ['automatizmusok', 'adat- és funnel elemzés', 'háttér-agentek', 'kód és eszközhasználat'],
    caveat: 'Peak/off-peak árazás: csúcsidőn kívül kb. félár.',
    models: [
      {
        id: 'deepseek-flash',
        name: 'DeepSeek V4.1 Flash',
        tier: 'recommended',
        inputUsdPerM: 0.30,
        outputUsdPerM: 1.20,
        priceNote: 'Peak ár; off-peak: $0.15 / $0.60.',
        bestFor: ['olcsó agent workflow', 'elemzés', 'automatizálás', 'nagy volumen'],
      },
      {
        id: 'deepseek-v4-pro',
        name: 'DeepSeek V4 Pro',
        tier: 'premium',
        inputUsdPerM: 1.32,
        outputUsdPerM: 3.96,
        priceNote: 'Peak ár; off-peak: $0.66 / $1.98.',
        bestFor: ['összetettebb reasoning', 'nehéz agent feladatok'],
      },
    ],
  },
  {
    id: 'anthropic',
    name: 'Claude',
    company: 'Anthropic',
    vaultKeyId: 'ANTHROPIC_API_KEY',
    apiKeyLabel: 'Anthropic API kulcs',
    apiKeyPlaceholder: 'sk-ant-api...',
    recommendedModel: 'claude-sonnet-5',
    priceLevel: 'kozepes',
    priceLabel: 'Közepes / prémium',
    precisionLabel: 'Nagyon precíz agentmunka',
    hungarianLabel: 'Nagyon jó magyar',
    recommendation: 'AJÁNLOTT: összetett, precíz agent feladatokra',
    recommendedFor: ['stratégia', 'hosszú több-lépéses feladat', 'precíz ellenőrzés', 'kód és tool use'],
    models: [
      {
        id: 'claude-haiku-4-5-20251001',
        name: 'Claude Haiku 4.5',
        tier: 'budget',
        inputUsdPerM: 1,
        outputUsdPerM: 5,
        bestFor: ['gyors rutinmunka', 'osztályozás', 'egyszerű agent lépések'],
      },
      {
        id: 'claude-sonnet-5',
        name: 'Claude Sonnet 5',
        tier: 'recommended',
        inputUsdPerM: 2,
        outputUsdPerM: 10,
        bestFor: ['agent workflow', 'stratégia', 'írás', 'kód', 'ellenőrzés'],
      },
      {
        id: 'claude-opus-5-5',
        name: 'Claude Opus 5.5',
        tier: 'premium',
        inputUsdPerM: 4,
        outputUsdPerM: 20,
        bestFor: ['legnehezebb feladatok', 'hosszú komplex végrehajtás', 'kritikus review'],
      },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    company: 'OpenAI',
    vaultKeyId: 'OPENAI_API_KEY',
    apiKeyLabel: 'OpenAI API kulcs',
    apiKeyPlaceholder: 'sk-...',
    recommendedModel: 'gpt-6-sol',
    priceLevel: 'olcso',
    priceLabel: 'Olcsótól prémiumig',
    precisionLabel: 'Kiváló általános munka és döntés',
    hungarianLabel: 'Kiváló magyar',
    recommendation: 'AJÁNLOTT: magyar marketing, stratégia és általános munkára',
    recommendedFor: ['magyar szövegírás', 'marketing', 'stratégia', 'kutatás', 'automatizálás'],
    models: [
      {
        id: 'gpt-6-luna',
        name: 'GPT-6 Luna',
        tier: 'budget',
        inputUsdPerM: 0.10,
        outputUsdPerM: 0.50,
        bestFor: ['nagy volumen', 'rutin automatizmus', 'email draft', 'adatfeldolgozás'],
      },
      {
        id: 'gpt-6-sol',
        name: 'GPT-6 Sol',
        tier: 'recommended',
        inputUsdPerM: 2,
        outputUsdPerM: 10,
        bestFor: ['magyar marketing copy', 'stratégia', 'agent workflow', 'kutatás', 'döntéstámogatás'],
      },
      {
        id: 'gpt-6-astra',
        name: 'GPT-6 Astra',
        tier: 'premium',
        inputUsdPerM: 10,
        outputUsdPerM: 50,
        bestFor: ['legnehezebb end-to-end munka', 'kritikus elemzés', 'prémium deliverable'],
      },
    ],
  },
  {
    id: 'google',
    name: 'Gemini',
    company: 'Google',
    vaultKeyId: 'GEMINI_API_KEY',
    apiKeyLabel: 'Google Gemini API kulcs',
    apiKeyPlaceholder: 'AIza...',
    recommendedModel: 'gemini-3.8-flash',
    priceLevel: 'olcso',
    priceLabel: 'Jó ár/érték',
    precisionLabel: 'Erős multimodális és agent munka',
    hungarianLabel: 'Kiváló magyar',
    recommendation: 'AJÁNLOTT: magyar tartalomhoz és multimodális munkához',
    recommendedFor: ['magyar szöveg', 'prezentáció és kreatív elemzés', 'képes/PDF input', 'agent workflow'],
    caveat: 'A $0.75 / $3.75 ár 2026. december 31-ig érvényes promóciós standard ár.',
    models: [
      {
        id: 'gemini-3.8-flash',
        name: 'Gemini 3.8 Flash',
        tier: 'recommended',
        inputUsdPerM: 0.75,
        outputUsdPerM: 3.75,
        priceNote: '2026.12.31-ig; utána jelenlegi listaár szerint $1.50 / $7.50.',
        bestFor: ['magyar marketing', 'multimodális elemzés', 'hosszú agent workflow', 'prezentáció'],
      },
    ],
  },
] as const

export function findAiProvider(id: string | null | undefined): AiProviderOption | null {
  if (!id) return null
  return AI_PROVIDER_CATALOG.find((p) => p.id === id) ?? null
}

export function findAiModel(provider: AiProviderOption, modelId: string | null | undefined): AiModelOption | null {
  if (!modelId) return null
  return provider.models.find((m) => m.id === modelId) ?? null
}
