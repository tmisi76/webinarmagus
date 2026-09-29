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
    .replaceAll('https://github.com/Szotasz/marveen', 'https://github.com/tmisi76/webinarmagus')
    .replaceAll('github.com/Szotasz/marveen', 'github.com/tmisi76/webinarmagus')
    .replaceAll('Szotasz/marveen', 'tmisi76/webinarmagus')
    .replaceAll('MARVEEN_', 'WEBINAR_MAGUS_')
    .replaceAll('MARVEEN', 'WEBINAR_MAGUS')
    .replaceAll('Marveen', 'WebinarMagus')
    .replaceAll('marveen', 'webinar_magus')
}

function replacementName(name) {
  return name
    .replaceAll('MARVEEN', 'WEBINAR_MAGUS')
    .replaceAll('Marveen', 'WebinarMagus')
    .replaceAll('marveen', 'webinar_magus')
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
      if (!/marveen/i.test(content)) continue
      const next = replaceLegacyText(content)
      if (next !== content) {
        fs.writeFileSync(full, next)
        changedFiles++
      }
    }
  }

  // Rename children only after their contents/subtrees were processed.
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

    if (/marveen/i.test(entry.name)) leftovers.push(`PATH: ${rel}`)

    if (entry.isDirectory()) {
      scan(full)
    } else if (entry.isFile() && isTextFile(full)) {
      let content
      try {
        content = fs.readFileSync(full, 'utf8')
      } catch {
        continue
      }
      if (/marveen/i.test(content)) leftovers.push(`CONTENT: ${rel}`)
    }
  }
}
scan(root)

console.log(`Rewritten files: ${changedFiles}`)
console.log(`Renamed paths: ${renamedPaths}`)

if (leftovers.length) {
  console.error('Legacy Marveen references remain:')
  console.error(leftovers.join('\n'))
  process.exit(1)
}

console.log('Legacy Marveen scrub complete: 0 remaining references.')
