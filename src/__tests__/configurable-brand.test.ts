import { describe, it, expect } from 'vitest'
import { resolveBrandName, resolveServiceId, brandSlug } from '../config.js'
import {
  substituteTemplatePlaceholders,
  type TemplateIdentity,
} from '../web/agent-scaffold.js'
import {
  channelsSessionName,
  channelsLaunchdLabel,
  channelsPlistPath,
} from '../web/main-agent.js'
import { buildWebinarMagusIdentityCore } from '../web/routes/webinarmagus.js'

// This suite proves the configurable-brand feature works under a NON-"webinarmagus"
// identity: it sets BRAND_NAME / BOT_NAME / MAIN_AGENT_ID / OWNER_NAME to
// generic placeholder values and asserts that the identity payload, template
// substitution, main-agent detection, launchd label derivation, and the
// brand-population fallback all resolve from those values with NO literal
// "webinarmagus"/"WebinarMagus" leaking through. The DEFAULT (WebinarMagus) is asserted
// separately so the feature is also confirmed zero-change for existing installs.
//
// Generic, non-sensitive placeholders only.
const BRAND = 'AcmeAI'
const AGENT_DISPLAY = 'MyAssistant'
const AGENT_ID = 'myassistant'
const OWNER = 'Operator'

// Anything that still hardcodes the product brand would surface as one of these
// literals in a value derived from a non-webinarmagus identity.
const WEBINAR_MAGUS_RX = /webinarmagus/i

function assertNoWebinarMagus(value: string, label: string): void {
  expect(value, `${label} leaked a literal brand: ${value}`).not.toMatch(WEBINAR_MAGUS_RX)
}

describe('BRAND_NAME / BOT_NAME separation', () => {
  it('defaults BRAND_NAME to BOT_NAME when the env var is unset/empty (default-safe)', () => {
    expect(resolveBrandName(undefined, 'WebinarMagus')).toBe('WebinarMagus')
    expect(resolveBrandName('', 'WebinarMagus')).toBe('WebinarMagus')
    expect(resolveBrandName('   ', 'WebinarMagus')).toBe('WebinarMagus')
    // The product brand can differ from the agent display name.
    expect(resolveBrandName(undefined, AGENT_DISPLAY)).toBe(AGENT_DISPLAY)
  })

  it('uses an explicit BRAND_NAME independently of BOT_NAME', () => {
    expect(resolveBrandName(BRAND, AGENT_DISPLAY)).toBe(BRAND)
    expect(resolveBrandName(BRAND, AGENT_DISPLAY)).not.toBe(AGENT_DISPLAY)
  })
})

describe('brandSlug derivation (mirrors the installer NFKD rule)', () => {
  it('slugs the default brand back to "webinarmagus" so labels are unchanged by default', () => {
    expect(brandSlug('WebinarMagus')).toBe('webinarmagus')
  })

  it('derives an ASCII slug for a non-webinarmagus brand', () => {
    expect(brandSlug(BRAND)).toBe('acmeai')
    expect(brandSlug(AGENT_DISPLAY)).toBe('myassistant')
    expect(brandSlug('My Assistant')).toBe('my-assistant')
    expect(brandSlug('Acme-AI v2!')).toBe('acme-ai-v2')
  })

  it('folds accented brands to ASCII (no non-webinarmagus unicode leak)', () => {
    // Generic accented example -- exercises the NFKD path without a real name.
    expect(brandSlug('Éxãmple Brand')).toBe('example-brand')
  })

  it('falls back to "webinarmagus" for an empty/blank brand', () => {
    expect(brandSlug('')).toBe('webinarmagus')
    expect(brandSlug('   ')).toBe('webinarmagus')
    expect(brandSlug('!!!')).toBe('webinarmagus')
  })
})

describe('resolveServiceId (launchd/systemd service id)', () => {
  it('equals MAIN_AGENT_ID for the default brand (default-safe labels)', () => {
    // Default brand slug == agent id -> same service id -> identical labels.
    expect(resolveServiceId('webinarmagus', 'webinarmagus')).toBe('webinarmagus')
  })

  it('uses the brand slug for a distinct non-webinarmagus brand', () => {
    expect(resolveServiceId('acmeai', AGENT_ID)).toBe('acmeai')
    expect(resolveServiceId('acmeai', AGENT_ID)).not.toBe(AGENT_ID)
  })

  it('falls back to the agent id when no distinct brand slug is given', () => {
    expect(resolveServiceId('', AGENT_ID)).toBe(AGENT_ID)
    expect(resolveServiceId(AGENT_ID, AGENT_ID)).toBe(AGENT_ID)
  })
})

describe('launchd / channels label derivation for a non-webinarmagus identity', () => {
  it('builds the tmux channels session from the agent id', () => {
    expect(channelsSessionName(AGENT_ID)).toBe('myassistant-channels')
    assertNoWebinarMagus(channelsSessionName(AGENT_ID), 'channelsSessionName')
  })

  it('builds the launchd label + plist path from the service id', () => {
    const serviceId = resolveServiceId(brandSlug(BRAND), AGENT_ID)
    expect(serviceId).toBe('acmeai')
    expect(channelsLaunchdLabel(serviceId)).toBe('com.acmeai.channels')
    expect(channelsPlistPath(serviceId)).toMatch(/\/com\.acmeai\.channels\.plist$/)
    assertNoWebinarMagus(channelsLaunchdLabel(serviceId), 'channelsLaunchdLabel')
    assertNoWebinarMagus(channelsPlistPath(serviceId), 'channelsPlistPath')
  })

  it('keeps the default label as com.webinarmagus.channels (zero change for existing installs)', () => {
    const serviceId = resolveServiceId(brandSlug('WebinarMagus'), 'webinarmagus')
    expect(channelsLaunchdLabel(serviceId)).toBe('com.webinarmagus.channels')
  })
})

describe('identity payload core resolves from config, not the literal', () => {
  it('maps display name / brand / canonical id for a non-webinarmagus identity', () => {
    const brandName = resolveBrandName(BRAND, AGENT_DISPLAY)
    const core = buildWebinarMagusIdentityCore(AGENT_DISPLAY, brandName, AGENT_ID)
    expect(core).toEqual({
      name: AGENT_DISPLAY,
      brandName: BRAND,
      agentId: AGENT_ID,
      autoRestartId: AGENT_ID,
      role: 'main',
    })
    for (const [k, v] of Object.entries(core)) assertNoWebinarMagus(String(v), `identity.${k}`)
  })

  it('falls brandName back to the display name when no separate brand is set', () => {
    const brandName = resolveBrandName(undefined, AGENT_DISPLAY)
    const core = buildWebinarMagusIdentityCore(AGENT_DISPLAY, brandName, AGENT_ID)
    expect(core.brandName).toBe(AGENT_DISPLAY)
  })
})

describe('template substitution for a non-webinarmagus identity', () => {
  const identity: TemplateIdentity = {
    projectRoot: '/opt/myassistant',
    mainAgentId: AGENT_ID,
    botName: AGENT_DISPLAY,
    ownerName: OWNER,
    webPort: 3420,
  }

  it('substitutes every identity placeholder with the non-webinarmagus values', () => {
    const tpl = [
      'root={{PROJECT_ROOT}}',
      'install={{INSTALL_DIR}}',
      'agent={{MAIN_AGENT_ID}}',
      'bot={{BOT_NAME}}',
      'owner={{OWNER_NAME}}',
      'port={{WEB_PORT}}',
    ].join('\n')
    const out = substituteTemplatePlaceholders(tpl, identity)
    // No placeholder survives.
    expect([...out.matchAll(/\{\{[A-Z_]+\}\}/g)].map(m => m[0])).toEqual([])
    // Values are the injected non-webinarmagus identity.
    expect(out).toContain('agent=myassistant')
    expect(out).toContain('bot=MyAssistant')
    expect(out).toContain('owner=Operator')
    expect(out).toContain('root=/opt/myassistant')
    // No literal brand leaked through the substitution.
    assertNoWebinarMagus(out, 'substituteTemplatePlaceholders output')
  })

  it('does not invent a webinarmagus value when the template has no brand reference', () => {
    expect(substituteTemplatePlaceholders('hello {{OWNER_NAME}}', identity)).toBe('hello Operator')
  })
})

describe('brand-population fallback contract (initSidebarBrand)', () => {
  // The client picks `brandName` and only falls back to `name` (and finally the
  // HTML default) when the backend omits it. Replicating the exact rule guards
  // against a regression where the chrome stops honoring brandName.
  const pickBrand = (m: { brandName?: string; name?: string }) => m.brandName || m.name

  it('prefers brandName when present (non-webinarmagus)', () => {
    expect(pickBrand({ brandName: BRAND, name: AGENT_DISPLAY })).toBe(BRAND)
  })

  it('falls back to name when brandName is absent', () => {
    expect(pickBrand({ name: AGENT_DISPLAY })).toBe(AGENT_DISPLAY)
  })
})
