import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { createServer } from 'node:http'
import { Readable } from 'node:stream'
import { pathToFileURL } from 'node:url'
import { compress } from 'hono/compress'
import { cors } from 'hono/cors'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { etag } from 'hono/etag'
import { secureHeaders } from 'hono/secure-headers'
import { Hono } from 'hono'
import { apiRoutes } from './api-routes.js'
import {
  deleteUploadedImage,
  dataDir,
  ensureStore,
  readContent,
  readUploadedImage,
  saveUploadedImage,
  slugify,
  writeContent
} from './content-store.js'
import {
  renderAdmin,
  renderBoutiques,
  renderCart,
  renderCheckout,
  renderCollectionDetail,
  renderCollectionsIndex,
  renderEditorialDetail,
  renderEditorialIndex,
  renderHome,
  renderInvoice,
  renderJournalDetail,
  renderJournalIndex,
  renderLogin,
  renderMaison,
  renderNotFound,
  renderOrderStatus,
  renderProductDetail,
  renderSearch,
  renderShopIndex
} from './render.js'

const isProduction = process.env.NODE_ENV === 'production'

export const app = new Hono()

const port = Number(process.env.SERVER_PORT || process.env.PORT || 3000)
const hostname = process.env.HOST || '0.0.0.0'
const adminToken = process.env.ADMIN_TOKEN || (isProduction ? '' : 'change-me-admin-token')
const sessionSecret = process.env.ADMIN_SESSION_SECRET || adminToken || 'dev-session-secret'
const sessionMaxAge = 60 * 60 * 24 * 7
const publicApiOrigin = process.env.PUBLIC_API_ORIGIN || ''

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "connect-src 'self'",
  "font-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data:",
  "object-src 'none'",
  "script-src 'self'",
  "style-src 'self'"
].join('; ')

if (isProduction && isMainModule()) {
  const missing = []
  if (!process.env.ADMIN_TOKEN || adminToken === 'change-me-admin-token') missing.push('ADMIN_TOKEN')
  if (!process.env.DATA_DIR) missing.push('DATA_DIR')
  if (missing.length) {
    throw new Error(`Production env missing or unsafe: ${missing.join(', ')}`)
  }
}

await ensureStore()

app.use('*', compress())
app.use('*', etag())
app.use('*', secureHeaders())

app.use('*', async (c, next) => {
  await next()
  c.header('Content-Security-Policy', csp)
  c.header('Cross-Origin-Opener-Policy', 'same-origin')
  c.header('Permissions-Policy', 'camera=(), geolocation=(), microphone=(), payment=()')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.header('X-Content-Type-Options', 'nosniff')
})

app.use('/assets/*', async (c, next) => {
  await next()
  c.header('Cache-Control', 'public, max-age=31536000, immutable')
})

app.use('/uploads/*', async (c, next) => {
  await next()
  c.header('Cache-Control', 'public, max-age=31536000, immutable')
})

app.use('/styles.css', async (c, next) => {
  await next()
  c.header('Cache-Control', 'public, max-age=31536000, immutable')
})

app.use('/app.js', async (c, next) => {
  await next()
  c.header('Cache-Control', 'public, max-age=31536000, immutable')
})

app.use('/site.webmanifest', async (c, next) => {
  await next()
  c.header('Cache-Control', 'public, max-age=86400')
})

if (publicApiOrigin) {
  app.use('/api/v1/*', cors({
    origin: publicApiOrigin.split(',').map((origin) => origin.trim()).filter(Boolean),
    allowMethods: ['GET', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    maxAge: 86400
  }))
}

app.route('/api/v1', apiRoutes)
app.route('/api', apiRoutes)

app.get('/', async (c) => {
  const content = await readContent()
  c.header('Cache-Control', 'no-cache')
  return c.html(renderHome(content))
})

app.get('/collections', async (c) => {
  const content = await readContent()
  c.header('Cache-Control', 'no-cache')
  return c.html(renderCollectionsIndex(content))
})

app.get('/collections/:slug', async (c) => {
  const content = await readContent()
  const collection = findBySlug(content.collections, c.req.param('slug'))
  c.header('Cache-Control', 'no-cache')
  if (!collection) return notFound(c, content)
  return c.html(renderCollectionDetail(content, collection))
})

app.get('/shop', async (c) => {
  const content = await readContent()
  c.header('Cache-Control', 'no-cache')
  return c.html(renderShopIndex(content, c.req.query()))
})

app.get('/shop/:slug', async (c) => {
  const content = await readContent()
  const product = findBySlug(content.products, c.req.param('slug'))
  c.header('Cache-Control', 'no-cache')
  if (!product) return notFound(c, content)
  return c.html(renderProductDetail(content, product))
})

app.get('/products/:slug', async (c) => {
  const content = await readContent()
  const product = findBySlug(content.products, c.req.param('slug'))
  c.header('Cache-Control', 'no-cache')
  if (!product) return notFound(c, content)
  return c.html(renderProductDetail(content, product))
})

app.get('/cart', async (c) => {
  const content = await readContent()
  c.header('Cache-Control', 'no-cache')
  return c.html(renderCart(content))
})

app.get('/checkout', async (c) => {
  const content = await readContent()
  c.header('Cache-Control', 'no-cache')
  return c.html(renderCheckout(content))
})

app.get('/invoice/:orderId', async (c) => {
  const content = await readContent()
  const order = content.orders.find((item) => item.invoiceId === c.req.param('orderId') || item.id === c.req.param('orderId'))
  c.header('Cache-Control', 'no-store')
  return c.html(renderInvoice(content, order))
})

app.get('/order-status', async (c) => {
  const content = await readContent()
  c.header('Cache-Control', 'no-cache')
  return c.html(renderOrderStatus(content))
})

app.get('/maison', async (c) => {
  const content = await readContent()
  c.header('Cache-Control', 'no-cache')
  return c.html(renderMaison(content))
})

app.get('/editorial', async (c) => {
  const content = await readContent()
  c.header('Cache-Control', 'no-cache')
  return c.html(renderEditorialIndex(content))
})

app.get('/editorial/:slug', async (c) => {
  const content = await readContent()
  const article = findBySlug(content.editorials, c.req.param('slug'))
  c.header('Cache-Control', 'no-cache')
  if (!article) return notFound(c, content)
  return c.html(renderEditorialDetail(content, article))
})

app.get('/search', async (c) => {
  const content = await readContent()
  c.header('Cache-Control', 'no-cache')
  return c.html(renderSearch(content, c.req.query('q') || ''))
})

app.get('/journal', async (c) => {
  const content = await readContent()
  c.header('Cache-Control', 'no-cache')
  return c.html(renderJournalIndex(content))
})

app.get('/journal/:slug', async (c) => {
  const content = await readContent()
  const article = findBySlug(content.editorials || content.journal, c.req.param('slug'))
  c.header('Cache-Control', 'no-cache')
  if (!article) return notFound(c, content)
  return c.html(renderJournalDetail(content, article))
})

app.get('/boutiques', async (c) => {
  const content = await readContent()
  c.header('Cache-Control', 'no-cache')
  return c.html(renderBoutiques(content))
})

app.get('/uploads/:filename', async (c) => {
  try {
    const image = await readUploadedImage(c.req.param('filename'))
    c.header('Content-Type', image.type)
    c.header('Content-Length', String(image.size))
    return c.body(image.buffer)
  } catch {
    return c.notFound()
  }
})

app.get('/robots.txt', (c) => {
  const origin = publicOrigin(c)
  c.header('Cache-Control', 'public, max-age=3600')
  c.header('Content-Type', 'text/plain; charset=utf-8')
  return c.text(`User-agent: *
Allow: /

Sitemap: ${origin}/sitemap.xml
`)
})

app.get('/sitemap.xml', (c) => {
  const origin = publicOrigin(c)
  c.header('Cache-Control', 'public, max-age=3600')
  c.header('Content-Type', 'application/xml; charset=utf-8')
  return readContent().then((content) => {
    const urls = [
      '/',
      '/collections',
      '/shop',
      '/cart',
      '/checkout',
      '/order-status',
      '/maison',
      '/editorial',
      '/journal',
      '/boutiques',
      ...content.collections.map((item) => `/collections/${item.slug}`),
      ...content.products.map((item) => `/shop/${item.slug}`),
      ...content.editorials.map((item) => `/editorial/${item.slug}`)
    ]

    return c.text(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((path) => `  <url><loc>${origin}${path}</loc></url>`).join('\n')}
</urlset>
`)
  })
})

app.get('/admin/login', (c) => {
  return c.redirect('/admin')
})

app.post('/admin/login', async (c) => {
  return c.redirect('/admin')
})

app.get('/admin', async (c) => {
  c.header('Cache-Control', 'no-store')
  return c.html(renderAdmin(null, '', c.req.query('notice') || ''))
})

app.post('/admin/logout', async (c) => {
  const guard = await requireAdminPost(c)
  if (guard.response) return guard.response
  clearAdminCookie(c)
  return c.redirect('/admin/login')
})

app.post('/admin/site', async (c) => {
  const { body, response } = await requireAdminPost(c)
  if (response) return response
  const content = await readContent()
  content.site = {
    ...content.site,
    brand: field(body, 'brand'),
    mark: field(body, 'mark'),
    description: field(body, 'description'),
    heroEyebrow: field(body, 'heroEyebrow'),
    heroTitle: field(body, 'heroTitle'),
    heroText: field(body, 'heroText'),
    heroImage: field(body, 'heroImage'),
    heroAlt: field(body, 'heroAlt'),
    primaryCta: field(body, 'primaryCta'),
    secondaryCta: field(body, 'secondaryCta'),
    whatsapp: field(body, 'whatsapp')
  }
  await writeContent(content)
  return notice(c, 'Hero dan site berhasil disimpan')
})

app.post('/admin/house', async (c) => {
  const { body, response } = await requireAdminPost(c)
  if (response) return response
  const content = await readContent()
  content.code = {
    ...content.code,
    eyebrow: field(body, 'codeEyebrow'),
    title: field(body, 'codeTitle'),
    text: field(body, 'codeText'),
    image: field(body, 'codeImage'),
    alt: field(body, 'codeAlt')
  }
  content.appointment = {
    ...content.appointment,
    title: field(body, 'appointmentTitle'),
    text: field(body, 'appointmentText'),
    email: field(body, 'appointmentEmail'),
    subject: field(body, 'appointmentSubject'),
    label: field(body, 'appointmentLabel')
  }
  content.newsletter = {
    ...content.newsletter,
    title: field(body, 'newsletterTitle'),
    text: field(body, 'newsletterText'),
    email: field(body, 'newsletterEmail'),
    subject: field(body, 'newsletterSubject'),
    label: field(body, 'newsletterLabel')
  }
  await writeContent(content)
  return notice(c, 'House content berhasil disimpan')
})

app.post('/admin/media/upload', async (c) => {
  const { body, response } = await requireAdminPost(c)
  if (response) return response
  try {
    const content = await readContent()
    const media = await saveUploadedImage(body.file, field(body, 'alt'))
    content.media = [media, ...content.media]
    await writeContent(content)
    return notice(c, 'Gambar berhasil diupload')
  } catch (error) {
    return notice(c, error.message || 'Upload gagal')
  }
})

app.post('/admin/media/:id/delete', async (c) => {
  const { response } = await requireAdminPost(c)
  if (response) return response
  const content = await readContent()
  const media = content.media.find((item) => item.id === c.req.param('id'))
  if (media?.builtin) return notice(c, 'Gambar bawaan tidak bisa dihapus')
  if (media) {
    await deleteUploadedImage(media)
    content.media = content.media.filter((item) => item.id !== media.id)
    replaceImageReferences(content, media.src, content.site.heroImage || '/assets/hero-atelier.jpg')
    await writeContent(content)
  }
  return notice(c, 'Gambar berhasil dihapus')
})

app.post('/admin/campaigns', async (c) => {
  const { body, response } = await requireAdminPost(c)
  if (response) return response
  const content = await readContent()
  content.campaigns = [campaignFromBody(body), ...content.campaigns]
  await writeContent(content)
  return notice(c, 'Campaign berhasil ditambahkan')
})

app.post('/admin/campaigns/:slug', async (c) => {
  const { body, response } = await requireAdminPost(c)
  if (response) return response
  const content = await readContent()
  const slug = c.req.param('slug')
  content.campaigns = content.campaigns.map((item) => (item.slug === slug ? campaignFromBody(body, slug) : item))
  await writeContent(content)
  return notice(c, 'Campaign berhasil disimpan')
})

app.post('/admin/campaigns/:slug/delete', async (c) => {
  const { response } = await requireAdminPost(c)
  if (response) return response
  const content = await readContent()
  content.campaigns = content.campaigns.filter((item) => item.slug !== c.req.param('slug'))
  await writeContent(content)
  return notice(c, 'Campaign berhasil dihapus')
})

app.post('/admin/collections', async (c) => {
  const { body, response } = await requireAdminPost(c)
  if (response) return response
  const content = await readContent()
  content.collections = [collectionFromBody(body), ...content.collections]
  await writeContent(content)
  return notice(c, 'Collection berhasil ditambahkan')
})

app.post('/admin/collections/:slug', async (c) => {
  const { body, response } = await requireAdminPost(c)
  if (response) return response
  const content = await readContent()
  const slug = c.req.param('slug')
  content.collections = content.collections.map((item) => (item.slug === slug ? collectionFromBody(body, slug) : item))
  await writeContent(content)
  return notice(c, 'Collection berhasil disimpan')
})

app.post('/admin/collections/:slug/delete', async (c) => {
  const { response } = await requireAdminPost(c)
  if (response) return response
  const content = await readContent()
  content.collections = content.collections.filter((item) => item.slug !== c.req.param('slug'))
  await writeContent(content)
  return notice(c, 'Collection berhasil dihapus')
})

app.post('/admin/products', async (c) => {
  const { body, response } = await requireAdminPost(c)
  if (response) return response
  const content = await readContent()
  const product = productFromBody(body)
  content.products = [product, ...content.products]
  ensureCategory(content, product.category)
  await writeContent(content)
  return notice(c, 'Produk berhasil ditambahkan')
})

app.post('/admin/products/:slug', async (c) => {
  const { body, response } = await requireAdminPost(c)
  if (response) return response
  const content = await readContent()
  const slug = c.req.param('slug')
  content.products = content.products.map((item) => (item.slug === slug ? productFromBody(body, slug) : item))
  ensureCategory(content, field(body, 'category'))
  await writeContent(content)
  return notice(c, 'Produk berhasil disimpan')
})

app.post('/admin/products/:slug/delete', async (c) => {
  const { response } = await requireAdminPost(c)
  if (response) return response
  const content = await readContent()
  content.products = content.products.filter((item) => item.slug !== c.req.param('slug'))
  await writeContent(content)
  return notice(c, 'Produk berhasil dihapus')
})

app.post('/admin/journal', async (c) => {
  const { body, response } = await requireAdminPost(c)
  if (response) return response
  const content = await readContent()
  content.journal = [journalFromBody(body), ...content.journal]
  await writeContent(content)
  return notice(c, 'Journal berhasil ditambahkan')
})

app.post('/admin/journal/:slug', async (c) => {
  const { body, response } = await requireAdminPost(c)
  if (response) return response
  const content = await readContent()
  const slug = c.req.param('slug')
  content.journal = content.journal.map((item) => (item.slug === slug ? journalFromBody(body, slug) : item))
  await writeContent(content)
  return notice(c, 'Journal berhasil disimpan')
})

app.post('/admin/journal/:slug/delete', async (c) => {
  const { response } = await requireAdminPost(c)
  if (response) return response
  const content = await readContent()
  content.journal = content.journal.filter((item) => item.slug !== c.req.param('slug'))
  await writeContent(content)
  return notice(c, 'Journal berhasil dihapus')
})

app.post('/admin/boutiques', async (c) => {
  const { body, response } = await requireAdminPost(c)
  if (response) return response
  const content = await readContent()
  content.boutiques = [boutiqueFromBody(body), ...content.boutiques]
  await writeContent(content)
  return notice(c, 'Boutique berhasil ditambahkan')
})

app.post('/admin/boutiques/:slug', async (c) => {
  const { body, response } = await requireAdminPost(c)
  if (response) return response
  const content = await readContent()
  const slug = c.req.param('slug')
  content.boutiques = content.boutiques.map((item) => (item.slug === slug ? boutiqueFromBody(body, slug) : item))
  await writeContent(content)
  return notice(c, 'Boutique berhasil disimpan')
})

app.post('/admin/boutiques/:slug/delete', async (c) => {
  const { response } = await requireAdminPost(c)
  if (response) return response
  const content = await readContent()
  content.boutiques = content.boutiques.filter((item) => item.slug !== c.req.param('slug'))
  await writeContent(content)
  return notice(c, 'Boutique berhasil dihapus')
})

app.post('/admin/content-json', async (c) => {
  const { body, response } = await requireAdminPost(c)
  if (response) return response
  try {
    const nextContent = JSON.parse(field(body, 'contentJson'))
    await writeContent(nextContent)
    return notice(c, 'JSON content berhasil disimpan')
  } catch {
    return notice(c, 'JSON tidak valid')
  }
})

app.notFound((c) => {
  return notFound(c)
})

if (isMainModule()) {
  const server = createServer(async (request, response) => {
    try {
      const webResponse = await app.fetch(toWebRequest(request))
      response.statusCode = webResponse.status
      for (const [key, value] of webResponse.headers) {
        response.setHeader(key, value)
      }

      if (!webResponse.body) {
        response.end()
        return
      }

      Readable.fromWeb(webResponse.body).pipe(response)
    } catch (error) {
      response.statusCode = 500
      response.setHeader('Content-Type', 'text/plain; charset=utf-8')
      response.end(isProduction ? 'Internal Server Error' : error.message)
    }
  })

  server.listen(port, hostname)

  console.log([
    `${process.env.APP_NAME || 'MAISON RAVA'} listening`,
    `env=${process.env.NODE_ENV || 'development'}`,
    `host=${hostname}`,
    `port=${port}`,
    `dataDir=${dataDir}`,
    `health=http://${hostname}:${port}/api/health`
  ].join(' | '))
}

function toWebRequest(request) {
  const host = request.headers.host || `${hostname}:${port}`
  const url = new URL(request.url || '/', `http://${host}`)
  const init = {
    method: request.method,
    headers: requestHeaders(request.headers)
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = Readable.toWeb(request)
    init.duplex = 'half'
  }

  return new Request(url, init)
}

function requestHeaders(rawHeaders) {
  const headers = new Headers()
  for (const [key, value] of Object.entries(rawHeaders)) {
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item)
    } else if (value) {
      headers.set(key, value)
    }
  }
  return headers
}

function campaignFromBody(body, fallbackSlug = '') {
  return {
    slug: cleanSlug(field(body, 'slug'), fallbackSlug || field(body, 'title')),
    number: field(body, 'number'),
    title: field(body, 'title'),
    text: field(body, 'text'),
    image: field(body, 'image'),
    alt: field(body, 'alt')
  }
}

function collectionFromBody(body, fallbackSlug = '') {
  return {
    slug: cleanSlug(field(body, 'slug'), fallbackSlug || field(body, 'title')),
    title: field(body, 'title'),
    season: field(body, 'season'),
    intro: field(body, 'intro'),
    coverImage: field(body, 'coverImage'),
    coverAlt: field(body, 'coverAlt'),
    productSlugs: listFromField(body, 'productSlugs'),
    sections: sectionsFromText(field(body, 'sectionsText'))
  }
}

function productFromBody(body, fallbackSlug = '') {
  return {
    slug: cleanSlug(field(body, 'slug'), fallbackSlug || field(body, 'title')),
    title: field(body, 'title'),
    category: field(body, 'category'),
    collectionSlug: field(body, 'collectionSlug'),
    line: field(body, 'line'),
    description: field(body, 'description'),
    price: field(body, 'price'),
    status: field(body, 'status'),
    images: ['image1', 'image2', 'image3'].map((key) => field(body, key)).filter(Boolean),
    alt: field(body, 'alt'),
    specs: specsFromText(field(body, 'specsText')),
    relatedSlugs: listFromField(body, 'relatedSlugs')
  }
}

function journalFromBody(body, fallbackSlug = '') {
  return {
    slug: cleanSlug(field(body, 'slug'), fallbackSlug || field(body, 'title')),
    type: field(body, 'type'),
    title: field(body, 'title'),
    summary: field(body, 'summary'),
    body: field(body, 'body'),
    image: field(body, 'image'),
    alt: field(body, 'alt')
  }
}

function boutiqueFromBody(body, fallbackSlug = '') {
  return {
    slug: cleanSlug(field(body, 'slug'), fallbackSlug || field(body, 'city')),
    city: field(body, 'city'),
    title: field(body, 'title'),
    address: field(body, 'address'),
    hours: field(body, 'hours'),
    email: field(body, 'email'),
    image: field(body, 'image'),
    alt: field(body, 'alt')
  }
}

function replaceImageReferences(content, oldSrc, fallback) {
  if (content.site.heroImage === oldSrc) content.site.heroImage = fallback
  if (content.code.image === oldSrc) content.code.image = fallback
  for (const item of content.campaigns) {
    if (item.image === oldSrc) item.image = fallback
  }
  for (const collection of content.collections) {
    if (collection.coverImage === oldSrc) collection.coverImage = fallback
    for (const section of collection.sections) {
      if (section.image === oldSrc) section.image = fallback
    }
  }
  for (const collection of [content.products, content.journal, content.boutiques]) {
    for (const item of collection) {
      if (item.image === oldSrc) item.image = fallback
      if (Array.isArray(item.images)) item.images = item.images.map((src) => (src === oldSrc ? fallback : src))
    }
  }
}

function ensureCategory(content, category) {
  const clean = String(category || '').trim()
  if (!clean) return
  const exists = content.categories.some((item) => item.toLowerCase() === clean.toLowerCase())
  if (!exists) content.categories.push(clean)
}

function findBySlug(items, slug) {
  return items.find((item) => item.slug === slug || item.id === slug)
}

function cleanSlug(value, fallback) {
  return slugify(value || fallback)
}

function listFromField(body, key) {
  return field(body, key)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function specsFromText(value) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split(':')
      return {
        label: (label || '').trim(),
        value: rest.join(':').trim()
      }
    })
    .filter((item) => item.label || item.value)
}

function sectionsFromText(value) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title = '', text = '', image = '', alt = ''] = line.split('|').map((part) => part.trim())
      return { title, text, image, alt }
    })
}

async function requireAdminPost(c) {
  const response = requireAdmin(c)
  if (response) return { response }
  const body = await c.req.parseBody()
  if (!verifyCsrf(c, field(body, '_csrf'))) {
    return { response: c.text('CSRF token tidak valid.', 403) }
  }
  return { body }
}

function requireAdmin(c) {
  if (isAdmin(c)) return null
  return c.redirect('/admin/login')
}

function isAdmin(c) {
  return verifySession(readCookie(c, 'rava_admin'))
}

function createSession() {
  const payload = `${Date.now()}.${randomUUID()}`
  return `${payload}.${sign(payload)}`
}

function verifySession(token) {
  if (!token) return false
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const payload = `${parts[0]}.${parts[1]}`
  const signature = parts[2]
  const age = Date.now() - Number(parts[0])
  if (!Number.isFinite(age) || age < 0 || age > sessionMaxAge * 1000) return false
  return safeEqual(signature, sign(payload))
}

function csrfToken(c) {
  const token = readCookie(c, 'rava_admin') || ''
  return sign(`csrf:${token}`)
}

function verifyCsrf(c, token) {
  return safeEqual(token, csrfToken(c))
}

function sign(value) {
  return createHmac('sha256', sessionSecret).update(value).digest('hex')
}

function safeEqual(a = '', b = '') {
  const left = Buffer.from(String(a))
  const right = Buffer.from(String(b))
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

function setAdminCookie(c, token) {
  setCookie(c, 'rava_admin', token, {
    path: '/',
    maxAge: sessionMaxAge,
    httpOnly: true,
    sameSite: 'Lax',
    secure: isSecureRequest(c)
  })
}

function clearAdminCookie(c) {
  deleteCookie(c, 'rava_admin', {
    path: '/',
    secure: isSecureRequest(c)
  })
}

function readCookie(c, name) {
  return getCookie(c, name) || ''
}

function isSecureRequest(c) {
  const proto = c.req.header('x-forwarded-proto') || new URL(c.req.url).protocol.replace(':', '')
  return proto === 'https'
}

function field(body, key) {
  const value = body?.[key]
  if (Array.isArray(value)) return String(value[0] || '').trim()
  if (typeof value === 'string') return value.trim()
  return ''
}

function notice(c, message) {
  return c.redirect(`/admin?notice=${encodeURIComponent(message)}`)
}

function publicOrigin(c) {
  const url = new URL(c.req.url)
  const proto = c.req.header('x-forwarded-proto') || url.protocol.replace(':', '')
  const host = c.req.header('x-forwarded-host') || c.req.header('host') || url.host
  return `${proto}://${host}`
}

function notFound(c, content) {
  c.header('Cache-Control', 'no-store')
  c.status(404)
  return c.html(renderNotFound(content))
}

function isMainModule() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
}
