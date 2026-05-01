import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const dataDir = await mkdtemp(join(tmpdir(), 'vael-smoke-'))

process.env.NODE_ENV = 'test'
process.env.HOST = '127.0.0.1'
process.env.PORT = '0'
process.env.DATA_DIR = dataDir
process.env.ADMIN_PASSWORD = 'smoke-password'
process.env.ADMIN_SESSION_SECRET = 'smoke-secret'

try {
  const { app } = await import('../src/server.js')

  await expectStatus(app, '/', 200)
  await expectStatus(app, '/collections', 200)
  await expectStatus(app, '/collections/private-edit-2026', 200)
  await expectStatus(app, '/products/noir-sculpted-coat', 200)
  await expectStatus(app, '/journal', 200)
  await expectStatus(app, '/journal/runway-note', 200)
  await expectStatus(app, '/boutiques', 200)
  await expectStatus(app, '/api/health', 200)
  await expectStatus(app, '/uploads/%2e%2e%2fpackage.json', 404)

  const admin = await app.request('/admin')
  if (![302, 303].includes(admin.status) || !admin.headers.get('location')?.includes('/admin/login')) {
    throw new Error(`Expected /admin redirect to login, got ${admin.status}`)
  }

  const wrongLogin = await app.request('/admin/login', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ password: 'wrong-password' })
  })
  if (wrongLogin.status !== 401) {
    throw new Error(`Expected wrong admin login to return 401, got ${wrongLogin.status}`)
  }

  const health = await app.request('/api/health').then((res) => res.json())
  if (!health.ok || health.storage !== 'file-json') {
    throw new Error('Health response is invalid.')
  }

  console.log('Smoke test passed.')
} finally {
  await rm(dataDir, { recursive: true, force: true })
}

async function expectStatus(app, path, expected) {
  const response = await app.request(path)
  if (response.status !== expected) {
    throw new Error(`Expected ${path} -> ${expected}, got ${response.status}`)
  }
}
