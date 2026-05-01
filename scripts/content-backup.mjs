import { existsSync } from 'node:fs'
import { copyFile, mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { dataDir, ensureStore, storeFiles } from '../src/content-store.js'

const backupDir = resolve(process.env.BACKUP_DIR || join(dataDir, 'backups'))

await ensureStore()

await mkdir(backupDir, { recursive: true })

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const outDir = join(backupDir, stamp)
await mkdir(outDir, { recursive: true })

for (const [key, file] of Object.entries(storeFiles)) {
  if (existsSync(file)) {
    await copyFile(file, join(outDir, `${key}.json`))
  }
}

console.log(`Backup written: ${outDir}`)
