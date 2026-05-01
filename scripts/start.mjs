import 'dotenv/config'

import { spawn } from 'node:child_process'
import { join } from 'node:path'

const port = String(process.env.SERVER_PORT || process.env.PORT || '3000')
const host = process.env.HOST || '0.0.0.0'
const dataDir = process.env.DATA_DIR || '/home/container/data'
const healthHost = host === '0.0.0.0' ? '127.0.0.1' : host
const healthUrl = `http://${healthHost}:${port}/api/health`

process.env.PORT = port
process.env.SERVER_PORT = port
process.env.HOST = host
process.env.DATA_DIR = dataDir

console.log([
  'Starting Next.js',
  `command=next start -H ${host} -p ${port}`,
  `host=${host}`,
  `port=${port}`,
  `dataDir=${dataDir}`,
  `health=${healthUrl}`
].join(' | '))

const nextCli = join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next')
const child = spawn(process.execPath, [nextCli, 'start', '-H', host, '-p', port], {
  env: process.env,
  stdio: 'inherit',
  windowsHide: true
})

child.on('error', (error) => {
  console.error(`Failed to start Next.js: ${error.message}`)
  process.exit(1)
})

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`Next.js stopped by signal ${signal}`)
    process.exit(1)
  }

  if (code && code !== 0) {
    console.error(`Next.js exited with code ${code}`)
    process.exit(code)
  }

  process.exit(0)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (!child.killed) {
      child.kill(signal)
    }
  })
}
