import { Hono } from 'hono'
import { z } from 'zod'
import { deleteUploadedImage, newId, readContent, slugify, writeContent } from './content-store.js'
import { templateProfile } from './template-profile.js'

export const apiRoutes = new Hono()

const isProduction = process.env.NODE_ENV === 'production'
const adminToken = process.env.ADMIN_TOKEN || (isProduction ? '' : 'change-me-admin-token')
const writeBuckets = new Map()

const productInputSchema = z.object({
  title: z.string().min(1).max(140),
  slug: z.string().optional().default(''),
  category: z.string().min(1).max(80),
  collectionSlug: z.string().optional().default(''),
  line: z.string().optional().default(''),
  description: z.string().min(1).max(1200),
  priceValue: z.coerce.number().min(0),
  currency: z.string().min(2).max(8).default('EUR'),
  status: z.string().optional().default('Available'),
  images: z.array(z.string()).default(['/assets/hero-atelier.jpg']),
  alt: z.string().optional().default(''),
  sizes: z.array(z.string()).default(['XS', 'S', 'M', 'L']),
  specs: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
  relatedSlugs: z.array(z.string()).default([])
}).passthrough()

const collectionInputSchema = z.object({
  title: z.string().min(1).max(160),
  slug: z.string().optional().default(''),
  season: z.string().optional().default(''),
  intro: z.string().min(1).max(800),
  description: z.string().optional().default(''),
  coverImage: z.string().optional().default('/assets/hero-atelier.jpg'),
  coverAlt: z.string().optional().default(''),
  productSlugs: z.array(z.string()).default([]),
  sections: z.array(z.object({
    title: z.string().default(''),
    text: z.string().default(''),
    image: z.string().default('/assets/hero-atelier.jpg'),
    alt: z.string().default('')
  })).default([])
}).passthrough()

const editorialInputSchema = z.object({
  title: z.string().min(1).max(180),
  slug: z.string().optional().default(''),
  type: z.string().optional().default('Editorial'),
  summary: z.string().min(1).max(600),
  body: z.string().min(1).max(8000),
  image: z.string().optional().default('/assets/hero-atelier.jpg'),
  alt: z.string().optional().default('')
}).passthrough()

const homepageSchema = z.object({
  featuredCampaign: z.string().optional().default(''),
  featuredCollectionSlug: z.string().optional().default(''),
  featuredProductSlugs: z.array(z.string()).default([]),
  featuredEditorialSlugs: z.array(z.string()).default([]),
  campaigns: z.array(z.object({
    slug: z.string(),
    number: z.string().default(''),
    title: z.string(),
    text: z.string(),
    image: z.string().default('/assets/hero-atelier.jpg'),
    alt: z.string().default('')
  })).default([])
}).passthrough()

const siteSchema = z.object({
  brand: z.string().min(1).max(120),
  mark: z.string().min(1).max(12),
  description: z.string().min(1).max(500),
  heroEyebrow: z.string().default(''),
  heroTitle: z.string().min(1).max(140),
  heroText: z.string().min(1).max(500),
  heroImage: z.string().default('/assets/hero-atelier.jpg'),
  heroAlt: z.string().default(''),
  primaryCta: z.string().default('Enter the shop'),
  secondaryCta: z.string().default('View collections'),
  whatsapp: z.string().optional().default('')
}).passthrough()

const newsletterSchema = z.object({
  email: z.string().email(),
  source: z.string().max(120).optional().default('website')
})

const contactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  message: z.string().min(1).max(1200)
})

const quoteSchema = z.object({
  items: z.array(z.object({
    slug: z.string().min(1),
    quantity: z.coerce.number().int().min(1).max(99)
  })).min(1)
})

const orderSchema = z.object({
  customer: z.object({
    name: z.string().min(1).max(120),
    email: z.string().email(),
    phone: z.string().min(3).max(60),
    country: z.string().min(2).max(80),
    address: z.string().min(5).max(500)
  }),
  items: quoteSchema.shape.items,
  paymentMethod: z.enum(['QRIS', 'Bank Transfer', 'E-Wallet'])
})

const campaignInputSchema = z.object({
  slug: z.string().optional().default(''),
  number: z.string().max(12).optional().default(''),
  title: z.string().min(1).max(160),
  text: z.string().min(1).max(800),
  image: z.string().optional().default('/assets/hero-atelier.jpg'),
  alt: z.string().optional().default('')
}).passthrough()

const boutiqueInputSchema = z.object({
  slug: z.string().optional().default(''),
  city: z.string().min(1).max(100),
  title: z.string().min(1).max(160),
  address: z.string().min(1).max(500),
  hours: z.string().min(1).max(200),
  email: z.string().email(),
  image: z.string().optional().default('/assets/hero-atelier.jpg'),
  alt: z.string().optional().default('')
}).passthrough()

const mediaPatchSchema = z.object({
  alt: z.string().max(180).optional()
})

apiRoutes.onError((error, c) => {
  const message = isProduction ? 'Unexpected server error.' : error.message
  return errorJson(c, 'SERVER_ERROR', message, 500)
})

apiRoutes.notFound((c) => {
  return errorJson(c, 'NOT_FOUND', 'API endpoint not found.', 404)
})

apiRoutes.get('/', (c) => ok(c, {
  service: 'maison-rava-api',
  brand: 'MAISON RAVA',
  health: '/api/health',
  routes: '/api/routes',
  versioned: '/api/v1'
}, 'public, max-age=3600'))

apiRoutes.get('/health', async (c) => {
  const content = await readContent()
  return ok(c, {
    service: 'maison-rava',
    environment: process.env.NODE_ENV || 'development',
    storage: 'file-json',
    products: content.products.length,
    collections: content.collections.length,
    editorials: content.editorials.length,
    uptime: Math.round(process.uptime())
  })
})

apiRoutes.get('/site', withApi(async (c) => ok(c, (await readContent()).site, 'public, max-age=60')))
apiRoutes.get('/homepage', withApi(async (c) => ok(c, homepagePayload(await readContent()), 'public, max-age=60')))
apiRoutes.get('/navigation', withApi(async (c) => ok(c, navigationPayload(await readContent()), 'public, max-age=300')))
apiRoutes.get('/template', (c) => ok(c, templateProfile, 'public, max-age=3600'))
apiRoutes.get('/content', withApi(async (c) => ok(c, toPublicContent(await readContent()))))
apiRoutes.get('/content/summary', withApi(async (c) => {
  const content = await readContent()
  return ok(c, {
    site: content.site,
    template: templateProfile.id,
    storage: 'file-json',
    campaigns: content.campaigns.length,
    collections: content.collections.length,
    products: content.products.length,
    editorials: content.editorials.length,
    orders: content.orders.length
  })
}))

apiRoutes.get('/routes', (c) => ok(c, routeMap(), 'public, max-age=3600'))

apiRoutes.get('/maison', withApi(async (c) => {
  const content = await readContent()
  return ok(c, maisonPayload(content), 'public, max-age=120')
}))

apiRoutes.get('/featured', withApi(async (c) => {
  const content = await readContent()
  return ok(c, featuredPayload(content), 'public, max-age=60')
}))

apiRoutes.get('/lookbook', withApi(async (c) => {
  const content = await readContent()
  return ok(c, lookbookPayload(content), 'public, max-age=120')
}))

apiRoutes.get('/campaigns', withApi(async (c) => {
  const content = await readContent()
  const featured = findBySlug(content.campaigns, content.homepage.featuredCampaign) || content.campaigns[0] || null
  return ok(c, {
    items: content.campaigns.map((campaign) => campaignPreview(campaign, content)),
    featured: featured ? campaignPreview(featured, content) : null
  }, 'public, max-age=120')
}))

apiRoutes.get('/campaigns/:slug', withApi(async (c) => {
  const content = await readContent()
  const campaign = findBySlug(content.campaigns, c.req.param('slug'))
  if (!campaign) return errorJson(c, 'NOT_FOUND', 'Campaign not found.', 404)
  return ok(c, campaignPayload(campaign, content), 'public, max-age=120')
}))

apiRoutes.get('/categories', withApi(async (c) => {
  const content = await readContent()
  return ok(c, { items: categoryPayload(content) }, 'public, max-age=120')
}))

apiRoutes.get('/categories/:slug', withApi(async (c) => {
  const content = await readContent()
  const category = categoryPayload(content).find((item) => item.slug === normalizeSearch(c.req.param('slug')))
  if (!category) return errorJson(c, 'NOT_FOUND', 'Category not found.', 404)
  const query = { ...c.req.query(), category: category.slug === 'all' ? '' : category.label }
  return ok(c, {
    item: category,
    products: productListPayload(content, query)
  }, 'public, max-age=60')
}))

apiRoutes.get('/filters', withApi(async (c) => {
  const content = await readContent()
  return ok(c, filterPayload(content), 'public, max-age=120')
}))

apiRoutes.get('/collections', withApi(async (c) => {
  const content = await readContent()
  return ok(c, { items: content.collections.map(collectionPreview) }, 'public, max-age=60')
}))

apiRoutes.get('/collections/:slug/products', withApi(async (c) => {
  const content = await readContent()
  const collection = findBySlug(content.collections, c.req.param('slug'))
  if (!collection) return errorJson(c, 'NOT_FOUND', 'Collection not found.', 404)
  const query = { ...c.req.query(), collection: collection.slug }
  return ok(c, {
    collection: collectionPreview(collection),
    products: productListPayload(content, query)
  }, 'public, max-age=60')
}))

apiRoutes.get('/collections/:slug', withApi(async (c) => {
  const content = await readContent()
  const collection = findBySlug(content.collections, c.req.param('slug'))
  if (!collection) return errorJson(c, 'NOT_FOUND', 'Collection not found.', 404)
  return ok(c, {
    item: collection,
    products: collection.productSlugs.map((slug) => findBySlug(content.products, slug)).filter(Boolean).map(productPreview)
  }, 'public, max-age=60')
}))

apiRoutes.get('/products', withApi(async (c) => {
  const content = await readContent()
  return ok(c, productListPayload(content, c.req.query()), 'public, max-age=30')
}))

apiRoutes.get('/products/:slug/availability', withApi(async (c) => {
  const content = await readContent()
  const product = findBySlug(content.products, c.req.param('slug'))
  if (!product) return errorJson(c, 'NOT_FOUND', 'Product not found.', 404)
  return ok(c, productAvailability(product, content), 'public, max-age=30')
}))

apiRoutes.get('/products/:slug/related', withApi(async (c) => {
  const content = await readContent()
  const product = findBySlug(content.products, c.req.param('slug'))
  if (!product) return errorJson(c, 'NOT_FOUND', 'Product not found.', 404)
  return ok(c, {
    item: productPreview(product),
    related: relatedProducts(product, content).map(productPreview)
  }, 'public, max-age=30')
}))

apiRoutes.get('/products/:slug', withApi(async (c) => {
  const content = await readContent()
  const product = findBySlug(content.products, c.req.param('slug'))
  if (!product) return errorJson(c, 'NOT_FOUND', 'Product not found.', 404)
  return ok(c, {
    item: product,
    collection: findBySlug(content.collections, product.collectionSlug) || null,
    related: product.relatedSlugs.map((slug) => findBySlug(content.products, slug)).filter(Boolean).map(productPreview)
  }, 'public, max-age=30')
}))

apiRoutes.get('/editorials/types', withApi(async (c) => {
  const content = await readContent()
  return ok(c, { items: editorialTypes(content) }, 'public, max-age=120')
}))

apiRoutes.get('/editorials/type/:type', withApi(async (c) => {
  const content = await readContent()
  const type = normalizeSearch(c.req.param('type'))
  const filtered = content.editorials.filter((article) => normalizeSearch(article.type) === type)
  const { items, meta } = paginate(sortEditorials(filtered), c.req.query())
  return ok(c, {
    type,
    items: items.map(editorialPreview),
    meta
  }, 'public, max-age=60')
}))

apiRoutes.get('/editorials', withApi(async (c) => {
  const content = await readContent()
  const { items, meta } = paginate(sortEditorials(content.editorials), c.req.query())
  return ok(c, { items: items.map(editorialPreview), meta }, 'public, max-age=60')
}))

apiRoutes.get('/editorials/:slug', withApi(async (c) => {
  const content = await readContent()
  const article = findBySlug(content.editorials, c.req.param('slug'))
  if (!article) return errorJson(c, 'NOT_FOUND', 'Editorial not found.', 404)
  return ok(c, { item: article }, 'public, max-age=60')
}))

apiRoutes.get('/journal', withApi(async (c) => ok(c, { items: (await readContent()).editorials.map(editorialPreview) })))
apiRoutes.get('/journal/:slug', withApi(async (c) => {
  const content = await readContent()
  const article = findBySlug(content.editorials, c.req.param('slug'))
  if (!article) return errorJson(c, 'NOT_FOUND', 'Article not found.', 404)
  return ok(c, { item: article })
}))

apiRoutes.get('/boutiques', withApi(async (c) => ok(c, { items: (await readContent()).boutiques }, 'public, max-age=60')))

apiRoutes.get('/boutiques/:slug', withApi(async (c) => {
  const content = await readContent()
  const boutique = findBySlug(content.boutiques, c.req.param('slug'))
  if (!boutique) return errorJson(c, 'NOT_FOUND', 'Boutique not found.', 404)
  return ok(c, {
    item: boutique,
    appointment: content.appointment,
    nearbyProducts: content.products.slice(0, 4).map(productPreview)
  }, 'public, max-age=60')
}))

apiRoutes.get('/checkout/options', withApi(async (c) => ok(c, checkoutOptions(), 'public, max-age=300')))
apiRoutes.get('/payments/options', withApi(async (c) => ok(c, paymentOptions(), 'public, max-age=300')))

apiRoutes.get('/search/suggestions', withApi(async (c) => {
  const content = await readContent()
  return ok(c, suggestionsPayload(content, c.req.query('q')), 'public, max-age=60')
}))

apiRoutes.get('/search', withApi(async (c) => {
  const content = await readContent()
  const query = normalizeSearch(c.req.query('q'))
  if (!query) return ok(c, { query: '', products: [], collections: [], editorials: [] })
  return ok(c, searchPayload(content, query))
}))

apiRoutes.post('/newsletter', withApi(async (c) => {
  if (!rateLimit(c, 'newsletter', 8)) return errorJson(c, 'RATE_LIMITED', 'Too many newsletter attempts.', 429)
  const payload = await parseJson(c, newsletterSchema)
  const content = await readContent()
  const exists = content.subscribers.some((item) => item.email.toLowerCase() === payload.email.toLowerCase())
  if (!exists) {
    content.subscribers.unshift({
      id: newId('sub'),
      email: payload.email,
      source: payload.source,
      createdAt: new Date().toISOString()
    })
    await writeContent(content)
  }
  return ok(c, { subscribed: true }, undefined, 201)
}))

apiRoutes.post('/contact', withApi(async (c) => {
  if (!rateLimit(c, 'contact', 6)) return errorJson(c, 'RATE_LIMITED', 'Too many contact attempts.', 429)
  const payload = await parseJson(c, contactSchema)
  return ok(c, {
    received: true,
    reference: newId('contact'),
    message: `Thank you ${payload.name}. MAISON RAVA will respond by email.`
  }, undefined, 201)
}))

apiRoutes.post('/cart/quote', withApi(async (c) => {
  const payload = await parseJson(c, quoteSchema)
  const content = await readContent()
  return ok(c, quoteItems(content.products, payload.items))
}))

apiRoutes.post('/orders', withApi(async (c) => {
  if (!rateLimit(c, 'orders', 5)) return errorJson(c, 'RATE_LIMITED', 'Too many order attempts.', 429)
  const payload = await parseJson(c, orderSchema)
  const content = await readContent()
  const quote = quoteItems(content.products, payload.items)
  const invoiceId = readableInvoiceId()
  const order = {
    id: invoiceId,
    invoiceId,
    customer: payload.customer,
    email: payload.customer.email,
    items: quote.items,
    totals: quote.totals,
    paymentMethod: payload.paymentMethod,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  content.orders.unshift(order)
  await writeContent(content)
  return ok(c, { order }, undefined, 201)
}))

apiRoutes.get('/orders/:orderId', withApi(async (c) => {
  const content = await readContent()
  const orderId = normalizeId(c.req.param('orderId'))
  const email = String(c.req.query('email') || '').trim().toLowerCase()
  const order = content.orders.find((item) => normalizeId(item.invoiceId || item.id) === orderId && String(item.email || item.customer?.email || '').toLowerCase() === email)
  if (!order) return errorJson(c, 'NOT_FOUND', 'Order not found for that email.', 404)
  return ok(c, { order: publicOrder(order) })
}))

apiRoutes.post('/payments/mock-webhook', withApi(async (c) => {
  const payload = await c.req.json().catch(() => ({}))
  const invoiceId = normalizeId(payload.invoiceId || payload.orderId || '')
  const status = ['pending', 'paid', 'processing', 'cancelled'].includes(payload.status) ? payload.status : 'paid'
  const content = await readContent()
  const order = content.orders.find((item) => normalizeId(item.invoiceId || item.id) === invoiceId)
  if (!order) return errorJson(c, 'NOT_FOUND', 'Order not found.', 404)
  order.status = status
  order.updatedAt = new Date().toISOString()
  await writeContent(content)
  return ok(c, { order: publicOrder(order) })
}))

apiRoutes.post('/admin/login', withApi(async (c) => {
  const body = await c.req.json().catch(() => ({}))
  if (!adminToken || body.token !== adminToken) return errorJson(c, 'UNAUTHORIZED', 'Invalid admin token.', 401)
  return ok(c, {
    token: adminToken,
    mode: process.env.NODE_ENV || 'development',
    warning: adminToken === 'change-me-admin-token' ? 'Change ADMIN_TOKEN before production.' : ''
  })
}))

apiRoutes.use('/admin/*', async (c, next) => {
  if (!isAdminRequest(c)) return errorJson(c, 'UNAUTHORIZED', 'Admin token required.', 401)
  await next()
})

apiRoutes.get('/admin/stats', withApi(async (c) => {
  const content = await readContent()
  return ok(c, statsPayload(content))
}))

apiRoutes.get('/admin/dashboard', withApi(async (c) => {
  const content = await readContent()
  return ok(c, adminDashboardPayload(content))
}))

apiRoutes.get('/admin/content/export', withApi(async (c) => ok(c, await readContent())))

apiRoutes.get('/admin/products', withApi(async (c) => ok(c, { items: (await readContent()).products })))
apiRoutes.post('/admin/products', withApi(async (c) => createEntity(c, 'products', productInputSchema, normalizeProductInput)))
apiRoutes.patch('/admin/products/:id', withApi(async (c) => updateEntity(c, 'products', productInputSchema.partial(), normalizeProductInput)))
apiRoutes.delete('/admin/products/:id', withApi(async (c) => deleteEntity(c, 'products')))

apiRoutes.get('/admin/campaigns', withApi(async (c) => ok(c, { items: (await readContent()).campaigns })))
apiRoutes.post('/admin/campaigns', withApi(async (c) => createEntity(c, 'campaigns', campaignInputSchema, normalizeCampaignInput)))
apiRoutes.patch('/admin/campaigns/:id', withApi(async (c) => updateEntity(c, 'campaigns', campaignInputSchema.partial(), normalizeCampaignInput)))
apiRoutes.delete('/admin/campaigns/:id', withApi(async (c) => deleteEntity(c, 'campaigns')))

apiRoutes.get('/admin/collections', withApi(async (c) => ok(c, { items: (await readContent()).collections })))
apiRoutes.post('/admin/collections', withApi(async (c) => createEntity(c, 'collections', collectionInputSchema, normalizeCollectionInput)))
apiRoutes.patch('/admin/collections/:id', withApi(async (c) => updateEntity(c, 'collections', collectionInputSchema.partial(), normalizeCollectionInput)))
apiRoutes.delete('/admin/collections/:id', withApi(async (c) => deleteEntity(c, 'collections')))

apiRoutes.get('/admin/editorials', withApi(async (c) => ok(c, { items: (await readContent()).editorials })))
apiRoutes.post('/admin/editorials', withApi(async (c) => createEntity(c, 'editorials', editorialInputSchema, normalizeEditorialInput)))
apiRoutes.patch('/admin/editorials/:id', withApi(async (c) => updateEntity(c, 'editorials', editorialInputSchema.partial(), normalizeEditorialInput)))
apiRoutes.delete('/admin/editorials/:id', withApi(async (c) => deleteEntity(c, 'editorials')))

apiRoutes.get('/admin/boutiques', withApi(async (c) => ok(c, { items: (await readContent()).boutiques })))
apiRoutes.post('/admin/boutiques', withApi(async (c) => createEntity(c, 'boutiques', boutiqueInputSchema, normalizeBoutiqueInput)))
apiRoutes.patch('/admin/boutiques/:id', withApi(async (c) => updateEntity(c, 'boutiques', boutiqueInputSchema.partial(), normalizeBoutiqueInput)))
apiRoutes.delete('/admin/boutiques/:id', withApi(async (c) => deleteEntity(c, 'boutiques')))

apiRoutes.get('/admin/media', withApi(async (c) => ok(c, { items: (await readContent()).media })))
apiRoutes.patch('/admin/media/:id', withApi(async (c) => {
  const body = await parseJson(c, mediaPatchSchema)
  const content = await readContent()
  const media = findById(content.media, c.req.param('id'))
  if (!media) return errorJson(c, 'NOT_FOUND', 'Media item not found.', 404)
  Object.assign(media, body)
  await writeContent(content)
  return ok(c, { item: media })
}))
apiRoutes.delete('/admin/media/:id', withApi(async (c) => {
  const content = await readContent()
  const media = findById(content.media, c.req.param('id'))
  if (!media) return errorJson(c, 'NOT_FOUND', 'Media item not found.', 404)
  if (media.builtin) return errorJson(c, 'LOCKED', 'Built-in media cannot be deleted.', 409)
  await deleteUploadedImage(media)
  content.media = content.media.filter((item) => item.id !== media.id)
  await writeContent(content)
  return ok(c, { deleted: true })
}))

apiRoutes.get('/admin/orders', withApi(async (c) => ok(c, { items: (await readContent()).orders })))
apiRoutes.get('/admin/orders/:id', withApi(async (c) => {
  const content = await readContent()
  const order = findById(content.orders, c.req.param('id'))
  if (!order) return errorJson(c, 'NOT_FOUND', 'Order not found.', 404)
  return ok(c, { item: order })
}))
apiRoutes.patch('/admin/orders/:id', withApi(async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const status = z.enum(['pending', 'paid', 'processing', 'cancelled', 'fulfilled']).parse(body.status)
  const content = await readContent()
  const item = findById(content.orders, c.req.param('id'))
  if (!item) return errorJson(c, 'NOT_FOUND', 'Order not found.', 404)
  item.status = status
  item.updatedAt = new Date().toISOString()
  await writeContent(content)
  return ok(c, { item })
}))

apiRoutes.get('/admin/subscribers', withApi(async (c) => ok(c, { items: (await readContent()).subscribers })))
apiRoutes.delete('/admin/subscribers/:id', withApi(async (c) => {
  const content = await readContent()
  const id = c.req.param('id')
  const before = content.subscribers.length
  content.subscribers = content.subscribers.filter((item) => item.id !== id && item.email !== id)
  if (content.subscribers.length === before) return errorJson(c, 'NOT_FOUND', 'Subscriber not found.', 404)
  await writeContent(content)
  return ok(c, { deleted: true })
}))

apiRoutes.get('/admin/homepage', withApi(async (c) => ok(c, (await readContent()).homepage)))
apiRoutes.patch('/admin/homepage', withApi(async (c) => {
  const content = await readContent()
  const payload = { ...content.homepage, ...(await parseJson(c, homepageSchema.partial())) }
  content.homepage = payload
  content.campaigns = payload.campaigns
  await writeContent(content)
  return ok(c, { item: payload })
}))

apiRoutes.get('/admin/site', withApi(async (c) => ok(c, (await readContent()).site)))
apiRoutes.patch('/admin/site', withApi(async (c) => {
  const content = await readContent()
  const payload = await parseJson(c, siteSchema.partial())
  content.site = { ...content.site, ...payload }
  await writeContent(content)
  return ok(c, { item: content.site })
}))

function withApi(handler) {
  return async (c) => {
    try {
      return await handler(c)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return errorJson(c, 'VALIDATION_ERROR', error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '), 400)
      }
      throw error
    }
  }
}

async function parseJson(c, schema) {
  const body = await c.req.json().catch(() => null)
  if (!body) throw new z.ZodError([{ code: 'custom', path: ['body'], message: 'JSON body is required.' }])
  return schema.parse(body)
}

async function createEntity(c, key, schema, normalizer) {
  const payload = normalizer(await parseJson(c, schema))
  const content = await readContent()
  content[key] = [payload, ...content[key]]
  syncContentBuckets(content, key)
  await writeContent(content)
  return ok(c, { item: payload }, undefined, 201)
}

async function updateEntity(c, key, schema, normalizer) {
  const content = await readContent()
  const current = findById(content[key], c.req.param('id'))
  if (!current) return errorJson(c, 'NOT_FOUND', 'Item not found.', 404)
  const payload = normalizer({ ...current, ...(await parseJson(c, schema)) }, current.slug || current.id)
  content[key] = content[key].map((item) => (item.id === current.id || item.slug === current.slug ? payload : item))
  syncContentBuckets(content, key)
  await writeContent(content)
  return ok(c, { item: payload })
}

async function deleteEntity(c, key) {
  const content = await readContent()
  const before = content[key].length
  content[key] = content[key].filter((item) => item.id !== c.req.param('id') && item.slug !== c.req.param('id'))
  if (content[key].length === before) return errorJson(c, 'NOT_FOUND', 'Item not found.', 404)
  syncContentBuckets(content, key)
  await writeContent(content)
  return ok(c, { deleted: true })
}

function syncContentBuckets(content, key) {
  if (key === 'editorials') {
    content.journal = content.editorials
  }

  if (key === 'campaigns') {
    content.homepage = {
      ...content.homepage,
      campaigns: content.campaigns
    }
  }

  if (key === 'products') {
    for (const product of content.products) {
      const category = String(product.category || '').trim()
      if (category && !content.categories.some((item) => item.toLowerCase() === category.toLowerCase())) {
        content.categories.push(category)
      }
    }
  }
}

function normalizeProductInput(input, fallbackSlug = '') {
  const slug = slugify(input.slug || fallbackSlug || input.title)
  return {
    ...input,
    id: slug,
    slug,
    price: `${input.currency || 'EUR'} ${Number(input.priceValue || 0).toLocaleString('en-US')}`,
    image: input.images[0] || '/assets/hero-atelier.jpg',
    alt: input.alt || `${input.title} product image.`,
    createdAt: input.createdAt || new Date().toISOString()
  }
}

function normalizeCollectionInput(input, fallbackSlug = '') {
  const slug = slugify(input.slug || fallbackSlug || input.title)
  return {
    ...input,
    id: slug,
    slug,
    description: input.description || input.intro,
    coverAlt: input.coverAlt || `${input.title} collection image.`
  }
}

function normalizeEditorialInput(input, fallbackSlug = '') {
  const slug = slugify(input.slug || fallbackSlug || input.title)
  return {
    ...input,
    id: slug,
    slug,
    alt: input.alt || `${input.title} editorial image.`,
    publishedAt: input.publishedAt || new Date().toISOString()
  }
}

function normalizeCampaignInput(input, fallbackSlug = '') {
  const slug = slugify(input.slug || fallbackSlug || input.title)
  return {
    ...input,
    id: slug,
    slug,
    number: input.number || '',
    image: input.image || '/assets/hero-atelier.jpg',
    alt: input.alt || `${input.title} campaign image.`
  }
}

function normalizeBoutiqueInput(input, fallbackSlug = '') {
  const slug = slugify(input.slug || fallbackSlug || input.city || input.title)
  return {
    ...input,
    id: slug,
    slug,
    image: input.image || '/assets/hero-atelier.jpg',
    alt: input.alt || `${input.title} boutique image.`
  }
}

function routeMap() {
  return {
    service: 'maison-rava-api',
    version: '1.0.0',
    public: [
      'GET /api',
      'GET /api/health',
      'GET /api/routes',
      'GET /api/site',
      'GET /api/homepage',
      'GET /api/navigation',
      'GET /api/template',
      'GET /api/content',
      'GET /api/content/summary',
      'GET /api/maison',
      'GET /api/featured',
      'GET /api/lookbook',
      'GET /api/campaigns',
      'GET /api/campaigns/:slug',
      'GET /api/categories',
      'GET /api/categories/:slug',
      'GET /api/filters',
      'GET /api/collections',
      'GET /api/collections/:slug',
      'GET /api/collections/:slug/products',
      'GET /api/products',
      'GET /api/products/:slug',
      'GET /api/products/:slug/availability',
      'GET /api/products/:slug/related',
      'GET /api/editorials',
      'GET /api/editorials/:slug',
      'GET /api/editorials/types',
      'GET /api/editorials/type/:type',
      'GET /api/journal',
      'GET /api/journal/:slug',
      'GET /api/boutiques',
      'GET /api/boutiques/:slug',
      'GET /api/search',
      'GET /api/search/suggestions',
      'GET /api/checkout/options',
      'GET /api/payments/options',
      'POST /api/newsletter',
      'POST /api/contact',
      'POST /api/cart/quote',
      'POST /api/orders',
      'GET /api/orders/:orderId',
      'POST /api/payments/mock-webhook'
    ],
    admin: [
      'POST /api/admin/login',
      'GET /api/admin/dashboard',
      'GET /api/admin/stats',
      'GET /api/admin/content/export',
      'GET|POST|PATCH|DELETE /api/admin/products',
      'GET|POST|PATCH|DELETE /api/admin/campaigns',
      'GET|POST|PATCH|DELETE /api/admin/collections',
      'GET|POST|PATCH|DELETE /api/admin/editorials',
      'GET|POST|PATCH|DELETE /api/admin/boutiques',
      'GET|PATCH|DELETE /api/admin/media',
      'GET|PATCH /api/admin/orders',
      'GET|DELETE /api/admin/subscribers',
      'GET|PATCH /api/admin/homepage',
      'GET|PATCH /api/admin/site'
    ]
  }
}

function maisonPayload(content) {
  return {
    brand: content.site.brand,
    description: content.site.description,
    theme: content.site.theme,
    code: content.code,
    timeline: content.timeline,
    metrics: content.metrics,
    appointment: content.appointment,
    newsletter: content.newsletter,
    boutiques: content.boutiques,
    media: content.media.filter((item) => item.builtin).slice(0, 8)
  }
}

function featuredPayload(content) {
  const campaign = findBySlug(content.campaigns, content.homepage.featuredCampaign) || content.campaigns[0] || null
  const collection = findBySlug(content.collections, content.homepage.featuredCollectionSlug) || content.collections[0] || null
  return {
    campaign: campaign ? campaignPreview(campaign, content) : null,
    collection: collection ? collectionPreview(collection) : null,
    products: featuredBySlug(content.products, content.homepage.featuredProductSlugs, 8).map(productPreview),
    editorials: featuredBySlug(content.editorials, content.homepage.featuredEditorialSlugs, 4).map(editorialPreview),
    categories: categoryPayload(content).slice(0, 7)
  }
}

function lookbookPayload(content) {
  return {
    hero: {
      title: content.site.heroTitle,
      text: content.site.heroText,
      image: content.site.heroImage,
      alt: content.site.heroAlt
    },
    campaigns: content.campaigns.map((campaign) => campaignPreview(campaign, content)),
    collections: content.collections.map((collection) => ({
      ...collectionPreview(collection),
      sections: collection.sections,
      products: collection.productSlugs.map((slug) => findBySlug(content.products, slug)).filter(Boolean).map(productPreview)
    })),
    editorials: sortEditorials(content.editorials).slice(0, 6).map(editorialPreview)
  }
}

function campaignPreview(campaign, content) {
  const collection = content.collections.find((item) => item.coverImage === campaign.image || item.productSlugs.some((slug) => content.homepage.featuredProductSlugs.includes(slug)))
  return {
    id: campaign.id || campaign.slug,
    slug: campaign.slug,
    number: campaign.number,
    title: campaign.title,
    text: campaign.text,
    image: campaign.image,
    alt: campaign.alt,
    href: `/campaigns/${campaign.slug}`,
    collectionSlug: collection?.slug || ''
  }
}

function campaignPayload(campaign, content) {
  const products = content.products
    .filter((product) => searchText(product).includes(normalizeSearch(campaign.title)) || content.homepage.featuredProductSlugs.includes(product.slug))
    .slice(0, 8)
  return {
    item: campaignPreview(campaign, content),
    products: (products.length ? products : content.products.slice(0, 8)).map(productPreview),
    editorials: content.editorials.filter((article) => searchText(article).includes(normalizeSearch(campaign.title))).slice(0, 4).map(editorialPreview),
    collections: content.collections.filter((collection) => collection.coverImage === campaign.image).map(collectionPreview)
  }
}

function categoryPayload(content) {
  return content.categories.map((label) => {
    const slug = slugify(label)
    const products = label.toLowerCase() === 'all'
      ? content.products
      : content.products.filter((product) => normalizeSearch(product.category) === normalizeSearch(label))
    return {
      label,
      slug,
      count: products.length,
      href: slug === 'all' ? '/shop' : `/shop?category=${encodeURIComponent(label.toLowerCase())}`,
      image: products[0]?.images?.[0] || content.site.heroImage,
      featuredProduct: products[0] ? productPreview(products[0]) : null
    }
  })
}

function filterPayload(content) {
  const prices = content.products.map((product) => Number(product.priceValue || 0)).filter(Number.isFinite)
  return {
    categories: categoryPayload(content),
    collections: content.collections.map(collectionPreview),
    lines: unique(content.products.map((product) => product.line)).map((line) => ({ label: line, slug: slugify(line) })),
    statuses: unique(content.products.map((product) => product.status)).map((status) => ({ label: status, slug: slugify(status) })),
    price: {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0,
      currency: content.products[0]?.currency || 'EUR'
    },
    sort: [
      { value: 'newest', label: 'Newest' },
      { value: 'price-low', label: 'Price low' },
      { value: 'price-high', label: 'Price high' },
      { value: 'title', label: 'Title' }
    ]
  }
}

function productAvailability(product, content) {
  return {
    slug: product.slug,
    status: product.status,
    purchasable: !/appointment|made to order/i.test(product.status),
    appointmentRequired: /appointment|made to order/i.test(product.status),
    sizes: product.sizes || [],
    service: content.appointment,
    checkout: checkoutOptions()
  }
}

function relatedProducts(product, content) {
  const explicit = product.relatedSlugs.map((slug) => findBySlug(content.products, slug)).filter(Boolean)
  const sameCollection = content.products.filter((item) => item.collectionSlug === product.collectionSlug && item.slug !== product.slug)
  const sameCategory = content.products.filter((item) => item.category === product.category && item.slug !== product.slug)
  return uniqueBySlug([...explicit, ...sameCollection, ...sameCategory]).slice(0, 8)
}

function editorialTypes(content) {
  return unique(content.editorials.map((article) => article.type)).map((type) => ({
    label: type,
    slug: slugify(type),
    count: content.editorials.filter((article) => article.type === type).length
  }))
}

function searchPayload(content, query) {
  const products = content.products.filter((item) => searchText(item).includes(query))
  const collections = content.collections.filter((item) => searchText(item).includes(query))
  const editorials = content.editorials.filter((item) => searchText(item).includes(query))
  const campaigns = content.campaigns.filter((item) => searchText(item).includes(query))
  const boutiques = content.boutiques.filter((item) => searchText(item).includes(query))
  return {
    query,
    products: products.slice(0, 12).map(productPreview),
    collections: collections.slice(0, 8).map(collectionPreview),
    editorials: editorials.slice(0, 8).map(editorialPreview),
    campaigns: campaigns.slice(0, 6).map((campaign) => campaignPreview(campaign, content)),
    boutiques: boutiques.slice(0, 6),
    total: products.length + collections.length + editorials.length + campaigns.length + boutiques.length,
    suggestions: suggestionsPayload(content, query).items.slice(0, 8)
  }
}

function suggestionsPayload(content, value = '') {
  const query = normalizeSearch(value)
  const terms = [
    ...content.categories,
    ...content.products.map((item) => item.title),
    ...content.products.map((item) => item.line),
    ...content.collections.map((item) => item.title),
    ...content.editorials.map((item) => item.title),
    ...content.campaigns.map((item) => item.title)
  ]
  const items = unique(terms)
    .filter((term) => !query || normalizeSearch(term).includes(query))
    .slice(0, 12)
    .map((term) => ({ label: term, value: term, slug: slugify(term) }))
  return { query, items }
}

function checkoutOptions() {
  return {
    currency: 'EUR',
    shipping: [
      { id: 'private-pickup', label: 'Private salon pickup', price: 0 },
      { id: 'insured-courier', label: 'Insured courier', price: 35 }
    ],
    paymentMethods: paymentOptions().items,
    orderStatuses: ['pending', 'paid', 'processing', 'fulfilled', 'cancelled']
  }
}

function paymentOptions() {
  return {
    items: [
      { id: 'qris', label: 'QRIS', mode: 'mock' },
      { id: 'bank-transfer', label: 'Bank Transfer', mode: 'mock' },
      { id: 'e-wallet', label: 'E-Wallet', mode: 'mock' }
    ]
  }
}

function statsPayload(content) {
  const revenue = content.orders.reduce((sum, order) => sum + Number(order.totals?.total || 0), 0)
  return {
    products: content.products.length,
    collections: content.collections.length,
    campaigns: content.campaigns.length,
    editorials: content.editorials.length,
    boutiques: content.boutiques.length,
    media: content.media.length,
    orders: content.orders.length,
    subscribers: content.subscribers.length,
    revenue,
    categories: categoryPayload(content).map(({ label, slug, count }) => ({ label, slug, count }))
  }
}

function adminDashboardPayload(content) {
  return {
    stats: statsPayload(content),
    recentOrders: content.orders.slice(0, 8).map(publicOrder),
    lowTouchCatalog: {
      featuredProducts: featuredBySlug(content.products, content.homepage.featuredProductSlugs, 6).map(productPreview),
      latestEditorials: sortEditorials(content.editorials).slice(0, 4).map(editorialPreview),
      campaigns: content.campaigns.slice(0, 4).map((campaign) => campaignPreview(campaign, content))
    }
  }
}

function homepagePayload(content) {
  return {
    ...content.homepage,
    featuredCollection: findBySlug(content.collections, content.homepage.featuredCollectionSlug) || null,
    featuredProducts: content.homepage.featuredProductSlugs.map((slug) => findBySlug(content.products, slug)).filter(Boolean).map(productPreview),
    featuredEditorials: content.homepage.featuredEditorialSlugs.map((slug) => findBySlug(content.editorials, slug)).filter(Boolean).map(editorialPreview)
  }
}

function navigationPayload(content) {
  return {
    brand: content.site.brand,
    links: [
      { label: 'Collections', href: '/collections' },
      { label: 'Shop', href: '/shop' },
      { label: 'Editorial', href: '/editorial' },
      { label: 'Maison', href: '/maison' },
      { label: 'Cart', href: '/cart' }
    ]
  }
}

function productListPayload(content, query) {
  const category = normalizeSearch(query.category)
  const collection = normalizeSearch(query.collection)
  const line = normalizeSearch(query.line)
  const status = normalizeSearch(query.status)
  const q = normalizeSearch(query.q || query.search)
  const min = Number(query.min || query.minPrice || 0)
  const max = Number(query.max || query.maxPrice || Number.MAX_SAFE_INTEGER)
  const sort = String(query.sort || 'newest')
  const filtered = content.products
    .filter((product) => !category || normalizeSearch(product.category) === category)
    .filter((product) => !collection || normalizeSearch(product.collectionSlug) === collection)
    .filter((product) => !line || normalizeSearch(product.line) === line)
    .filter((product) => !status || normalizeSearch(product.status) === status)
    .filter((product) => !q || searchText(product).includes(q))
    .filter((product) => Number(product.priceValue || 0) >= min && Number(product.priceValue || 0) <= max)
    .sort((a, b) => sortProducts(a, b, sort))

  const { items, meta } = paginate(filtered, query)
  return {
    items: items.map(productPreview),
    meta,
    filters: {
      categories: content.categories,
      collections: content.collections.map(collectionPreview)
    }
  }
}

function quoteItems(products, items) {
  const quoted = items.map((entry) => {
    const product = findBySlug(products, entry.slug)
    if (!product) return null
    const quantity = Number(entry.quantity || 1)
    const unitPrice = Number(product.priceValue || 0)
    return {
      slug: product.slug,
      title: product.title,
      unitPrice,
      price: product.price,
      quantity,
      image: product.images?.[0] || product.image,
      lineTotal: unitPrice * quantity
    }
  }).filter(Boolean)

  const subtotal = quoted.reduce((sum, item) => sum + item.lineTotal, 0)
  const shipping = subtotal > 0 ? 35 : 0
  return {
    items: quoted,
    totals: {
      currency: 'EUR',
      subtotal,
      shipping,
      total: subtotal + shipping
    }
  }
}

function productPreview(product) {
  return {
    id: product.id || product.slug,
    slug: product.slug,
    title: product.title,
    category: product.category,
    collectionSlug: product.collectionSlug,
    line: product.line,
    price: product.price,
    priceValue: product.priceValue,
    currency: product.currency || 'EUR',
    status: product.status,
    image: product.images?.[0] || product.image || '',
    images: product.images || [],
    alt: product.alt
  }
}

function collectionPreview(collection) {
  return {
    id: collection.id || collection.slug,
    slug: collection.slug,
    title: collection.title,
    season: collection.season,
    intro: collection.intro,
    description: collection.description || collection.intro,
    coverImage: collection.coverImage,
    coverAlt: collection.coverAlt,
    productSlugs: collection.productSlugs
  }
}

function editorialPreview(article) {
  return {
    id: article.id || article.slug,
    slug: article.slug,
    type: article.type,
    title: article.title,
    summary: article.summary,
    image: article.image,
    alt: article.alt,
    publishedAt: article.publishedAt
  }
}

function toPublicContent(content) {
  return {
    site: content.site,
    homepage: homepagePayload(content),
    template: templateProfile,
    quickStrip: content.quickStrip,
    campaigns: content.campaigns,
    categories: content.categories,
    collections: content.collections,
    products: content.products,
    code: content.code,
    timeline: content.timeline,
    metrics: content.metrics,
    editorials: content.editorials,
    journal: content.editorials,
    boutiques: content.boutiques,
    appointment: content.appointment,
    newsletter: content.newsletter,
    media: content.media
  }
}

function featuredBySlug(items = [], slugs = [], limit = 4) {
  const picked = Array.isArray(slugs)
    ? slugs.map((slug) => findBySlug(items, slug)).filter(Boolean)
    : []
  const rest = items.filter((item) => !picked.some((pickedItem) => pickedItem.slug === item.slug))
  return [...picked, ...rest].slice(0, limit)
}

function paginate(items, query) {
  const page = clamp(Number(query.page || 1), 1, 999)
  const limit = clamp(Number(query.limit || 24), 1, 60)
  const start = (page - 1) * limit
  return {
    items: items.slice(start, start + limit),
    meta: {
      page,
      limit,
      total: items.length,
      pages: Math.max(1, Math.ceil(items.length / limit))
    }
  }
}

function unique(values) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))]
}

function uniqueBySlug(items) {
  const seen = new Set()
  return items.filter((item) => {
    const slug = item.slug || item.id
    if (!slug || seen.has(slug)) return false
    seen.add(slug)
    return true
  })
}

function sortProducts(a, b, sort) {
  if (sort === 'title') return a.title.localeCompare(b.title)
  if (sort === 'price-low') return Number(a.priceValue || 0) - Number(b.priceValue || 0) || a.title.localeCompare(b.title)
  if (sort === 'price-high') return Number(b.priceValue || 0) - Number(a.priceValue || 0) || a.title.localeCompare(b.title)
  return String(b.createdAt || '').localeCompare(String(a.createdAt || '')) || a.title.localeCompare(b.title)
}

function sortEditorials(items) {
  return [...items].sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')) || a.title.localeCompare(b.title))
}

function findBySlug(items, slug) {
  return items.find((item) => item.slug === slug || item.id === slug)
}

function findById(items, id) {
  return items.find((item) => item.id === id || item.slug === id || item.invoiceId === id)
}

function searchText(item) {
  return Object.values(item)
    .filter((value) => typeof value === 'string' || typeof value === 'number')
    .join(' ')
    .toLowerCase()
}

function normalizeSearch(value = '') {
  return String(value).trim().toLowerCase()
}

function normalizeId(value = '') {
  return String(value).trim().toUpperCase()
}

function readableInvoiceId() {
  const date = new Date()
  const stamp = `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`
  return `RAVA-${stamp}-${newId('order').split('-').pop().toUpperCase()}`
}

function publicOrder(order) {
  return {
    invoiceId: order.invoiceId || order.id,
    email: order.email || order.customer?.email,
    items: order.items,
    totals: order.totals,
    paymentMethod: order.paymentMethod,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  }
}

function isAdminRequest(c) {
  const header = c.req.header('authorization') || ''
  return Boolean(adminToken && header === `Bearer ${adminToken}`)
}

function rateLimit(c, bucket, maxPerMinute) {
  const key = `${bucket}:${c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'local'}`
  const now = Date.now()
  const current = writeBuckets.get(key) || { resetAt: now + 60_000, count: 0 }
  if (now > current.resetAt) {
    current.resetAt = now + 60_000
    current.count = 0
  }
  current.count += 1
  writeBuckets.set(key, current)
  return current.count <= maxPerMinute
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.floor(value)))
}

function ok(c, data, cacheControl = 'no-store', status = 200) {
  c.status(status)
  c.header('Cache-Control', cacheControl)
  return c.json({ ok: true, data })
}

function errorJson(c, code, message, status = 400) {
  c.status(status)
  c.header('Cache-Control', 'no-store')
  return c.json({
    ok: false,
    error: { code, message }
  })
}
