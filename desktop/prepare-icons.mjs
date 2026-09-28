import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const build = join(import.meta.dirname, 'build')
await mkdir(build, { recursive: true })
const svg = await readFile(join(build, 'icon.svg'))
const png = await sharp(svg).resize(512, 512).png({ compressionLevel: 9 }).toBuffer()
await writeFile(join(build, 'icon.png'), png)
const ico = await pngToIco(png)
await writeFile(join(build, 'icon.ico'), ico)
console.log('Webinár Mágus desktop icons generated')
