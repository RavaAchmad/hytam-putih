import { existsSync } from 'node:fs'
import { copyFile, mkdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, resolve } from 'node:path'
import { customAlphabet } from 'nanoid'
import { validateContent } from './content-schema.js'
import {
  defaultContent,
  seedCollections,
  seedEditorials,
  seedHomepage,
  seedOrders,
  seedProducts,
  seedSite,
  seedSubscribers
} from './seed-data.js'

const shortId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8)
const defaultDataDir = existsSync('/home/container') ? '/home/container/data' : './data'

export const dataDir = resolve(process.env.DATA_DIR || defaultDataDir)
export const uploadDir = join(dataDir, 'uploads')

export const storeFiles = {
  site: join(dataDir, 'site.json'),
  products: join(dataDir, 'products.json'),
  collections: join(dataDir, 'collections.json'),
  editorials: join(dataDir, 'editorials.json'),
  orders: join(dataDir, 'orders.json'),
  subscribers: join(dataDir, 'subscribers.json'),
  homepage: join(dataDir, 'homepage.json')
}

export const contentPath = join(dataDir, 'content.json')

const imageTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif']
])

const seeds = {
  site: seedSite,
  products: seedProducts,
  collections: seedCollections,
  editorials: seedEditorials,
  orders: seedOrders,
  subscribers: seedSubscribers,
  homepage: seedHomepage
}

export { defaultContent }

export async function ensureStore() {
  await mkdir(uploadDir, { recursive: true })
  await Promise.all(Object.entries(storeFiles).map(async ([key, file]) => {
    if (!existsSync(file)) {
      await atomicWriteJson(file, seeds[key])
    }
  }))
}

export async function readContent() {
  await ensureStore()
  const [site, products, collections, editorials, orders, subscribers, homepage] = await Promise.all([
    readStoreFile('site'),
    readStoreFile('products'),
    readStoreFile('collections'),
    readStoreFile('editorials'),
    readStoreFile('orders'),
    readStoreFile('subscribers'),
    readStoreFile('homepage')
  ])

  return validateContent(normalizeContent({
    site,
    homepage,
    products,
    collections,
    journal: editorials,
    editorials,
    orders,
    subscribers
  }))
}

export async function writeContent(content) {
  await ensureStore()
  const normalized = validateContent(normalizeContent(content))
  const site = {
    ...normalized.site,
    categories: normalized.categories,
    quickStrip: normalized.quickStrip,
    code: normalized.code,
    timeline: normalized.timeline,
    metrics: normalized.metrics,
    boutiques: normalized.boutiques,
    appointment: normalized.appointment,
    newsletter: normalized.newsletter,
    media: normalized.media
  }
  const homepage = {
    ...normalized.homepage,
    campaigns: normalized.campaigns
  }

  await Promise.all([
    atomicWriteJson(storeFiles.site, site),
    atomicWriteJson(storeFiles.products, normalized.products),
    atomicWriteJson(storeFiles.collections, normalized.collections),
    atomicWriteJson(storeFiles.editorials, normalized.editorials || normalized.journal),
    atomicWriteJson(storeFiles.orders, normalized.orders || []),
    atomicWriteJson(storeFiles.subscribers, normalized.subscribers || []),
    atomicWriteJson(storeFiles.homepage, homepage)
  ])

  return normalized
}

export async function readStoreFile(key) {
  await ensureStore()
  return readJsonSafe(storeFiles[key], seeds[key])
}

export async function writeStoreFile(key, value) {
  if (!storeFiles[key]) throw new Error(`Unknown store file: ${key}`)
  await ensureStore()
  await atomicWriteJson(storeFiles[key], value)
  return value
}

export async function saveUploadedImage(file, alt = '') {
  await ensureStore()
  if (!file || typeof file.arrayBuffer !== 'function') {
    throw new Error('File gambar tidak ditemukan.')
  }

  const type = file.type || 'application/octet-stream'
  const ext = imageTypes.get(type)
  if (!ext) {
    throw new Error('Format gambar harus JPG, PNG, WebP, atau GIF.')
  }

  const maxBytes = Number(process.env.MAX_UPLOAD_BYTES || 3_000_000)
  if (file.size > maxBytes) {
    throw new Error(`Ukuran gambar melebihi ${Math.round(maxBytes / 1_000_000)}MB.`)
  }

  const sourceName = typeof file.name === 'string' ? file.name : 'image'
  const id = `${slugify(sourceName.replace(/\.[^.]+$/, ''))}-${Date.now()}`
  const filename = `${id}${ext}`
  const diskPath = join(uploadDir, filename)
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(diskPath, buffer)

  return {
    id,
    src: `/uploads/${filename}`,
    alt: String(alt || sourceName).slice(0, 180),
    type,
    size: buffer.length,
    uploadedAt: new Date().toISOString(),
    builtin: false
  }
}

export async function readUploadedImage(filename) {
  await ensureStore()
  const safeName = basename(filename)
  const diskPath = join(uploadDir, safeName)
  const info = await stat(diskPath)
  return {
    buffer: await readFile(diskPath),
    size: info.size,
    type: contentTypeFromName(safeName)
  }
}

export async function deleteUploadedImage(mediaItem) {
  if (!mediaItem || mediaItem.builtin || !mediaItem.src?.startsWith('/uploads/')) {
    return false
  }

  const safeName = basename(mediaItem.src)
  await unlink(join(uploadDir, safeName)).catch(() => {})
  return true
}

export function slugify(value) {
  const slug = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)

  return slug || shortId()
}

export function newId(prefix) {
  return `${slugify(prefix)}-${shortId()}`
}

async function readJsonSafe(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT') {
      await atomicWriteJson(file, fallback)
      return structuredClone(fallback)
    }

    const raw = await readFile(file, 'utf8').catch(() => '')
    if (raw) {
      await writeFile(`${file}.corrupt-${Date.now()}`, raw, 'utf8').catch(() => {})
    }
    await atomicWriteJson(file, fallback)
    return structuredClone(fallback)
  }
}

async function atomicWriteJson(file, value) {
  await mkdir(dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`
  const body = `${JSON.stringify(value, null, 2)}\n`
  if (existsSync(file)) {
    await copyFile(file, `${file}.bak`).catch(() => {})
  }
  await writeFile(tmp, body, 'utf8')
  await rename(tmp, file)
}

function normalizeContent(content = {}) {
  const siteInput = content.site || {}
  const homepageInput = content.homepage || {}
  const site = {
    ...seedSite,
    ...siteInput
  }
  const homepage = {
    ...seedHomepage,
    ...homepageInput,
    campaigns: arrayOr(homepageInput.campaigns || content.campaigns, seedHomepage.campaigns).map(normalizeCampaign)
  }

  const merged = {
    ...defaultContent,
    ...content,
    site,
    homepage,
    quickStrip: arrayOr(content.quickStrip || site.quickStrip, seedSite.quickStrip),
    campaigns: homepage.campaigns,
    categories: arrayOr(content.categories || site.categories, seedSite.categories),
    collections: arrayOr(content.collections, seedCollections).map(normalizeCollection),
    products: arrayOr(content.products, seedProducts).map(normalizeProduct),
    code: { ...seedSite.code, ...(content.code || site.code || {}) },
    timeline: arrayOr(content.timeline || site.timeline, seedSite.timeline),
    metrics: arrayOr(content.metrics || site.metrics, seedSite.metrics),
    journal: arrayOr(content.journal || content.editorials, seedEditorials).map(normalizeJournal),
    boutiques: arrayOr(content.boutiques || site.boutiques, seedSite.boutiques).map(normalizeBoutique),
    appointment: { ...seedSite.appointment, ...(content.appointment || site.appointment || {}) },
    newsletter: { ...seedSite.newsletter, ...(content.newsletter || site.newsletter || {}) },
    media: arrayOr(content.media || site.media, seedSite.media),
    orders: arrayOr(content.orders, []),
    subscribers: arrayOr(content.subscribers, [])
  }

  merged.editorials = merged.journal
  return merged
}

function normalizeCampaign(item = {}) {
  const slug = item.slug || item.id || slugify(item.title)
  return {
    slug,
    id: slug,
    number: String(item.number || ''),
    title: String(item.title || ''),
    text: String(item.text || ''),
    image: item.image || '/assets/hero-atelier.jpg',
    alt: String(item.alt || item.title || 'Campaign image')
  }
}

function normalizeCollection(item = {}) {
  const slug = item.slug || item.id || slugify(item.title)
  return {
    slug,
    id: slug,
    title: String(item.title || ''),
    season: String(item.season || ''),
    intro: String(item.intro || item.description || ''),
    description: String(item.description || item.intro || ''),
    coverImage: item.coverImage || item.image || '/assets/hero-atelier.jpg',
    coverAlt: String(item.coverAlt || item.alt || item.title || 'Collection image'),
    productSlugs: stringList(item.productSlugs),
    sections: arrayOr(item.sections, []).map((section) => ({
      title: String(section.title || ''),
      text: String(section.text || ''),
      image: section.image || item.coverImage || '/assets/hero-atelier.jpg',
      alt: String(section.alt || section.title || 'Collection section image')
    }))
  }
}

function normalizeProduct(item = {}) {
  const slug = item.slug || item.id || slugify(item.title)
  const images = stringList(item.images || item.image).filter(Boolean)
  const priceValue = Number(item.priceValue || parsePrice(item.price))
  const price = item.price || (Number.isFinite(priceValue) && priceValue > 0 ? `EUR ${priceValue.toLocaleString('en-US')}` : '')
  return {
    slug,
    id: slug,
    title: String(item.title || ''),
    category: String(item.category || ''),
    collectionSlug: String(item.collectionSlug || ''),
    line: String(item.line || ''),
    description: String(item.description || ''),
    price,
    priceValue: Number.isFinite(priceValue) ? priceValue : 0,
    currency: item.currency || 'EUR',
    status: String(item.status || ''),
    images: images.length ? images : ['/assets/hero-atelier.jpg'],
    image: images[0] || item.image || '/assets/hero-atelier.jpg',
    alt: String(item.alt || item.title || 'Product image'),
    sizes: stringList(item.sizes).length ? stringList(item.sizes) : ['XS', 'S', 'M', 'L'],
    specs: arrayOr(item.specs, []).map((spec) => ({
      label: String(spec.label || ''),
      value: String(spec.value || '')
    })).filter((spec) => spec.label || spec.value),
    relatedSlugs: stringList(item.relatedSlugs),
    createdAt: item.createdAt || new Date().toISOString()
  }
}

function normalizeJournal(item = {}) {
  const slug = item.slug || item.id || slugify(item.title)
  return {
    slug,
    id: slug,
    type: String(item.type || ''),
    title: String(item.title || ''),
    summary: String(item.summary || ''),
    body: String(item.body || item.summary || ''),
    image: item.image || '/assets/hero-atelier.jpg',
    alt: String(item.alt || item.title || 'Editorial image'),
    publishedAt: item.publishedAt || new Date().toISOString()
  }
}

function normalizeBoutique(item = {}) {
  const slug = item.slug || item.id || slugify(item.city || item.title)
  return {
    slug,
    id: slug,
    city: String(item.city || ''),
    title: String(item.title || ''),
    address: String(item.address || ''),
    hours: String(item.hours || ''),
    email: String(item.email || ''),
    image: item.image || '/assets/hero-atelier.jpg',
    alt: String(item.alt || item.title || 'Boutique image')
  }
}

function parsePrice(value = '') {
  return Number(String(value).replace(/[^0-9.]/g, ''))
}

function arrayOr(value, fallback) {
  return Array.isArray(value) ? value : structuredClone(fallback)
}

function stringList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function contentTypeFromName(filename) {
  const ext = extname(filename).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.gif') return 'image/gif'
  return 'application/octet-stream'
}
