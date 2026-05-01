import { existsSync } from 'node:fs'
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises'
import { basename, extname, join, resolve } from 'node:path'
import { customAlphabet } from 'nanoid'
import { validateContent } from './content-schema.js'

const shortId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8)

export const dataDir = resolve(process.env.DATA_DIR || './data')
export const uploadDir = join(dataDir, 'uploads')
export const contentPath = join(dataDir, 'content.json')

const imageTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif']
])

export const defaultContent = {
  site: {
    brand: 'VAEL Atelier',
    mark: 'V',
    description: 'Maison digital hitam-putih untuk ready-to-wear sculptural, object jewelry, leather goods, journal, dan private fitting.',
    theme: 'Monochrome luxury editorial',
    heroEyebrow: 'Private edit 2026',
    heroTitle: 'VAEL Atelier',
    heroText: 'A monochrome maison for sculptural garments, object jewelry, precise leather goods, and fittings by appointment.',
    heroImage: '/assets/hero-atelier.jpg',
    heroAlt: 'Editorial still life busana hitam, aksesori, dan tas couture di dalam ruang atelier.',
    primaryCta: 'Shop the edit',
    secondaryCta: 'View collections',
    whatsapp: process.env.CONTACT_WHATSAPP || ''
  },
  quickStrip: ['Ready-to-wear', 'Object jewelry', 'Private showroom', 'Image studio'],
  campaigns: [
    {
      slug: 'the-sculpted-line',
      number: '01',
      title: 'The Sculpted Line',
      text: 'Tailoring with a defined shoulder, narrow waist, and controlled volume.',
      image: '/assets/look-coat.jpg',
      alt: 'Mantel hitam dengan siluet bahu tegas.'
    },
    {
      slug: 'the-object-salon',
      number: '02',
      title: 'The Object Salon',
      text: 'Jewelry and hardware treated as small wearable sculptures.',
      image: '/assets/orbit-earcuff.jpg',
      alt: 'Aksesori telinga berbentuk orbit.'
    },
    {
      slug: 'the-private-room',
      number: '03',
      title: 'The Private Room',
      text: 'Appointment-only fitting notes, made-to-order sizing, and client care.',
      image: '/assets/bag-keyline.jpg',
      alt: 'Tas kulit dengan gagang geometris.'
    }
  ],
  categories: ['All', 'Evening', 'Jackets', 'Bags', 'Jewelry', 'Shoes'],
  collections: [
    {
      slug: 'private-edit-2026',
      title: 'Private Edit 2026',
      season: 'Spring private edit',
      intro: 'A spare black-and-white wardrobe built around one repeated aperture code.',
      coverImage: '/assets/hero-atelier.jpg',
      coverAlt: 'Campaign still life hitam putih VAEL Atelier.',
      productSlugs: ['noir-sculpted-coat', 'keyline-bag', 'orbit-ear-cuff', 'column-heel'],
      sections: [
        {
          title: 'A silhouette first',
          text: 'The line starts with shoulder, waist, and negative space before it becomes product.',
          image: '/assets/look-coat.jpg',
          alt: 'Mantel sculptural sebagai pembuka koleksi.'
        },
        {
          title: 'Objects worn close',
          text: 'Bags, cuffs, and heels carry the same oval gesture across the body.',
          image: '/assets/orbit-earcuff.jpg',
          alt: 'Detail object jewelry koleksi.'
        }
      ]
    },
    {
      slug: 'aperture-objects',
      title: 'Aperture Objects',
      season: 'Object jewelry and leather goods',
      intro: 'Small objects with strong silhouettes: bags, cuffs, and hardware-led accessories.',
      coverImage: '/assets/bag-keyline.jpg',
      coverAlt: 'Tas monochrome dengan gagang geometris.',
      productSlugs: ['keyline-bag', 'orbit-ear-cuff'],
      sections: [
        {
          title: 'Hardware as punctuation',
          text: 'Every clasp and opening is treated as a visible mark, not a hidden mechanism.',
          image: '/assets/bag-keyline.jpg',
          alt: 'Leather goods dengan hardware tegas.'
        }
      ]
    }
  ],
  products: [
    {
      slug: 'noir-sculpted-coat',
      title: 'Noir Sculpted Coat',
      category: 'Jackets',
      collectionSlug: 'private-edit-2026',
      line: 'Ready-to-wear',
      description: 'Wool silk coat with structured waist, sharp shoulder, satin lining, and a quiet architectural profile.',
      price: 'EUR 2,850',
      status: 'Available by appointment',
      images: ['/assets/look-coat.jpg', '/assets/hero-atelier.jpg'],
      alt: 'Mantel hitam dengan siluet bahu tegas.',
      specs: [
        { label: 'Material', value: 'Wool silk blend' },
        { label: 'Fit', value: 'Structured waist' },
        { label: 'Service', value: 'Private fitting available' }
      ],
      relatedSlugs: ['keyline-bag', 'column-heel']
    },
    {
      slug: 'keyline-bag',
      title: 'Keyline Bag',
      category: 'Bags',
      collectionSlug: 'aperture-objects',
      line: 'Leather goods',
      description: 'Calf leather bag with monochrome body, architectural handle, and aperture-inspired hardware.',
      price: 'EUR 1,420',
      status: 'Online preview',
      images: ['/assets/bag-keyline.jpg', '/assets/hero-atelier.jpg'],
      alt: 'Tas tangan dengan gagang geometris.',
      specs: [
        { label: 'Material', value: 'Calf leather' },
        { label: 'Hardware', value: 'Polished monochrome handle' },
        { label: 'Carry', value: 'Top handle' }
      ],
      relatedSlugs: ['orbit-ear-cuff', 'noir-sculpted-coat']
    },
    {
      slug: 'orbit-ear-cuff',
      title: 'Orbit Ear Cuff',
      category: 'Jewelry',
      collectionSlug: 'aperture-objects',
      line: 'Object jewelry',
      description: 'Polished sculptural cuff built around oval negative space and a clean monochrome finish.',
      price: 'EUR 390',
      status: 'Limited stock',
      images: ['/assets/orbit-earcuff.jpg'],
      alt: 'Ear cuff berbentuk orbit.',
      specs: [
        { label: 'Finish', value: 'Polished metal' },
        { label: 'Motif', value: 'Aperture oval' },
        { label: 'Wear', value: 'Single ear cuff' }
      ],
      relatedSlugs: ['keyline-bag', 'column-heel']
    },
    {
      slug: 'column-heel',
      title: 'Column Heel',
      category: 'Shoes',
      collectionSlug: 'private-edit-2026',
      line: 'Shoes',
      description: 'Satin upper, column heel, sculpted profile, and a restrained evening silhouette.',
      price: 'EUR 780',
      status: 'Made to order',
      images: ['/assets/column-heel.jpg'],
      alt: 'Sepatu hak hitam dengan detail kolom.',
      specs: [
        { label: 'Upper', value: 'Satin' },
        { label: 'Heel', value: 'Column profile' },
        { label: 'Order', value: 'Made to order' }
      ],
      relatedSlugs: ['noir-sculpted-coat', 'orbit-ear-cuff']
    }
  ],
  code: {
    eyebrow: 'Iconic code',
    title: 'The Aperture',
    text: 'The Aperture is VAEL\'s recurring house mark: an open oval cut through closures, buttons, bag handles, jewelry, and embroidery.',
    image: '/assets/orbit-earcuff.jpg',
    alt: 'Detail oval sebagai kode visual VAEL Atelier.'
  },
  timeline: [
    { id: 'first-fitting-room', year: '2019', title: 'First fitting room', text: 'The house begins with private alterations, pattern notes, and a narrow catalog of structured black garments.' },
    { id: 'object-jewelry', year: '2021', title: 'Object jewelry', text: 'Hardware becomes the signature: oval cuffs, column heels, and small sculptural details.' },
    { id: 'digital-salon', year: '2024', title: 'Digital salon', text: 'The showroom moves online with appointment-first service, measured product copy, and a fast storefront.' },
    { id: 'private-edit', year: '2026', title: 'Private edit', text: 'A tighter seasonal story connects ready-to-wear, leather goods, jewelry, and shoes under one code.' }
  ],
  metrics: [
    { value: '0', label: 'Third-party render request' },
    { value: '< 70KB', label: 'Client CSS and scripts kept lean' },
    { value: '1', label: 'Node process for Pterodactyl' }
  ],
  journal: [
    {
      slug: 'runway-note',
      type: 'Runway note',
      title: 'Sharp shoulders, soft movement, and one object of light.',
      summary: 'A study in monochrome proportion and wearable object detail.',
      body: 'The season is edited around a simple tension: strong shoulder lines, quiet negative space, and accessories that behave like small objects of architecture.',
      image: '/assets/look-coat.jpg',
      alt: 'Runway note dengan mantel bersiluet tegas.'
    },
    {
      slug: 'client-service',
      type: 'Client service',
      title: 'Private appointments now route through the same fast server.',
      summary: 'A lean editorial storefront with room for CRM integration later.',
      body: 'The first public release keeps inquiry simple. Buyers can move from product, collection, or appointment to direct email or WhatsApp without storing personal data on the server.',
      image: '/assets/bag-keyline.jpg',
      alt: 'Tas tangan sebagai simbol client service.'
    },
    {
      slug: 'craft-note',
      type: 'Craft note',
      title: 'Why one repeated code makes a collection easier to remember.',
      summary: 'The Aperture acts as a memory device across product, page, and service.',
      body: 'A repeated mark gives buyers and stylists a way to recognize the house quickly: an oval, a cutout, an opening, a closure that becomes visible.',
      image: '/assets/orbit-earcuff.jpg',
      alt: 'Kode visual berbentuk oval.'
    }
  ],
  boutiques: [
    {
      slug: 'jakarta',
      city: 'Jakarta',
      title: 'Senopati Showroom',
      address: 'Jl. Senopati 88',
      hours: 'Monday to Saturday, 11.00-19.00',
      email: 'atelier@example.com',
      image: '/assets/hero-atelier.jpg',
      alt: 'Ruang showroom privat.'
    },
    {
      slug: 'bali',
      city: 'Bali',
      title: 'Resort Trunk Salon',
      address: 'Nusa Dua private residency',
      hours: 'Friday to Sunday, appointment only',
      email: 'salon@example.com',
      image: '/assets/bag-keyline.jpg',
      alt: 'Trunk salon dengan leather goods.'
    },
    {
      slug: 'singapore',
      city: 'Singapore',
      title: 'Client Suite',
      address: 'Orchard appointment desk',
      hours: 'Monthly trunk presentation',
      email: 'clientcare@example.com',
      image: '/assets/orbit-earcuff.jpg',
      alt: 'Client suite dengan aksesori sculptural.'
    }
  ],
  appointment: {
    eyebrow: 'Appointment',
    title: 'Reserve a private fitting.',
    text: 'For sizing, made-to-order notes, bridal evening pieces, showroom pickup, or image-led styling previews.',
    email: 'atelier@example.com',
    subject: 'Private fitting request',
    label: 'Request slot'
  },
  newsletter: {
    eyebrow: 'Stay informed',
    title: 'New edits, private viewings, and salon notes.',
    text: 'A quiet mailing list for collection releases and appointment windows.',
    email: 'atelier@example.com',
    subject: 'Newsletter request',
    label: 'Subscribe'
  },
  media: [
    { id: 'hero-atelier', src: '/assets/hero-atelier.jpg', alt: 'Hero atelier image', builtin: true },
    { id: 'look-coat', src: '/assets/look-coat.jpg', alt: 'Sculpted coat image', builtin: true },
    { id: 'bag-keyline', src: '/assets/bag-keyline.jpg', alt: 'Keyline bag image', builtin: true },
    { id: 'orbit-earcuff', src: '/assets/orbit-earcuff.jpg', alt: 'Orbit ear cuff image', builtin: true },
    { id: 'column-heel', src: '/assets/column-heel.jpg', alt: 'Column heel image', builtin: true }
  ]
}

export async function ensureStore() {
  await mkdir(uploadDir, { recursive: true })
  if (!existsSync(contentPath)) {
    await writeContent(defaultContent)
  }
}

export async function readContent() {
  await ensureStore()
  const raw = await readFile(contentPath, 'utf8')
  return validateContent(normalizeContent(JSON.parse(raw)))
}

export async function writeContent(content) {
  await mkdir(dataDir, { recursive: true })
  const normalized = validateContent(normalizeContent(content))
  await writeFile(contentPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8')
  return normalized
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

function normalizeContent(content = {}) {
  const merged = {
    ...defaultContent,
    ...content,
    site: { ...defaultContent.site, ...(content.site || {}) },
    code: { ...defaultContent.code, ...(content.code || {}) },
    appointment: { ...defaultContent.appointment, ...(content.appointment || {}) },
    newsletter: { ...defaultContent.newsletter, ...(content.newsletter || {}) }
  }

  merged.quickStrip = arrayOr(content.quickStrip, defaultContent.quickStrip)
  merged.campaigns = arrayOr(content.campaigns || content.edits, defaultContent.campaigns).map(normalizeCampaign)
  merged.categories = arrayOr(content.categories, defaultContent.categories)
  merged.collections = arrayOr(content.collections, defaultContent.collections).map(normalizeCollection)
  merged.products = arrayOr(content.products, defaultContent.products).map(normalizeProduct)
  merged.timeline = arrayOr(content.timeline, defaultContent.timeline)
  merged.metrics = arrayOr(content.metrics, defaultContent.metrics)
  merged.journal = arrayOr(content.journal, defaultContent.journal).map(normalizeJournal)
  merged.boutiques = arrayOr(content.boutiques, defaultContent.boutiques).map(normalizeBoutique)
  merged.media = arrayOr(content.media, defaultContent.media)

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
    intro: String(item.intro || ''),
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
  return {
    slug,
    id: slug,
    title: String(item.title || ''),
    category: String(item.category || ''),
    collectionSlug: String(item.collectionSlug || ''),
    line: String(item.line || ''),
    description: String(item.description || ''),
    price: String(item.price || ''),
    status: String(item.status || ''),
    images: images.length ? images : ['/assets/hero-atelier.jpg'],
    image: images[0] || item.image || '/assets/hero-atelier.jpg',
    alt: String(item.alt || item.title || 'Product image'),
    specs: arrayOr(item.specs, []).map((spec) => ({
      label: String(spec.label || ''),
      value: String(spec.value || '')
    })).filter((spec) => spec.label || spec.value),
    relatedSlugs: stringList(item.relatedSlugs)
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
    alt: String(item.alt || item.title || 'Journal image')
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

function arrayOr(value, fallback) {
  return Array.isArray(value) ? value : fallback
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
