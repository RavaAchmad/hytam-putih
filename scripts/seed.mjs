import 'dotenv/config'

import { dataDir, ensureStore, readContent, storeFiles } from '../src/content-store.js'

await ensureStore()
const content = await readContent()

console.log(JSON.stringify({
  dataDir,
  files: Object.fromEntries(Object.entries(storeFiles).map(([key, file]) => [key, file])),
  campaigns: content.campaigns.length,
  collections: content.collections.length,
  products: content.products.length,
  editorials: content.editorials.length,
  orders: content.orders.length,
  subscribers: content.subscribers.length,
  boutiques: content.boutiques.length,
  media: content.media.length
}, null, 2))
