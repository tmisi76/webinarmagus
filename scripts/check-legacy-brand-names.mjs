import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2] || process.cwd())
const forbidden = [
  ['mar', 'veen'].join(''),
  ['mar', 'ven'].join(''),
  ['mar', 'ween'].join(''),
  ['mar', 'vin'].join(''),
  ['mar', 'win'].join(''),
  ['mar', 'vyn'].join(''),
  ['mal', 'vin'].join(''),
  ['mar', 'tin'].join(''),
  ['mar', 'tyn'].join(''),
]
const forbiddenRepo = ['tmisi76', 'webinar-magus'].join('/')
const skipDirs = new Set(['.git', 'node_modules', 'dist', 'coverage', 'release', 'test-results', 'playwright-report'])
const binaryExts = new Set([
  '.png','.jpg','.jpeg','.gif','.webp','.ico','.pdf','.zip','.gz','.tgz','.woff','.woff2',
  '.ttf','.otf','.mp3','.wav','.mp4','.mov','.avi','.dmg','.exe','.bin','.sqlite','.db'
])

const hits = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && skipDirs.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    const rel = path.relative(root, full)
    const relLower = rel.toLowerCase()
    if (forbidden.some((term) => relLower.includes(term))) hits.push('PATH: ' + rel)

    if (entry.isDirectory()) {
      walk(full)
      continue
    }
    if (!entry.isFile() || binaryExts.has(path.extname(entry.name).toLowerCase())) continue

    let content
    try { content = fs.readFileSync(full, 'utf8') } catch { continue }
    const lower = content.toLowerCase()
    if (forbidden.some((term) => lower.includes(term)) || lower.includes(forbiddenRepo)) {
      hits.push('CONTENT: ' + rel)
    }
  }
}

walk(root)
if (hits.length) {
  console.error('Legacy brand/name references found:')
  console.error([...new Set(hits)].join('\n'))
  process.exit(1)
}
console.log('Legacy brand/name guard: 0 forbidden references.')
