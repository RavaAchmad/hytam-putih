import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const dataDir = await mkdtemp(join(tmpdir(), 'rava-smoke-'))

process.env.NODE_ENV = 'test'
process.env.HOST = '127.0.0.1'
process.env.PORT = '0'
process.env.DATA_DIR = dataDir
process.env.ADMIN_TOKEN = 'smoke-token'

try {
  const { app } = await import('../src/server.js')

  await expectStatus(app, '/', 200)
  await expectStatus(app, '/collections', 200)
  await expectStatus(app, '/collections/nocturne-objects-2026', 200)
  await expectStatus(app, '/shop', 200)
  await expectStatus(app, '/shop/nocturne-sculpted-coat', 200)
  await expectStatus(app, '/cart', 200)
  await expectStatus(app, '/checkout', 200)
  await expectStatus(app, '/order-status', 200)
  await expectStatus(app, '/maison', 200)
  await expectStatus(app, '/editorial', 200)
  await expectStatus(app, '/editorial/the-aperture-code', 200)
  await expectStatus(app, '/search?q=coat', 200)
  await expectStatus(app, '/api/health', 200)
  await expectStatus(app, '/api/v1/health', 200)
  await expectStatus(app, '/api/v1/template', 200)
  await expectStatus(app, '/api/v1/products', 200)
  await expectStatus(app, '/api/products/nocturne-sculpted-coat', 200)
  await expectStatus(app, '/api/collections/nocturne-objects-2026', 200)
  await expectStatus(app, '/uploads/%2e%2e%2fpackage.json', 404)

  const admin = await app.request('/admin')
  if (admin.status !== 200) {
    throw new Error(`Expected /admin to return 200, got ${admin.status}`)
  }

  const wrongLogin = await app.request('/api/admin/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: 'wrong-token' })
  })
  if (wrongLogin.status !== 401) {
    throw new Error(`Expected wrong admin login to return 401, got ${wrongLogin.status}`)
  }

  const rightLogin = await app.request('/api/admin/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: 'smoke-token' })
  })
  if (rightLogin.status !== 200) {
    throw new Error(`Expected admin login to return 200, got ${rightLogin.status}`)
  }

  const health = await app.request('/api/health').then((res) => res.json())
  if (!health.ok || health.data.storage !== 'file-json') {
    throw new Error('Health response is invalid.')
  }

  const apiHealth = await app.request('/api/v1/health').then((res) => res.json())
  if (!apiHealth.ok || apiHealth.data.service !== 'maison-rava') {
    throw new Error('API v1 health response is invalid.')
  }

  const order = await app.request('/api/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      customer: {
        name: 'Smoke Client',
        email: 'smoke@example.com',
        phone: '+620000',
        country: 'Indonesia',
        address: 'Smoke address'
      },
      paymentMethod: 'QRIS',
      items: [{ slug: 'nocturne-sculpted-coat', quantity: 1 }]
    })
  }).then((res) => res.json())

  if (!order.ok || !order.data.order.invoiceId) {
    throw new Error('Order creation failed.')
  }

  await expectStatus(app, `/api/orders/${order.data.order.invoiceId}?email=smoke%40example.com`, 200)

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
