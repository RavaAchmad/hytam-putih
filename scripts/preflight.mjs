import { access, mkdir, unlink, writeFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const isProduction = process.env.NODE_ENV === 'production'
const defaultDataDir = existsSync('/home/container') ? '/home/container/data' : './data'
const dataDir = resolve(process.env.DATA_DIR || defaultDataDir)
const missing = []
const unsafe = []

if (isProduction && !process.env.DATA_DIR) missing.push('DATA_DIR')
if (isProduction && !process.env.ADMIN_TOKEN) missing.push('ADMIN_TOKEN')

if (isProduction && ['change-me-admin-token', 'change-this-secure-token', 'change-this-token'].includes(process.env.ADMIN_TOKEN)) {
  unsafe.push('ADMIN_TOKEN')
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
