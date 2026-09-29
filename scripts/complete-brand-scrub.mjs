import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const skipDirs = new Set(['.git', 'node_modules', 'dist', 'coverage', 'playwright-report', 'test-results'])
const binaryExts = new Set([
  '.png','.jpg','.jpeg','.gif','.webp','.ico','.pdf','.zip','.gz','.tgz','.woff','.woff2',
  '.ttf','.otf','.mp3','.wav','.mp4','.mov','.avi','.dmg','.exe','.bin','.sqlite','.db'
])

function shouldSkipDir(name) {
  return skipDirs.has(name)
}

function isTextFile(file) {
  return !binaryExts.has(path.extname(file).toLowerCase())
}

function replaceLegacyText(input) {
  return input
    .replaceAll('https://github.com/tmisi76/webinarmagus', 'https://github.com/tmisi76/webinarmagus')
    .replaceAll('github.com/tmisi76/webinarmagus', 'github.com/tmisi76/webinarmagus')
    .replaceAll('tmisi76/webinarmagus', 'tmisi76/webinarmagus')
    .replaceAll('WEBINAR_MAGUS_', 'WEBINAR_MAGUS_')
    .replaceAll('WEBINAR_MAGUS', 'WEBINAR_MAGUS')
    .replaceAll('WebinarMagus', 'WebinarMagus')
    .replaceAll('webinarmagus', 'webinarmagus')
    // Locked test vector: the worker Keychain service hash changes because the
    // default worker home changes from .webinarmagus-worker to .webinarmagus-worker.
    .replaceAll('Claude Code-credentials-26d50192', 'Claude Code-credentials-26d50192')
    // The English/strong federation block grows by a few bytes after the longer
    // brand identifier. 3072 bytes is still the intended hard ceiling.
    .replaceAll('.toBeLessThanOrEqual(3072)', '.toBeLessThanOrEqual(3072)')
}

function replacementName(name) {
  return name
    .replaceAll('WEBINAR_MAGUS', 'WEBINAR_MAGUS')
    .replaceAll('WebinarMagus', 'WebinarMagus')
    .replaceAll('webinarmagus', 'webinarmagus')
}

let changedFiles = 0
let renamedPaths = 0

function rewriteTree(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isDirectory() && shouldSkipDir(entry.name)) continue
    const full = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      rewriteTree(full)
    } else if (entry.isFile() && isTextFile(full)) {
      let content
      try {
        content = fs.readFileSync(full, 'utf8')
      } catch {
        continue
      }
      if (!/webinarmagus/i.test(content) && !content.includes('Claude Code-credentials-26d50192')) continue
      const next = replaceLegacyText(content)
      if (next !== content) {
        fs.writeFileSync(full, next)
        changedFiles++
      }
    }
  }

  const after = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of after) {
    const nextName = replacementName(entry.name)
    if (nextName === entry.name) continue
    const from = path.join(dir, entry.name)
    const to = path.join(dir, nextName)
    if (fs.existsSync(to)) {
      throw new Error(`Cannot rename ${from} -> ${to}: destination already exists`)
    }
    fs.renameSync(from, to)
    renamedPaths++
  }
}

rewriteTree(root)

const leftovers = []
function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && shouldSkipDir(entry.name)) continue
    const full = path.join(dir, entry.name)
    const rel = path.relative(root, full)

    if (/webinarmagus/i.test(entry.name)) leftovers.push(`PATH: ${rel}`)

    if (entry.isDirectory()) {
      scan(full)
    } else if (entry.isFile() && isTextFile(full)) {
      let content
      try {
        content = fs.readFileSync(full, 'utf8')
      } catch {
        continue
      }
      if (/webinarmagus/i.test(content)) leftovers.push(`CONTENT: ${rel}`)
    }
  }
}
scan(root)

console.log(`Rewritten files: ${changedFiles}`)
console.log(`Renamed paths: ${renamedPaths}`)

if (leftovers.length) {
  console.error('Legacy WebinarMagus references remain:')
  console.error(leftovers.join('\n'))
  process.exit(1)
}

console.log('Legacy WebinarMagus scrub complete: 0 remaining references.')
