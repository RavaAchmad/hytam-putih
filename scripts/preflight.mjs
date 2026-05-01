import { access, mkdir, unlink, writeFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { join, resolve } from 'node:path'

const isProduction = process.env.NODE_ENV === 'production'
const dataDir = resolve(process.env.DATA_DIR || './data')
const missing = []
const unsafe = []

if (isProduction && !process.env.DATA_DIR) missing.push('DATA_DIR')
if (isProduction && !process.env.ADMIN_PASSWORD) missing.push('ADMIN_PASSWORD')
if (isProduction && !process.env.ADMIN_SESSION_SECRET) missing.push('ADMIN_SESSION_SECRET')

if (isProduction && ['change-this-password', 'change-me-to-a-long-random-password'].includes(process.env.ADMIN_PASSWORD)) {
  unsafe.push('ADMIN_PASSWORD')
}

if (isProduction && (!process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET === process.env.ADMIN_PASSWORD || process.env.ADMIN_SESSION_SECRET === 'change-me-to-a-different-long-random-secret')) {
  unsafe.push('ADMIN_SESSION_SECRET')
}

if (missing.length || unsafe.length) {
  console.error('Preflight failed.')
  if (missing.length) console.error(`Missing env: ${missing.join(', ')}`)
  if (unsafe.length) console.error(`Unsafe env: ${unsafe.join(', ')}`)
  process.exit(1)
}

await mkdir(dataDir, { recursive: true })
await access(dataDir, constants.R_OK | constants.W_OK)

const probe = join(dataDir, `.write-test-${process.pid}`)
await writeFile(probe, 'ok', 'utf8')
await unlink(probe)

console.log(`Preflight OK. DATA_DIR=${dataDir}`)
