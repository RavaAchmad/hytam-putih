import { existsSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { dataDir, ensureStore, readContent, storeFiles } from '../src/content-store.js'

const missing = Object.values(storeFiles).filter((file) => !existsSync(file))
if (missing.length) {
  console.log(`Content store incomplete in: ${dataDir}`)
  console.log('Run npm run content:init or start the server once to initialize default content.')
  await ensureStore()
}

const content = await readContent()
const files = {}
for (const [key, file] of Object.entries(storeFiles)) {
  files[key] = {
    path: file,
    bytes: (await stat(file)).size
  }
}

console.log(JSON.stringify({
  dataDir,
  files,
  campaigns: content.campaigns.length,
  collections: content.collections.length,
  products: content.products.length,
  editorials: content.editorials.length,
  orders: content.orders.length,
  subscribers: content.subscribers.length,
  boutiques: content.boutiques.length,
  media: content.media.length,
  uploads: content.media.filter((item) => item.src?.startsWith('/uploads/')).length,
  hasSite: Boolean(content.site?.brand),
  hasAppointment: Boolean(content.appointment?.email)
}, null, 2))
