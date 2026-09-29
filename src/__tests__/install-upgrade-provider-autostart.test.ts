import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..')
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')

const APP = read('web/app.js')
const ONBOARDING = read('src/web/routes/onboarding.ts')
const START = read('scripts/start.sh')
const LAUNCHD = read('scripts/launchd-unit.sh')
const CLI_WINDOWS = read('cli/install.ps1')
const WINDOWS = read('install-windows.ps1')
const README = read('README.md')
const NAME_GUARD = read('scripts/check-legacy-brand-names.mjs')

describe('first-run provider choice', () => {
  it('does not silently skip provider selection because Claude is already authenticated', () => {
    expect(APP).toContain('if (!s.aiProviderConfigured || !s.agentsRunning) return 2')
    expect(APP).not.toContain('(!s.aiProviderConfigured && !s.claudeAuthPresent)')
    expect(ONBOARDING).toContain('needsOnboarding: !aiConfigured || !running || !ch || !pr')
  })

  it('restarts a running main agent after a provider/model change', () => {
    expect(ONBOARDING).toContain('const wasRunning = agentsRunning()')
    expect(ONBOARDING).toContain('if (wasRunning)')
    expect(ONBOARDING).toContain('hardRestartWebinarMagusChannels()')
  })
})

describe('macOS old-checkout self-heal', () => {
  it('installs tmux when Homebrew is available and repairs LaunchAgents', () => {
    expect(START).toContain('command -v tmux')
    expect(START).toContain('brew install tmux')
    expect(START).toContain('ensure_core_launchd_units "$SERVICE_ID" "$INSTALL_DIR"')
    expect(LAUNCHD).toContain('ensure_core_launchd_units()')
    expect(LAUNCHD).toContain('<key>RunAtLoad</key>')
    expect(LAUNCHD).toContain('<key>KeepAlive</key>')
  })

  it('prints the authenticated first-login dashboard URL', () => {
    expect(START).toContain('store/.dashboard-token')
    expect(START).toContain('/?token=${DASH_TOKEN}')
  })
})

describe('Windows background startup', () => {
  it('registers an AtLogOn task in both Windows installer paths', () => {
    for (const src of [CLI_WINDOWS, WINDOWS]) {
      expect(src).toContain('New-ScheduledTaskTrigger -AtLogOn')
      expect(src).toContain('Register-ScheduledTask')
      expect(src).toContain('bash scripts/start.sh')
    }
  })

  it('is documented for macOS and Windows', () => {
    expect(README).toContain('## Automatikus háttérben futás')
    expect(README).toContain('Get-ScheduledTask -TaskName "WebinarMagus"')
    expect(README).toContain('com.webinarmagus.dashboard')
  })
})

describe('legacy-name guard', () => {
  it('ignores generated store log history while still scanning source', () => {
    expect(NAME_GUARD).toContain("relLower.startsWith('store' + path.sep)")
    expect(NAME_GUARD).toContain("path.extname(entry.name).toLowerCase() === '.log'")
  })
})
