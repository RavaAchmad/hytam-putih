import { contentPath, dataDir, ensureStore, readContent } from '../src/content-store.js'

await ensureStore()
const content = await readContent()

console.log(JSON.stringify({
  dataDir,
  contentPath,
  campaigns: content.campaigns.length,
  collections: content.collections.length,
  products: content.products.length,
  journal: content.journal.length,
  boutiques: content.boutiques.length,
  media: content.media.length
}, null, 2))
