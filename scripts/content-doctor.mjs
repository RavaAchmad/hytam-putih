import { existsSync } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { validateContent } from '../src/content-schema.js'

const dataDir = resolve(process.env.DATA_DIR || './data')
const contentPath = join(dataDir, 'content.json')

if (!existsSync(contentPath)) {
  console.log(`Content store not found: ${contentPath}`)
  console.log('Run npm run content:init or start the server once to initialize default content.')
  process.exit(0)
}

const info = await stat(contentPath)
const content = validateContent(JSON.parse(await readFile(contentPath, 'utf8')))

console.log(JSON.stringify({
  contentPath,
  bytes: info.size,
  campaigns: content.campaigns.length,
  collections: content.collections.length,
  products: content.products.length,
  journal: content.journal.length,
  boutiques: content.boutiques.length,
  media: content.media.length,
  uploads: content.media.filter((item) => item.src?.startsWith('/uploads/')).length,
  hasSite: Boolean(content.site?.brand),
  hasAppointment: Boolean(content.appointment?.email)
}, null, 2))
