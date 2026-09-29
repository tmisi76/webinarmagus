import { describe, it, expect } from 'vitest'
import {
  appServiceLabel,
  launchdStatusPattern,
  systemdStatusUnits,
  LEGACY_SERVICE_ID,
  LEGACY_APP_SERVICE_LABEL,
} from '../config.js'

describe('appServiceLabel derives the standalone-installer service label from SERVICE_ID', () => {
  it('default install keeps the webinar_magus-derived app label (byte-identical to the pre-change literal minus the legacy name)', () => {
    expect(appServiceLabel('webinar_magus')).toBe('com.webinar_magus.app')
  })

  it('a branded install names the app service after the brand slug', () => {
    expect(appServiceLabel('acme')).toBe('com.acme.app')
  })

  it('legacy constants are the original claudeclaw names', () => {
    expect(LEGACY_SERVICE_ID).toBe('claudeclaw')
    expect(LEGACY_APP_SERVICE_LABEL).toBe('com.claudeclaw.app')
  })
})

describe('launchdStatusPattern matches every install shape (fixes the status false-negative)', () => {
  const re = new RegExp(launchdStatusPattern('webinar_magus'))

  it('matches the standalone-installer app unit', () => {
    expect(re.test('com.webinar_magus.app')).toBe(true)
  })

  it('matches the install-macos.sh dashboard unit -- the exact bug the old "grep claudeclaw" check missed', () => {
    expect(re.test('com.webinar_magus.dashboard')).toBe(true)
  })

  it('still matches a legacy claudeclaw unit (upgrade compatibility)', () => {
    expect(re.test('com.claudeclaw.app')).toBe(true)
  })

  it('does NOT count an ancillary com.<id>.* helper as the dashboard running', () => {
    // Regression guard for a real host: the broad "com.webinar_magus." prefix wrongly
    // matched com.webinar_magus.telegram-progress-watchdog and reported the dashboard
    // as running when it was not.
    expect(re.test('com.webinar_magus.telegram-progress-watchdog')).toBe(false)
    expect(re.test('com.webinar_magus.channels')).toBe(false)
    expect(re.test('com.webinar_magus.channel-coordinator')).toBe(false)
  })

  it('is right-anchored: a longer segment that merely starts with app/dashboard does not match', () => {
    // Guards the boundary the comment claims: without the trailing `$` these
    // would false-positive.
    expect(re.test('com.webinar_magus.dashboard-helper')).toBe(false)
    expect(re.test('com.webinar_magus.appliance')).toBe(false)
    expect(re.test('com.webinar_magus.app.helper')).toBe(false)
    expect(re.test('com.webinar_magus.dashboardx')).toBe(false)
  })

  it('does not match an unrelated service or a prefix without the specific suffix', () => {
    expect(re.test('com.apple.somethingd')).toBe(false)
    expect(re.test('com.othertool.dashboard')).toBe(false)
    expect(re.test('com.webinar_magusistnoise')).toBe(false)
  })

  it('a branded install matches its own dashboard/app plus the legacy name, not an unrelated brand', () => {
    const reAcme = new RegExp(launchdStatusPattern('acme'))
    expect(reAcme.test('com.acme.dashboard')).toBe(true)
    expect(reAcme.test('com.acme.app')).toBe(true)
    expect(reAcme.test('com.claudeclaw.app')).toBe(true)
    expect(reAcme.test('com.webinar_magus.dashboard')).toBe(false)
  })
})

describe('systemdStatusUnits probes newest install shape first with a legacy fallback', () => {
  it('lists dashboard, bare id, then legacy for a default install', () => {
    expect(systemdStatusUnits('webinar_magus')).toEqual(['webinar_magus-dashboard', 'webinar_magus', 'claudeclaw'])
  })

  it('lists the branded units with the legacy fallback', () => {
    expect(systemdStatusUnits('acme')).toEqual(['acme-dashboard', 'acme', 'claudeclaw'])
  })

  it('deduplicates when the id already equals the legacy id', () => {
    expect(systemdStatusUnits('claudeclaw')).toEqual(['claudeclaw-dashboard', 'claudeclaw'])
  })
})
