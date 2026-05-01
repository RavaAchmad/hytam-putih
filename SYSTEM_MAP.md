# Project Summary

- Tujuan aplikasi: website luxury editorial commerce untuk brand fiksi **MAISON RAVA** dengan homepage campaign, collections, shop, product detail, cart, checkout invoice mock, order status, maison story, editorial, search, dan admin CMS.
- Tech stack utama: Node.js 20+, Next.js production server, Hono SSR/API, Zod validation, Nano ID, Marked + sanitize-html, JSON file storage, structured CSS tokens, vanilla JS untuk cart/admin interaksi.
- DB/queue/integrasi penting: DB Not found; queue Not found; payment gateway nyata Not found; storage runtime ada di `DATA_DIR/*.json` dan `DATA_DIR/uploads/`.
- Pola arsitektur singkat: Next catch-all route -> Hono route -> `readContent()`/`writeContent()` JSON store -> SSR renderer untuk pages atau API JSON -> browser JS untuk cart/admin.
- Catatan arsitektur: startup produksi memakai `next start -H 0.0.0.0 -p <port>` lewat `scripts/start.mjs`, dengan Hono app tetap menjadi lapisan routing aplikasi.

# Core Logic Flow (Function-Level Flowchart)

- `GET /` -> `readContent()` -> `renderHome(content)` -> SSR HTML.
- `GET /collections` -> `readContent()` -> `renderCollectionsIndex(content)` -> SSR HTML.
- `GET /collections/:slug` -> `readContent()` -> `findBySlug(collections)` -> `renderCollectionDetail()` -> SSR HTML.
- `GET /shop` -> `readContent()` -> `renderShopIndex(content, query)` -> filter/sort products -> SSR HTML.
- `GET /shop/:slug` -> `readContent()` -> `findBySlug(products)` -> `renderProductDetail()` -> SSR HTML + cart button.
- `GET /cart` -> `renderCart()` -> `public/app.js` reads localStorage -> cart UI.
- `GET /checkout` -> `renderCheckout()` -> `public/app.js` posts `POST /api/orders` -> JSON order persisted.
- `GET /invoice/:orderId` -> `readContent()` -> find order -> `renderInvoice()`.
- `GET /order-status` -> `renderOrderStatus()` -> `public/app.js` calls `GET /api/orders/:orderId?email=`.
- `GET /maison` -> `renderMaison()` -> editorial house story sections.
- `GET /editorial/:slug` -> `readContent()` -> `renderEditorialDetail()` -> `renderMarkdown()` -> sanitized HTML.
- `GET /search?q=` -> `readContent()` -> `renderSearch()` -> products/collections/editorials result groups.
- `GET /api/products` -> `apiRoutes` -> `productListPayload()` -> pagination/filter/sort -> `{ ok, data }`.
- `POST /api/newsletter|contact|orders` -> rate limit -> Zod parse -> `writeContent()` -> atomic JSON write.
- `POST /api/admin/login` -> compare JSON token with `ADMIN_TOKEN` -> `{ ok, data }`.
- `GET|POST|PATCH|DELETE /api/admin/*` -> Bearer token guard -> Zod validation -> CRUD array in JSON store -> `writeContent()`.
- `npm start` -> `scripts/start.mjs` -> `dotenv/config` -> `next start -H 0.0.0.0 -p <SERVER_PORT|PORT>`.
- `npm run build` -> `next build` -> route handler imports Hono app.

# Clean Tree

```txt
.
|-- app/
|   `-- [[...slug]]/
|       `-- route.js
|-- public/
|   |-- assets/
|   |-- app.js
|   |-- index.html
|   |-- site.webmanifest
|   `-- styles.css
|-- scripts/
|   |-- check-static.mjs
|   |-- content-backup.mjs
|   |-- content-doctor.mjs
|   |-- content-init.mjs
|   |-- generate-assets.ps1
|   |-- health-check.mjs
|   |-- preflight.mjs
|   |-- seed.mjs
|   |-- start.mjs
|   `-- smoke-test.mjs
|-- src/
|   |-- api-routes.js
|   |-- content-schema.js
|   |-- content-store.js
|   |-- markdown.js
|   |-- render.js
|   |-- seed-data.js
|   |-- server.js
|   `-- template-profile.js
|-- .dockerignore
|-- .env.example
|-- .gitignore
|-- Dockerfile
|-- next.config.mjs
|-- package.json
|-- postcss.config.mjs
|-- pterodactyl.env.example
|-- README.md
|-- tailwind.config.js
|-- tsconfig.json
`-- SYSTEM_MAP.md
```

# Module Map (The Chapters)

- `app/[[...slug]]/route.js`
  - Fungsi/class publik utama: exported HTTP method handlers.
  - Peran modul: bridge Next App Router ke `app.fetch(request)` milik Hono untuk semua page/API route dinamis.

- `src/server.js`
  - Fungsi/class publik utama: exported `app`, Hono routes, static/upload handlers, sitemap/robots, server startup.
  - Peran modul: Hono SSR/API untuk public pages, admin shell, static files, uploads, dan fallback standalone listen.

- `src/api-routes.js`
  - Fungsi/class publik utama: exported `apiRoutes`, `productListPayload`, CRUD route handlers, `ok`, `errorJson`.
  - Peran modul: public/admin API layer dengan response format konsisten, Zod validation, rate limit, order flow, dan Bearer auth.

- `src/content-store.js`
  - Fungsi/class publik utama: `ensureStore`, `readContent`, `writeContent`, `readStoreFile`, `writeStoreFile`, `saveUploadedImage`, `readUploadedImage`, `deleteUploadedImage`, `slugify`, `newId`.
  - Peran modul: storage JSON multi-file di `DATA_DIR`, automatic seed, atomic write, `.bak`, upload image guard.

- `src/seed-data.js`
  - Fungsi/class publik utama: `seedSite`, `seedHomepage`, `seedProducts`, `seedCollections`, `seedEditorials`, `defaultContent`.
  - Peran modul: seed MAISON RAVA untuk 12 products, 4 collections, 6 editorials, site settings, dan homepage.

- `src/content-schema.js`
  - Fungsi/class publik utama: `contentSchema`, `validateContent`.
  - Peran modul: validasi struktur content gabungan sebelum dipakai/render/persist.

- `src/render.js`
  - Fungsi/class publik utama: `renderHome`, `renderShopIndex`, `renderProductDetail`, `renderCart`, `renderCheckout`, `renderInvoice`, `renderOrderStatus`, `renderMaison`, `renderEditorialIndex`, `renderEditorialDetail`, `renderSearch`, `renderAdmin`, `renderNotFound`, `escapeHtml`.
  - Peran modul: SSR renderer untuk semua halaman public dan admin shell dengan escaping HTML/attribute.

- `src/markdown.js`
  - Fungsi/class publik utama: `renderMarkdown`.
  - Peran modul: render body editorial Markdown menjadi HTML yang disanitasi.

- `src/template-profile.js`
  - Fungsi/class publik utama: `templateProfile`.
  - Peran modul: metadata template CSS/visual untuk shell “monochrome-maison”.

- `public/app.js`
  - Fungsi/class publik utama: cart helpers, checkout submit, order status lookup, newsletter submit, admin client.
  - Peran modul: interaksi browser kecil untuk filter, localStorage cart, invoice API, dan CMS client.

- `public/styles.css`
  - Fungsi/class publik utama: CSS tokens, layout utilities, component classes, responsive rules.
  - Peran modul: design system visual black/ivory/warm-gray/muted-gold dengan layout mobile-first.

- `scripts/preflight.mjs`
  - Fungsi/class publik utama: top-level preflight.
  - Peran modul: cek env production wajib dan akses tulis `DATA_DIR` sebelum server start.

- `scripts/start.mjs`
  - Fungsi/class publik utama: top-level Next launcher.
  - Peran modul: load `.env` dengan `dotenv/config`, pilih `SERVER_PORT` atau `PORT`, default `HOST=0.0.0.0`, default `DATA_DIR=/home/container/data`, lalu spawn `next start`.

- `scripts/seed.mjs`
  - Fungsi/class publik utama: top-level seed runner.
  - Peran modul: load `.env` dengan `dotenv/config`, buat seed JSON store, dan laporkan isi `DATA_DIR`.

- `scripts/check-static.mjs`
  - Fungsi/class publik utama: top-level static guard.
  - Peran modul: cek budget source/client, SSR refs, security assumptions, dependency declarations, dan template wiring.

- `scripts/smoke-test.mjs`
  - Fungsi/class publik utama: top-level smoke flow.
  - Peran modul: test route utama, admin token login, health, order creation, dan order status via `app.request()`.

- `scripts/content-init.mjs`, `scripts/content-doctor.mjs`, `scripts/content-backup.mjs`
  - Fungsi/class publik utama: top-level content tooling.
  - Peran modul: seed, inspeksi, dan backup file JSON runtime.

# Data & Config

- Lokasi env/config:
  - `.env.example`: contoh env umum.
  - `pterodactyl.env.example`: contoh env Pterodactyl.
- `package.json`: scripts/dependencies/runtime engine untuk Next + Hono.
- `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.js`, `tsconfig.json`: konfigurasi build Next/Tailwind/TypeScript.
  - `Dockerfile`: optional container reference.
- Skema data runtime:
  - `site.json`: brand/site settings, categories, quick strip, house code, metrics, boutiques, appointment, newsletter, media.
  - `homepage.json`: featured campaign/collection/products/editorials dan campaign panels.
  - `products.json`: id/slug/title/category/collectionSlug/line/description/priceValue/images/sizes/specs/relatedSlugs.
  - `collections.json`: id/slug/title/season/intro/cover/sections/productSlugs.
  - `editorials.json`: id/slug/type/title/summary/body/image/publishedAt.
  - `orders.json`: invoice/customer/items/totals/paymentMethod/status timestamps.
  - `subscribers.json`: newsletter subscribers.
- Relasi ringkas:
  - `products.collectionSlug` -> `collections.slug`.
  - `collections.productSlugs[]` -> `products.slug`.
  - `products.relatedSlugs[]` -> `products.slug`.
  - `homepage.featured*Slugs[]` -> corresponding entity slug.
- Migration/seed:
  - Migration Not found.
  - Seeds: `src/seed-data.js`, ditulis otomatis oleh `ensureStore()`.
- Output/runtime artifacts:
  - `DATA_DIR/*.json`: CMS/order runtime data.
  - `DATA_DIR/*.json.bak`: backup sebelum overwrite.
  - `DATA_DIR/uploads/`: uploaded images runtime.
  - `DATA_DIR/backups/`: optional backup output.
  - `node_modules/`, `package-lock.json`, `.git/`, `data/`, `tmp/`, `coverage/`: excluded from map.

# External Integrations

- npm registry: dependency install di server/Pterodactyl via `npm install && npm run build`.
- Next.js runtime: `npm start` menjalankan `next start` dan bind ke `0.0.0.0`.
- Browser mail client: `mailto:` inquiry links.
- Optional WhatsApp: `CONTACT_WHATSAPP` renders buyer inquiry link only when configured.
- Runtime DB/payment/email API/queue/external CMS: Not found.

# Risks / Blind Spots

- Next App Router dipakai sebagai host produksi; route rendering utama tetap berasal dari Hono SSR sehingga migration ke React pages bisa dilakukan bertahap.
- Admin token prototype disimpan di browser `localStorage`; cukup untuk v1 single-admin, bukan multi-user auth production enterprise.
- JSON file store single-writer; concurrent admin writes dapat memakai last-write-wins.
- Mock payment bukan payment gateway nyata; status bisa diubah via admin/API webhook mock.
- `npm install` tidak bisa diverifikasi dari sesi ini jika sandbox/network menolak registry access.
