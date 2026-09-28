import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { MAIN_AGENT_ID, PROJECT_ROOT } from '../config.js'
import { logger } from '../logger.js'
import { atomicWriteFileSync } from './atomic-write.js'
import {
  agentDir,
  writeAgentCapabilities,
  writeAgentDisplayName,
  writeAgentModel,
  writeAgentSecurityProfile,
} from './agent-config.js'
import { writeAgentTeam } from './agent-team.js'
import { scaffoldAgentDir, writeAgentSettingsFromProfile } from './agent-scaffold.js'
import { loadProfileTemplate } from './profiles.js'
import { seedContextGuardForNewAgent } from './context-guard-store.js'
import { addDesiredAgent } from './agent-desired-state.js'
import { isAgentRunning, startAgentProcess } from './agent-process.js'

export interface WebinarMagusSeedResult {
  id: string
  displayName: string
  created: boolean
  started: boolean
  error?: string
}

interface TeamSeedDefinition {
  id: string
  displayName: string
  template: string
  capabilities: string[]
}

export const WEBINAR_MAGUS_TEAM: readonly TeamSeedDefinition[] = [
  {
    id: 'webinar-magus',
    displayName: 'Webinár Mágus',
    template: 'webinar-magus.md',
    capabilities: ['webinar', 'presentation', 'script', 'offer'],
  },
  {
    id: 'hirdetes-magus',
    displayName: 'Hirdetés Mágus',
    template: 'hirdetes-magus.md',
    capabilities: ['meta-ads', 'google-ads', 'creative', 'acquisition'],
  },
  {
    id: 'email-magus',
    displayName: 'Email Mágus',
    template: 'email-magus.md',
    capabilities: ['email', 'follow-up', 'copywriting', 'automation'],
  },
  {
    id: 'funnel-magus',
    displayName: 'Funnel Mágus',
    template: 'funnel-magus.md',
    capabilities: ['funnel', 'analytics', 'retention', 'attribution'],
  },
  {
    id: 'sales-magus',
    displayName: 'Sales Mágus',
    template: 'sales-magus.md',
    capabilities: ['sales', 'crm', 'qualification', 'follow-up'],
  },
] as const

function canonicalPersona(def: TeamSeedDefinition): string {
  const path = join(PROJECT_ROOT, 'templates', 'webinar-magus-agents', def.template)
  return readFileSync(path, 'utf8')
}

function soulFor(def: TeamSeedDefinition): string {
  return [
    `# ${def.displayName} — SOUL`,
    '',
    `Te vagy a Webinár Mágus AI csapat ${def.displayName} specialistája.`,
    '',
    '## Működési alapelvek',
    '',
    '- Magyarul, tömören és gyakorlatiasan kommunikálsz.',
    '- Valós adatot nem helyettesítesz feltételezéssel.',
    '- Ha AutoWebinar-adat elérhető, a releváns feladatnál abból indulsz ki.',
    '- Kifelé ható vagy üzleti adatot módosító lépésnél tiszteletben tartod a jóváhagyási kapukat.',
    '- A Főmágustól kapott feladatot végrehajtod, az eredményt bizonyítékokkal és konkrét következő lépéssel adod vissza.',
    '',
  ].join('\n')
}

/**
 * Idempotently creates the five canonical Webinár Mágus specialists.
 *
 * Existing agent directories are never overwritten: a user's later edits are
 * authoritative. Fresh agents receive the selected install-wide model and the
 * shared MCP config through scaffoldAgentDir().
 */
export async function seedWebinarMagusTeam(model: string, start = true): Promise<WebinarMagusSeedResult[]> {
  const results: WebinarMagusSeedResult[] = []

  for (const def of WEBINAR_MAGUS_TEAM) {
    const dir = agentDir(def.id)
    let created = false

    try {
      if (!existsSync(dir)) {
        scaffoldAgentDir(def.id)
        writeAgentModel(def.id, model)
        writeAgentDisplayName(def.id, def.displayName)
        writeAgentSecurityProfile(def.id, 'default')
        writeAgentSettingsFromProfile(def.id, loadProfileTemplate('default'))
        seedContextGuardForNewAgent(def.id)
        writeAgentCapabilities(def.id, [...def.capabilities])
        writeAgentTeam(def.id, {
          role: 'member',
          reportsTo: MAIN_AGENT_ID,
          delegatesTo: [],
          autoDelegation: false,
          trustFrom: [],
        })
        atomicWriteFileSync(join(dir, 'CLAUDE.md'), canonicalPersona(def))
        atomicWriteFileSync(join(dir, 'SOUL.md'), soulFor(def))
        created = true
        logger.info({ agent: def.id, model }, 'Webinár Mágus specialist seeded')
      }

      let started = isAgentRunning(def.id)
      if (start) {
        addDesiredAgent(def.id)
        if (!started) {
          const launch = await startAgentProcess(def.id)
          started = launch.ok
          if (!launch.ok) {
            results.push({
              id: def.id,
              displayName: def.displayName,
              created,
              started: false,
              error: launch.error || 'start failed',
            })
            continue
          }
        }
      }

      results.push({ id: def.id, displayName: def.displayName, created, started })
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      logger.error({ err, agent: def.id }, 'Webinár Mágus specialist seed failed')
      results.push({ id: def.id, displayName: def.displayName, created, started: false, error })
    }
  }

  return results
}
