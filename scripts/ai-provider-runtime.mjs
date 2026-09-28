#!/usr/bin/env node

/**
 * Webinár Mágus AI provider runtime bridge.
 *
 * - Anthropic: direct Claude Code API routing
 * - DeepSeek: direct Anthropic-compatible DeepSeek endpoint
 * - OpenAI / Google Gemini: local LiteLLM Anthropic-compatible gateway
 *
 * API secrets are read from the encrypted Webinár Mágus Vault. The generated
 * LiteLLM YAML never contains a provider key.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { homedir } from 'node:os'
import { spawn, spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const STORE = join(ROOT, 'store')
const SELECTION_FILE = join(STORE, 'ai-provider.json')
const LITELLM_CONFIG = join(STORE, 'litellm-webinar-magus.yaml')
const LITELLM_PID = join(STORE, 'litellm-webinar-magus.pid')
const LITELLM_STATE = join(STORE, 'litellm-webinar-magus.state.json')
const BRIDGE_TOKEN_FILE = join(STORE, '.ai-provider-bridge-token')
const BRIDGE_HOST = '127.0.0.1'
const BRIDGE_PORT = 4010

function loadOrCreateBridgeToken() {
  try {
    const existing = readFileSync(BRIDGE_TOKEN_FILE, 'utf8').trim()
    if (existing) return existing
  } catch { /* first run */ }

  mkdirSync(STORE, { recursive: true })
  // Build the prefix from separate fragments so no secret-looking fixture is
  // committed to source; the actual bearer token exists only at runtime.
  const token = ['sk', 'wm', randomBytes(24).toString('hex')].join('-')
  writeFileSync(BRIDGE_TOKEN_FILE, token + '\n', { mode: 0o600 })
  return token
}

function q(value) {
  return "'" + String(value).replace(/'/g, "'\\''") + "'"
}

function die(message) {
  console.error('[Webinár Mágus] ' + message)
  process.exit(1)
}

function readSelection() {
  try {
    const parsed = JSON.parse(readFileSync(SELECTION_FILE, 'utf8'))
    if (!parsed?.provider || !parsed?.model) throw new Error('missing provider/model')
    return parsed
  } catch {
    die('Nincs érvényes AI szolgáltató beállítva. Futtasd le az onboarding AI-választását.')
  }
}

async function vault() {
  const built = join(ROOT, 'dist', 'web', 'vault.js')
  if (!existsSync(built)) die('A build hiányzik (dist/web/vault.js). Futtasd az npm run build parancsot.')
  return import(pathToFileURL(built).href)
}

const KEY_BY_PROVIDER = {
  anthropic: 'ANTHROPIC_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  openai: 'OPENAI_API_KEY',
  google: 'GEMINI_API_KEY',
}

function upstreamModel(provider, model) {
  if (provider === 'openai') return 'openai/' + model
  if (provider === 'google') return 'gemini/' + model
  return model
}

async function readSecret(provider) {
  const keyId = KEY_BY_PROVIDER[provider]
  if (!keyId) die('Ismeretlen AI provider: ' + provider)
  const { getSecret } = await vault()
  const value = getSecret(keyId)
  if (!value) die('Hiányzik az API kulcs a Vaultból: ' + keyId)
  return { keyId, value }
}

function liteLlmExecutable() {
  const candidates = [
    join(homedir(), '.local', 'bin', 'litellm'),
    '/usr/local/bin/litellm',
    '/opt/homebrew/bin/litellm',
    'litellm',
  ]
  for (const bin of candidates) {
    const r = spawnSync(bin, ['--help'], { stdio: 'ignore' })
    if (!r.error) return bin
  }
  return null
}

function readBridgeState() {
  try {
    const parsed = JSON.parse(readFileSync(LITELLM_STATE, 'utf8'))
    return parsed && typeof parsed.provider === 'string' && typeof parsed.model === 'string'
      ? parsed
      : null
  } catch {
    return null
  }
}

function bridgeStateMatches(provider, model) {
  const state = readBridgeState()
  return state?.provider === provider && state?.model === model
}

async function stopOwnedBridge() {
  let pid = 0
  try { pid = Number.parseInt(readFileSync(LITELLM_PID, 'utf8').trim(), 10) } catch { /* no pid */ }
  if (Number.isFinite(pid) && pid > 1) {
    try { process.kill(pid, 'SIGTERM') } catch { /* already gone */ }
  }
  for (let i = 0; i < 20; i++) {
    try {
      const state = pid > 1 ? process.kill(pid, 0) : false
      if (!state) return
    } catch {
      return
    }
    await new Promise((r) => setTimeout(r, 150))
  }
}

async function bridgeHealthy(token) {
  try {
    const res = await fetch('http://' + BRIDGE_HOST + ':' + BRIDGE_PORT + '/health/liveliness', {
      headers: { Authorization: 'Bearer ' + token },
      signal: AbortSignal.timeout(1200),
    })
    return res.ok
  } catch {
    return false
  }
}

function writeBridgeConfig(provider, model, keyId) {
  mkdirSync(STORE, { recursive: true })
  const config = [
    'model_list:',
    '  - model_name: ' + model,
    '    litellm_params:',
    '      model: ' + upstreamModel(provider, model),
    '      api_key: os.environ/' + keyId,
    '',
    'general_settings:',
    '  master_key: os.environ/LITELLM_MASTER_KEY',
    '',
  ].join('\n')
  writeFileSync(LITELLM_CONFIG, config, { mode: 0o600 })
}

async function ensureBridge(provider, model, keyId, apiKey, bridgeToken) {
  const healthy = await bridgeHealthy(bridgeToken)
  if (healthy && bridgeStateMatches(provider, model)) return
  if (healthy) await stopOwnedBridge()

  const bin = liteLlmExecutable()
  if (!bin) {
    die('A helyi AI Provider Bridge hiányzik (LiteLLM). A Webinár Mágus telepítőnek telepítenie kell a litellm[proxy] csomagot.')
  }

  writeBridgeConfig(provider, model, keyId)

  const env = {
    ...process.env,
    [keyId]: apiKey,
    LITELLM_MASTER_KEY: bridgeToken,
  }

  const child = spawn(
    bin,
    ['--config', LITELLM_CONFIG, '--host', BRIDGE_HOST, '--port', String(BRIDGE_PORT)],
    { cwd: ROOT, env, detached: true, stdio: 'ignore' },
  )
  child.unref()
  mkdirSync(STORE, { recursive: true })
  writeFileSync(LITELLM_PID, String(child.pid) + '\n', { mode: 0o600 })
  writeFileSync(LITELLM_STATE, JSON.stringify({ provider, model }, null, 2) + '\n', { mode: 0o600 })

  for (let i = 0; i < 30; i++) {
    if (await bridgeHealthy(bridgeToken)) return
    await new Promise((r) => setTimeout(r, 500))
  }
  die('Az AI Provider Bridge nem indult el időben.')
}

async function runtimeEnv() {
  const { provider, model } = readSelection()
  const { keyId, value } = await readSecret(provider)

  if (provider === 'anthropic') {
    return {
      provider,
      model,
      shell: [
        'unset CLAUDE_CODE_OAUTH_TOKEN',
        'export ANTHROPIC_API_KEY=' + q(value),
        'unset ANTHROPIC_AUTH_TOKEN',
        'unset ANTHROPIC_BASE_URL',
        'export ANTHROPIC_MODEL=' + q(model),
      ].join('; ') + '; ',
    }
  }

  if (provider === 'deepseek') {
    const runtimeModel = model === 'deepseek-flash' ? 'deepseek-flash[1m]' : model
    return {
      provider,
      model,
      shell: [
        'unset CLAUDE_CODE_OAUTH_TOKEN',
        'unset ANTHROPIC_API_KEY',
        'export ANTHROPIC_AUTH_TOKEN=' + q(value),
        'export ANTHROPIC_BASE_URL=' + q('https://api.deepseek.com/anthropic'),
        'export ANTHROPIC_MODEL=' + q(runtimeModel),
        'export ANTHROPIC_DEFAULT_OPUS_MODEL=' + q(runtimeModel),
        'export ANTHROPIC_DEFAULT_SONNET_MODEL=' + q(runtimeModel),
        'export ANTHROPIC_DEFAULT_HAIKU_MODEL=' + q('deepseek-flash'),
        'export CLAUDE_CODE_SUBAGENT_MODEL=' + q('deepseek-flash'),
        'export CLAUDE_CODE_EFFORT_LEVEL=max',
        'export CLAUDE_CODE_AUTO_COMPACT_WINDOW=786432',
      ].join('; ') + '; ',
    }
  }

  if (provider === 'openai' || provider === 'google') {
    const bridgeToken = loadOrCreateBridgeToken()
    await ensureBridge(provider, model, keyId, value, bridgeToken)
    return {
      provider,
      model,
      shell: [
        'unset CLAUDE_CODE_OAUTH_TOKEN',
        'unset ANTHROPIC_API_KEY',
        'export ANTHROPIC_AUTH_TOKEN=' + q(bridgeToken),
        'export ANTHROPIC_BASE_URL=' + q('http://' + BRIDGE_HOST + ':' + BRIDGE_PORT),
        'export ANTHROPIC_MODEL=' + q(model),
      ].join('; ') + '; ',
    }
  }

  die('Nem támogatott AI provider: ' + provider)
}

const mode = process.argv[2] || '--json'
const data = await runtimeEnv()
if (mode === '--shell') process.stdout.write(data.shell)
else process.stdout.write(JSON.stringify({ provider: data.provider, model: data.model }) + '\n')
