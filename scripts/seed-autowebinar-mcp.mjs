#!/usr/bin/env node

/**
 * Seed the AutoWebinar remote MCP server into the install's root .mcp.json.
 *
 * Contract:
 * - never overwrite an existing autowebinar entry;
 * - preserve every other MCP server;
 * - create a valid mcpServers object when the file is missing;
 * - refuse to overwrite malformed JSON;
 * - never write credentials or tokens.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const target = path.join(root, '.mcp.json')

function fail(message) {
  console.error('[Webinár Mágus] AutoWebinar MCP seed kihagyva:', message)
  process.exitCode = 1
}

let parsed = { mcpServers: {} }

if (fs.existsSync(target)) {
  try {
    parsed = JSON.parse(fs.readFileSync(target, 'utf8'))
  } catch {
    fail('.mcp.json nem érvényes JSON; biztonsági okból nem írjuk felül.')
    process.exit()
  }
}

if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
  fail('.mcp.json gyökere nem objektum; biztonsági okból nem írjuk felül.')
  process.exit()
}

if (parsed.mcpServers === undefined) {
  parsed.mcpServers = {}
}

if (!parsed.mcpServers || typeof parsed.mcpServers !== 'object' || Array.isArray(parsed.mcpServers)) {
  fail('mcpServers nem objektum; biztonsági okból nem írjuk felül.')
  process.exit()
}

if (Object.prototype.hasOwnProperty.call(parsed.mcpServers, 'autowebinar')) {
  console.log('[Webinár Mágus] AutoWebinar MCP már konfigurálva; változtatás nélkül hagyva.')
  process.exit(0)
}

parsed.mcpServers.autowebinar = {
  url: 'https://autowebinar.hu/mcp'
}

const tmp = target + '.tmp'
fs.writeFileSync(tmp, JSON.stringify(parsed, null, 2) + '\n', { mode: 0o600 })
fs.renameSync(tmp, target)

console.log('[Webinár Mágus] AutoWebinar MCP hozzáadva: https://autowebinar.hu/mcp')
