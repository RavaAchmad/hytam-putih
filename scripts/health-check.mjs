const port = process.env.PORT || process.env.SERVER_PORT || '3000'
const host = normalizeHost(process.env.HEALTH_HOST || process.env.HOST || '127.0.0.1')
const path = process.env.HEALTH_PATH || '/api/health'
const url = `${host}:${port}${path}`

const response = await fetch(url)
if (!response.ok) {
  throw new Error(`Health check failed: ${response.status} ${response.statusText}`)
}

const body = await response.json()
if (!body.ok) {
  throw new Error(`Health check returned invalid body: ${JSON.stringify(body)}`)
}

console.log(`Health OK: ${JSON.stringify(body)}`)

function normalizeHost(value) {
  if (value.startsWith('http://') || value.startsWith('https://')) return value.replace(/\/$/, '')
  if (value === '0.0.0.0') return 'http://127.0.0.1'
  return `http://${value}`
}
