const asset = (name) => `/assets/${name}`

export const seedSite = {
  brand: 'MAISON RAVA',
  mark: 'MR',
  description: 'A fictional luxury maison for surreal tailoring, object jewelry, cinematic editorials, and appointment-led commerce.',
  theme: 'Black, ivory, muted gold, warm gray, surreal couture minimalism',
  heroEyebrow: 'Private collection 2026',
  heroTitle: 'MAISON RAVA',
  heroText: 'Surreal silhouettes, sculptural objects, and quiet commerce for collectors of the impossible uniform.',
  heroImage: asset('hero-atelier.jpg'),
  heroAlt: 'Cinematic monochrome atelier still life with sculptural garments and accessories.',
  primaryCta: 'Enter the shop',
  secondaryCta: 'View collections',
  whatsapp: process.env.CONTACT_WHATSAPP || '',
  categories: ['All', 'Tailoring', 'Dresses', 'Bags', 'Jewelry', 'Shoes', 'Objects'],
  quickStrip: ['Surreal tailoring', 'Object jewelry', 'Private fittings', 'Invoice checkout'],
  code: {
    eyebrow: 'House code',
    title: 'The Gilded Aperture',
    text: 'A recurring oval opening appears in buttons, cuffs, handles, heels, and editorial frames. It is a signature without shouting.',
    image: asset('orbit-earcuff.jpg'),
    alt: 'Object jewelry with an aperture-like silhouette.'
  },
  timeline: [
    { id: 'private-notes', year: '2019', title: 'Private notes', text: 'The maison begins with black tailoring studies and surreal object sketches for private clients.' },
    { id: 'object-salon', year: '2021', title: 'Object salon', text: 'Jewelry and hardware become wearable punctuation for every collection.' },
    { id: 'editorial-house', year: '2024', title: 'Editorial house', text: 'The digital salon opens with campaign-led commerce and appointment-first service.' },
    { id: 'rava-system', year: '2026', title: 'RAVA system', text: 'Collections, products, orders, editorials, and settings are managed from a lightweight JSON CMS.' }
  ],
  metrics: [
    { value: '12', label: 'Seeded product silhouettes' },
    { value: '4', label: 'Collection chapters' },
    { value: '0', label: 'External services required to start' }
  ],
  boutiques: [
    {
      slug: 'jakarta-private-room',
      city: 'Jakarta',
      title: 'Private Room Senopati',
      address: 'Jl. Senopati 88',
      hours: 'Monday to Saturday, 11.00-19.00',
      email: 'atelier@maisonrava.test',
      image: asset('hero-atelier.jpg'),
      alt: 'Private fitting room with monochrome objects.'
    },
    {
      slug: 'bali-trunk-salon',
      city: 'Bali',
      title: 'Trunk Salon Nusa Dua',
      address: 'Private residency appointment desk',
      hours: 'Friday to Sunday, appointment only',
      email: 'salon@maisonrava.test',
      image: asset('bag-keyline.jpg'),
      alt: 'Leather goods arranged in a resort trunk salon.'
    },
    {
      slug: 'singapore-client-suite',
      city: 'Singapore',
      title: 'Client Suite Orchard',
      address: 'Orchard appointment desk',
      hours: 'Monthly presentation',
      email: 'clientcare@maisonrava.test',
      image: asset('orbit-earcuff.jpg'),
      alt: 'Client suite detail with sculptural jewelry.'
    }
  ],
  appointment: {
    eyebrow: 'Appointment',
    title: 'Reserve a private fitting.',
    text: 'For sizing, made-to-order notes, showroom pickup, or image-led styling previews.',
    email: 'atelier@maisonrava.test',
    subject: 'Private fitting request',
    label: 'Request slot'
  },
  newsletter: {
    eyebrow: 'Correspondence',
    title: 'Collection notes, quietly delivered.',
    text: 'A low-frequency mailing list for releases, private viewings, and salon appointments.',
    email: 'letters@maisonrava.test',
    subject: 'Newsletter request',
    label: 'Subscribe'
  },
  media: [
    { id: 'hero-atelier', src: asset('hero-atelier.jpg'), alt: 'Hero atelier image', builtin: true },
    { id: 'look-coat', src: asset('look-coat.jpg'), alt: 'Sculpted coat image', builtin: true },
    { id: 'bag-keyline', src: asset('bag-keyline.jpg'), alt: 'Keyline bag image', builtin: true },
    { id: 'orbit-earcuff', src: asset('orbit-earcuff.jpg'), alt: 'Orbit ear cuff image', builtin: true },
    { id: 'column-heel', src: asset('column-heel.jpg'), alt: 'Column heel image', builtin: true }
  ]
}

export const seedHomepage = {
  featuredCampaign: 'nocturne-atelier',
  featuredCollectionSlug: 'nocturne-objects-2026',
  featuredProductSlugs: ['nocturne-sculpted-coat', 'aperture-evening-dress', 'keyline-top-handle', 'orbit-ear-cuff'],
  featuredEditorialSlugs: ['the-aperture-code', 'inside-the-private-room', 'notes-on-black-ivory-and-light'],
  campaigns: [
    {
      slug: 'nocturne-atelier',
      number: '01',
      title: 'Nocturne Atelier',
      text: 'Tailoring photographed like a room after midnight: sharp, quiet, and almost ceremonial.',
      image: asset('look-coat.jpg'),
      alt: 'A sculptural black coat in a cinematic atelier frame.'
    },
    {
      slug: 'object-salon',
      number: '02',
      title: 'Object Salon',
      text: 'Jewelry, heels, and handles treated as miniature architecture.',
      image: asset('orbit-earcuff.jpg'),
      alt: 'Sculptural object jewelry in monochrome light.'
    },
    {
      slug: 'ivory-corridor',
      number: '03',
      title: 'Ivory Corridor',
      text: 'Warm neutrals, negative space, and precise product rhythm for buyers and stylists.',
      image: asset('bag-keyline.jpg'),
      alt: 'A monochrome bag study with warm ivory contrast.'
    },
    {
      slug: 'column-shadow',
      number: '04',
      title: 'Column Shadow',
      text: 'A shoe line built on vertical tension and long evening silhouettes.',
      image: asset('column-heel.jpg'),
      alt: 'Column heel photographed in dramatic shadow.'
    }
  ]
}

export const seedCollections = [
  {
    id: 'nocturne-objects-2026',
    slug: 'nocturne-objects-2026',
    title: 'Nocturne Objects 2026',
    season: 'Spring private collection',
    intro: 'A black and ivory wardrobe arranged around one surreal aperture: tailoring, object jewelry, and leather goods.',
    description: 'A black and ivory wardrobe arranged around one surreal aperture: tailoring, object jewelry, and leather goods.',
    coverImage: asset('hero-atelier.jpg'),
    coverAlt: 'Nocturne Objects campaign still life.',
    productSlugs: ['nocturne-sculpted-coat', 'aperture-evening-dress', 'keyline-top-handle', 'orbit-ear-cuff'],
    sections: [
      { title: 'A silhouette before a garment', text: 'The line begins with shoulder, waist, and shadow before it becomes product.', image: asset('look-coat.jpg'), alt: 'Sculptural coat lookbook frame.' },
      { title: 'Objects worn close', text: 'Bags, cuffs, and heels carry the aperture code across the body.', image: asset('orbit-earcuff.jpg'), alt: 'Jewelry and object detail.' },
      { title: 'Quiet checkout', text: 'The collection supports cart, invoice, and mock payment flow without leaving the house world.', image: asset('bag-keyline.jpg'), alt: 'Leather goods with architectural handle.' }
    ]
  },
  {
    id: 'gilded-silence',
    slug: 'gilded-silence',
    title: 'Gilded Silence',
    season: 'Evening capsule',
    intro: 'Muted gold accents interrupt black columns, ivory folds, and spare ceremonial volume.',
    description: 'Muted gold accents interrupt black columns, ivory folds, and spare ceremonial volume.',
    coverImage: asset('column-heel.jpg'),
    coverAlt: 'Evening capsule with column heel.',
    productSlugs: ['aperture-evening-dress', 'ivory-orbit-gown', 'column-shadow-heel', 'gilded-button-earring'],
    sections: [
      { title: 'Ceremony without noise', text: 'A capsule for black-tie evenings, private dinners, and image-led arrivals.', image: asset('column-heel.jpg'), alt: 'Evening shoe detail.' },
      { title: 'Gold as a whisper', text: 'Muted gold appears only where the eye needs a precise point of warmth.', image: asset('orbit-earcuff.jpg'), alt: 'Gold-toned object detail.' }
    ]
  },
  {
    id: 'tailored-apparitions',
    slug: 'tailored-apparitions',
    title: 'Tailored Apparitions',
    season: 'Tailoring study',
    intro: 'Cropped jackets, long coats, and narrow trousers shaped for a cinematic city wardrobe.',
    description: 'Cropped jackets, long coats, and narrow trousers shaped for a cinematic city wardrobe.',
    coverImage: asset('look-coat.jpg'),
    coverAlt: 'Tailoring campaign with long coat.',
    productSlugs: ['nocturne-sculpted-coat', 'ivory-ritual-jacket', 'shadow-column-trouser', 'aperture-collar-shirt'],
    sections: [
      { title: 'Cut for movement', text: 'The shoulder is clean, the waist is disciplined, and the hem is allowed to move.', image: asset('look-coat.jpg'), alt: 'Tailoring silhouette.' },
      { title: 'Uniform as fiction', text: 'The city wardrobe becomes slightly unreal through proportion and repetition.', image: asset('hero-atelier.jpg'), alt: 'Atelier tailoring frame.' }
    ]
  },
  {
    id: 'salon-accessories',
    slug: 'salon-accessories',
    title: 'Salon Accessories',
    season: 'Objects and leather goods',
    intro: 'Small objects designed to make a quiet silhouette feel intentional from far away.',
    description: 'Small objects designed to make a quiet silhouette feel intentional from far away.',
    coverImage: asset('bag-keyline.jpg'),
    coverAlt: 'Salon accessories with top-handle bag.',
    productSlugs: ['keyline-top-handle', 'orbit-ear-cuff', 'gilded-button-earring', 'rava-pocket-mirror'],
    sections: [
      { title: 'Hardware as punctuation', text: 'Closures, handles, and mirrored surfaces become visible marks.', image: asset('bag-keyline.jpg'), alt: 'Top handle bag detail.' },
      { title: 'Object memory', text: 'A small piece should be recognizable even without a logo.', image: asset('orbit-earcuff.jpg'), alt: 'Sculptural jewelry close-up.' }
    ]
  }
]

export const seedProducts = [
  product('nocturne-sculpted-coat', 'Nocturne Sculpted Coat', 'Tailoring', 'nocturne-objects-2026', 'Ready-to-wear', 2850, 'Wool silk coat with structured waist, sharp shoulder, satin lining, and a quiet architectural profile.', 'Available', [asset('look-coat.jpg'), asset('hero-atelier.jpg')], ['keyline-top-handle', 'column-shadow-heel']),
  product('aperture-evening-dress', 'Aperture Evening Dress', 'Dresses', 'gilded-silence', 'Evening', 3400, 'Column evening dress with an oval neckline cut, ivory lining flash, and restrained floor-length movement.', 'Made to order', [asset('hero-atelier.jpg'), asset('column-heel.jpg')], ['orbit-ear-cuff', 'gilded-button-earring']),
  product('keyline-top-handle', 'Keyline Top Handle', 'Bags', 'salon-accessories', 'Leather goods', 1420, 'Calf leather bag with architectural handle and aperture-inspired closure.', 'Online preview', [asset('bag-keyline.jpg'), asset('hero-atelier.jpg')], ['nocturne-sculpted-coat', 'rava-pocket-mirror']),
  product('orbit-ear-cuff', 'Orbit Ear Cuff', 'Jewelry', 'salon-accessories', 'Object jewelry', 390, 'Polished cuff built around oval negative space and a muted gold finish.', 'Limited stock', [asset('orbit-earcuff.jpg')], ['keyline-top-handle', 'aperture-evening-dress']),
  product('column-shadow-heel', 'Column Shadow Heel', 'Shoes', 'gilded-silence', 'Shoes', 780, 'Satin upper, column heel, sculpted profile, and a restrained evening line.', 'Available', [asset('column-heel.jpg')], ['aperture-evening-dress', 'shadow-column-trouser']),
  product('ivory-ritual-jacket', 'Ivory Ritual Jacket', 'Tailoring', 'tailored-apparitions', 'Ready-to-wear', 1950, 'Ivory wool jacket with black internal facing, precise sleeve break, and ceremonial compact volume.', 'Available', [asset('look-coat.jpg')], ['shadow-column-trouser', 'aperture-collar-shirt']),
  product('shadow-column-trouser', 'Shadow Column Trouser', 'Tailoring', 'tailored-apparitions', 'Ready-to-wear', 920, 'Long black trouser with pressed column line, hidden closure, and elongated break.', 'Available', [asset('hero-atelier.jpg')], ['ivory-ritual-jacket', 'column-shadow-heel']),
  product('gilded-button-earring', 'Gilded Button Earring', 'Jewelry', 'gilded-silence', 'Object jewelry', 460, 'Single statement earring shaped like an oversized couture button in brushed warm gold.', 'Limited stock', [asset('orbit-earcuff.jpg')], ['aperture-evening-dress', 'orbit-ear-cuff']),
  product('aperture-collar-shirt', 'Aperture Collar Shirt', 'Tailoring', 'tailored-apparitions', 'Shirting', 640, 'Cotton poplin shirt with sculpted collar opening and covered placket.', 'Available', [asset('look-coat.jpg')], ['ivory-ritual-jacket', 'shadow-column-trouser']),
  product('ivory-orbit-gown', 'Ivory Orbit Gown', 'Dresses', 'gilded-silence', 'Evening', 4200, 'Ivory crepe gown with black aperture embroidery and a long surreal train.', 'Appointment only', [asset('hero-atelier.jpg')], ['gilded-button-earring', 'column-shadow-heel']),
  product('rava-pocket-mirror', 'RAVA Pocket Mirror', 'Objects', 'salon-accessories', 'Object', 220, 'Small polished mirror object with black case, warm gray lining, and aperture clasp.', 'Available', [asset('bag-keyline.jpg')], ['keyline-top-handle', 'orbit-ear-cuff']),
  product('black-salon-glove', 'Black Salon Glove', 'Objects', 'nocturne-objects-2026', 'Accessory', 310, 'Long stretch glove with tonal aperture embroidery and a narrow wrist opening.', 'Available', [asset('column-heel.jpg')], ['aperture-evening-dress', 'gilded-button-earring'])
]

export const seedEditorials = [
  editorial('the-aperture-code', 'Craft note', 'The aperture code: an opening as signature.', 'A short study on how one repeated shape can make a fictional maison feel coherent.', 'The aperture begins as absence: a neckline, a handle, a button, a cuff, a space cut through black fabric. MAISON RAVA uses the opening as a memory device rather than a logo. It lets buyers recognize the house from proportion, not noise.', asset('orbit-earcuff.jpg')),
  editorial('inside-the-private-room', 'Maison', 'Inside the private room.', 'A cinematic view of appointment-led fitting, quiet service, and product storytelling.', 'The private room is designed for slow decisions. The buyer sees the coat beside the bag, the cuff beside the neckline, and the invoice as part of the same calm ritual. Nothing is rushed; every screen keeps the atmosphere intact.', asset('hero-atelier.jpg')),
  editorial('notes-on-black-ivory-and-light', 'Palette', 'Notes on black, ivory, and warm light.', 'How the house palette stays minimal without becoming flat.', 'Black carries the silhouette. Ivory carries air. Warm gray softens the surface. Muted gold appears rarely, only as a small sign of heat inside a restrained system.', asset('look-coat.jpg')),
  editorial('object-jewelry-as-architecture', 'Object jewelry', 'Object jewelry as architecture.', 'A look at the cuff, earring, and clasp as small structures.', 'The jewelry is not decoration after the garment. It behaves like architecture scaled down for the hand, ear, wrist, or bag. Each piece has mass, opening, edge, and shadow.', asset('orbit-earcuff.jpg')),
  editorial('the-invoice-as-salon-note', 'Commerce', 'The invoice as salon note.', 'Mock payment is treated as part of the luxury flow, not a generic checkout interruption.', 'The first commerce version uses invoice IDs, mock payment methods, and simple status lookup. It is intentionally modest: enough to test the buyer journey without pretending to be a payment gateway.', asset('bag-keyline.jpg')),
  editorial('tailoring-for-the-cinematic-city', 'Tailoring', 'Tailoring for the cinematic city.', 'Coats, jackets, and trousers made for movement through night architecture.', 'The city wardrobe is edited for contrast: long dark forms, occasional ivory frames, small gold points, and enough restraint for the buyer to imagine the garment in their own life.', asset('column-heel.jpg'))
]

export const seedOrders = []
export const seedSubscribers = []

function product(slug, title, category, collectionSlug, line, priceValue, description, status, images, relatedSlugs) {
  return {
    id: slug,
    slug,
    title,
    category,
    collectionSlug,
    line,
    description,
    price: `EUR ${priceValue.toLocaleString('en-US')}`,
    priceValue,
    currency: 'EUR',
    status,
    images,
    image: images[0],
    alt: `${title} product image.`,
    sizes: ['XS', 'S', 'M', 'L'],
    specs: [
      { label: 'Maison', value: 'MAISON RAVA' },
      { label: 'Line', value: line },
      { label: 'Service', value: status.includes('order') || status.includes('Appointment') ? 'Private appointment available' : 'Online inquiry available' }
    ],
    relatedSlugs,
    createdAt: '2026-01-15T00:00:00.000Z'
  }
}

function editorial(slug, type, title, summary, body, image) {
  return {
    id: slug,
    slug,
    type,
    title,
    summary,
    body,
    image,
    alt: `${title} editorial image.`,
    publishedAt: '2026-01-20T00:00:00.000Z'
  }
}

export const defaultContent = {
  site: seedSite,
  homepage: seedHomepage,
  quickStrip: seedSite.quickStrip,
  campaigns: seedHomepage.campaigns,
  categories: seedSite.categories,
  collections: seedCollections,
  products: seedProducts,
  code: seedSite.code,
  timeline: seedSite.timeline,
  metrics: seedSite.metrics,
  journal: seedEditorials,
  editorials: seedEditorials,
  boutiques: seedSite.boutiques,
  appointment: seedSite.appointment,
  newsletter: seedSite.newsletter,
  media: seedSite.media,
  orders: seedOrders,
  subscribers: seedSubscribers
}
