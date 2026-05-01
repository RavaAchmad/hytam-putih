import { z } from 'zod'

const mediaSchema = z.object({
  id: z.string(),
  src: z.string(),
  alt: z.string().default(''),
  builtin: z.boolean().optional(),
  type: z.string().optional(),
  size: z.number().optional(),
  uploadedAt: z.string().optional()
}).passthrough()

const imageSectionSchema = z.object({
  title: z.string().default(''),
  text: z.string().default(''),
  image: z.string().default('/assets/hero-atelier.jpg'),
  alt: z.string().default('')
}).passthrough()

const productSpecSchema = z.object({
  label: z.string().default(''),
  value: z.string().default('')
}).passthrough()

export const contentSchema = z.object({
  site: z.object({
    brand: z.string(),
    mark: z.string(),
    description: z.string(),
    theme: z.string().optional(),
    heroEyebrow: z.string(),
    heroTitle: z.string(),
    heroText: z.string(),
    heroImage: z.string(),
    heroAlt: z.string(),
    primaryCta: z.string(),
    secondaryCta: z.string(),
    whatsapp: z.string().optional()
  }).passthrough(),
  quickStrip: z.array(z.string()),
  campaigns: z.array(z.object({
    slug: z.string(),
    number: z.string(),
    title: z.string(),
    text: z.string(),
    image: z.string(),
    alt: z.string()
  }).passthrough()),
  categories: z.array(z.string()),
  collections: z.array(z.object({
    slug: z.string(),
    title: z.string(),
    season: z.string(),
    intro: z.string(),
    coverImage: z.string(),
    coverAlt: z.string(),
    productSlugs: z.array(z.string()),
    sections: z.array(imageSectionSchema)
  }).passthrough()),
  products: z.array(z.object({
    slug: z.string(),
    title: z.string(),
    category: z.string(),
    collectionSlug: z.string(),
    line: z.string(),
    description: z.string(),
    price: z.string(),
    status: z.string(),
    images: z.array(z.string()),
    alt: z.string(),
    specs: z.array(productSpecSchema),
    relatedSlugs: z.array(z.string())
  }).passthrough()),
  code: imageSectionSchema.extend({
    eyebrow: z.string()
  }).passthrough(),
  timeline: z.array(z.object({
    year: z.string(),
    title: z.string(),
    text: z.string()
  }).passthrough()),
  metrics: z.array(z.object({
    value: z.string(),
    label: z.string()
  }).passthrough()),
  journal: z.array(z.object({
    slug: z.string(),
    type: z.string(),
    title: z.string(),
    summary: z.string(),
    body: z.string(),
    image: z.string(),
    alt: z.string()
  }).passthrough()),
  boutiques: z.array(z.object({
    slug: z.string(),
    city: z.string(),
    title: z.string(),
    address: z.string(),
    hours: z.string(),
    email: z.string(),
    image: z.string(),
    alt: z.string()
  }).passthrough()),
  appointment: z.object({
    eyebrow: z.string(),
    title: z.string(),
    text: z.string(),
    email: z.string(),
    subject: z.string(),
    label: z.string()
  }).passthrough(),
  newsletter: z.object({
    eyebrow: z.string(),
    title: z.string(),
    text: z.string(),
    email: z.string(),
    subject: z.string(),
    label: z.string()
  }).passthrough(),
  media: z.array(mediaSchema)
}).passthrough()

export function validateContent(content) {
  const result = contentSchema.safeParse(content)
  if (!result.success) {
    const message = result.error.issues
      .slice(0, 6)
      .map((issue) => `${issue.path.join('.') || 'content'}: ${issue.message}`)
      .join('; ')
    throw new Error(`Content schema invalid. ${message}`)
  }
  return result.data
}
