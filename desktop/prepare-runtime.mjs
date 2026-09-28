import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
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

function allowedName(name) {
  if (blockedNames.has(name)) return false
  if (name.startsWith('.env.')) return false
  if (name.endsWith('.log')) return false
  return true
}

if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

for (const name of readdirSync(rootDir)) {
  if (!allowedName(name)) continue
  cpSync(join(rootDir, name), join(outDir, name), {
    recursive: true,
    filter(source) {
      const base = source.split(/[\\/]/).at(-1) || ''
      return allowedName(base)
    },
  })
}

console.log(`Bundled runtime prepared at ${outDir}`)
