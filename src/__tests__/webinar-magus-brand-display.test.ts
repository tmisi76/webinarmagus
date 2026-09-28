import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..')

const USER_FACING_FILES = [
  'README.md',
  'ATTRIBUTIONS.md',
  'install-lang.sh',
  'web/index.html',
]

describe('Webinár Mágus user-facing brand hygiene', () => {
  it.each(USER_FACING_FILES)('%s does not expose the legacy display brand', (path) => {
    const text = readFileSync(join(ROOT, path), 'utf8')
    expect(text).not.toContain('Marveen')
  })

  it('keeps the canonical display brand in the public README', () => {
    const text = readFileSync(join(ROOT, 'README.md'), 'utf8')
    expect(text).toContain('Webinár Mágus')
  })

  it('keeps the canonical technical slug documented by the repository URL', () => {
    const text = readFileSync(join(ROOT, 'README.md'), 'utf8')
    expect(text).toContain('webinar-magus')
  })
})
