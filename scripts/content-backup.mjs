import { existsSync } from 'node:fs'
import { copyFile, mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const dataDir = resolve(process.env.DATA_DIR || './data')
const contentPath = join(dataDir, 'content.json')
const backupDir = resolve(process.env.BACKUP_DIR || join(dataDir, 'backups'))

if (!existsSync(contentPath)) {
  console.log(`Content store not found: ${contentPath}`)
  console.log('Nothing to backup yet.')
  process.exit(0)
}

await mkdir(backupDir, { recursive: true })

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const out = join(backupDir, `content-${stamp}.json`)
await copyFile(contentPath, out)

console.log(`Backup written: ${out}`)
