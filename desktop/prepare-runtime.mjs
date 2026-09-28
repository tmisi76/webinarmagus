import { cpSync, existsSync, rmSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const desktopDir = dirname(fileURLToPath(import.meta.url))
const rootDir = join(desktopDir, '..')
const outDir = join(desktopDir, 'runtime-src')

const blockedNames = new Set([
  '.git',
  '.github',
  '.env',
  'node_modules',
  'dist',
  'store',
  'desktop',
  'release',
  '.DS_Store',
])

function filter(source) {
  const rel = relative(rootDir, source)
  if (!rel) return true
  const parts = rel.split(/[\\/]/)
  if (parts.some((part) => blockedNames.has(part))) return false
  const base = parts.at(-1) || ''
  if (base.startsWith('.env.')) return false
  if (base.endsWith('.log')) return false
  return true
}

if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true })
cpSync(rootDir, outDir, { recursive: true, filter })

console.log(`Bundled runtime prepared at ${outDir}`)
