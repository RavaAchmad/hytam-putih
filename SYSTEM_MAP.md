# Project Summary

- Tujuan aplikasi: website luxury editorial multi-page untuk VAEL Atelier dengan CMS admin single-user, katalog produk premium, collection magazine pages, journal, boutiques, dan inquiry ringan.
- Tech stack utama: Node.js >=20, Hono SSR, `@hono/node-server`, Zod content validation, Nano ID generation, Marked + sanitize-html untuk journal markdown aman, file JSON storage, HTML renderer manual, CSS/JS statis kecil, PowerShell `System.Drawing` untuk aset JPEG monochrome.
- DB/queue/integrasi penting: DB Not found; queue Not found; storage utama adalah `DATA_DIR/content.json` dan `DATA_DIR/uploads/`.
- Pola arsitektur singkat: Hono route/handler -> file JSON content store -> SSR renderer -> public HTML; admin POST memakai signed cookie + CSRF lalu menulis ulang content JSON.

# Core Logic Flow (Function-Level Flowchart)

- HTTP request -> `serve({ fetch: app.fetch })` -> middleware `compress()` -> `etag()` -> `secureHeaders()` -> custom CSP/cache headers -> route handler.
- `GET /` -> `readContent()` -> `renderHome(content)` -> SSR HTML.
- `GET /collections` -> `readContent()` -> `renderCollectionsIndex(content)` -> SSR HTML.
- `GET /collections/:slug` -> `readContent()` -> `findBySlug(collections)` -> `renderCollectionDetail(content, collection)` -> SSR HTML.
- `GET /products/:slug` -> `readContent()` -> `findBySlug(products)` -> `renderProductDetail(content, product)` -> SSR HTML.
- `GET /journal` -> `readContent()` -> `renderJournalIndex(content)` -> SSR HTML.
- `GET /journal/:slug` -> `readContent()` -> `findBySlug(journal)` -> `renderJournalDetail(content, article)` -> SSR HTML.
- `GET /boutiques` -> `readContent()` -> `renderBoutiques(content)` -> SSR HTML.
- `GET /uploads/:filename` -> `readUploadedImage(filename)` -> `basename()` constrained file read -> binary image response.
- `GET /api/health` -> inline handler -> process uptime + storage metadata -> JSON.
- `GET /api/content` -> `readContent()` -> counts/site metadata -> JSON.
- `GET /robots.txt` -> `publicOrigin(c)` -> dynamic text.
- `GET /sitemap.xml` -> `readContent()` -> dynamic URLs for static pages + collection/product/journal slugs -> XML.
- `GET /admin/login` -> `renderLogin()` unless `isAdmin(c)` redirects to `/admin`.
- `POST /admin/login` -> `parseBody()` -> password compare -> `createSession()` -> `setAdminCookie()` -> redirect `/admin`.
- `GET /admin` -> `requireAdmin()` -> `readContent()` -> `renderAdmin(content, csrfToken(c), notice)` -> SSR admin.
- Admin POST routes -> `requireAdminPost()` -> CSRF verify -> body mapper (`productFromBody`, `collectionFromBody`, etc.) -> `writeContent(content)` -> redirect with notice.
- `POST /admin/media/upload` -> `saveUploadedImage(file, alt)` -> `writeFile(DATA_DIR/uploads)` -> update `content.media`.
- `POST /admin/content-json` -> parse JSON -> `writeContent(nextContent)` -> normalizer -> persist.
- Unknown route -> `notFound(c, content?)` -> `renderNotFound()` -> 404 HTML.
- Journal render -> `renderJournalDetail()` -> `renderMarkdown()` -> `marked.parse()` -> `sanitizeHtml()` -> safe rich-text HTML.
- `npm run start` -> `preflight.mjs` -> env/data-dir write check -> `src/server.js`.
- `npm run check` -> `check:syntax` all source/client/tool JS -> `check-static.mjs` render/static/module guard -> `smoke-test.mjs` Hono `app.request()` route tests.
- `npm run content:init|doctor|backup` -> file tooling against `DATA_DIR/content.json`.

# Clean Tree

```text
.
|-- .github/
|   |-- dependabot.yml
|   `-- workflows/
|       |-- ci.yml
|       `-- codeql.yml
|-- docs/
|   `-- schiaparelli-inspired-analysis.md
|-- public/
|   |-- assets/
|   |   |-- bag-keyline.jpg
|   |   |-- column-heel.jpg
|   |   |-- hero-atelier.jpg
|   |   |-- look-coat.jpg
|   |   `-- orbit-earcuff.jpg
|   |-- app.js
|   |-- index.html
|   |-- site.webmanifest
|   `-- styles.css
|-- scripts/
|   |-- content-backup.mjs
|   |-- content-doctor.mjs
|   |-- content-init.mjs
|   |-- check-static.mjs
|   |-- generate-assets.ps1
|   |-- health-check.mjs
|   |-- preflight.mjs
|   `-- smoke-test.mjs
|-- src/
|   |-- content-schema.js
|   |-- content-store.js
|   |-- markdown.js
|   |-- render.js
|   `-- server.js
|-- .dockerignore
|-- .gitignore
|-- Dockerfile
|-- package.json
|-- pterodactyl.env.example
|-- README.md
`-- SYSTEM_MAP.md
```

# Module Map (The Chapters)

- `src/server.js`
  - Fungsi/class publik utama: exported `app`, Hono routes, admin auth helpers, body mappers, `publicOrigin`, `notFound`.
  - Peran modul: entrypoint dan router utama untuk public pages, admin CMS, API metadata, upload serving, security headers, dan production env guard.

- `src/content-store.js`
  - Fungsi/class publik utama: `defaultContent`, `ensureStore`, `readContent`, `writeContent`, `saveUploadedImage`, `readUploadedImage`, `deleteUploadedImage`, `slugify`, `newId`.
  - Peran modul: file-based CMS store, default schema, normalizer kompatibel data lama, upload image storage, dan pemanggil validasi Zod.

- `src/content-schema.js`
  - Fungsi/class publik utama: `contentSchema`, `validateContent`.
  - Peran modul: schema Zod untuk memastikan struktur CMS valid sebelum dipakai/render/disimpan.

- `src/markdown.js`
  - Fungsi/class publik utama: `renderMarkdown`.
  - Peran modul: mengubah journal body Markdown menjadi HTML yang disanitasi.

- `src/render.js`
  - Fungsi/class publik utama: `renderHome`, `renderCollectionsIndex`, `renderCollectionDetail`, `renderProductDetail`, `renderJournalIndex`, `renderJournalDetail`, `renderBoutiques`, `renderLogin`, `renderAdmin`, `renderNotFound`, `escapeHtml`.
  - Peran modul: SSR renderer untuk public pages dan admin forms, termasuk escaping HTML/attribute.

- `public/app.js`
  - Fungsi/class publik utama: `updateProducts`.
  - Peran modul: interaksi ringan buyer untuk filter kategori dan search product card yang sudah SSR.

- `public/styles.css`
  - Fungsi/class publik utama: Not found; stylesheet global.
  - Peran modul: sistem UI monochrome untuk campaign, collections, products, magazine layout, admin panel, responsive states, dan reduced motion.

- `public/index.html`
  - Fungsi/class publik utama: Not found; static fallback.
  - Peran modul: fallback redirect kecil ke `/` karena homepage asli dirender oleh Hono.

- `public/site.webmanifest`
  - Fungsi/class publik utama: Not found; manifest JSON.
  - Peran modul: metadata PWA ringan untuk VAEL Atelier.

- `scripts/check-static.mjs`
  - Fungsi/class publik utama: top-level validation flow.
  - Peran modul: static/render guard untuk SSR output, external refs, LCP/lazy loading, monochrome CSS tokens, env guard, upload guard, dependency guard, dan size budget.

- `scripts/smoke-test.mjs`
  - Fungsi/class publik utama: top-level smoke flow.
  - Peran modul: menjalankan Hono `app.request()` dengan `DATA_DIR` temp untuk memastikan public/admin/API/upload-safe routes bekerja.

- `scripts/generate-assets.ps1`
  - Fungsi/class publik utama: `New-Canvas`, `Save-Jpeg`, drawing helpers, `New-ProductImage`.
  - Peran modul: generator aset JPEG monochrome lokal untuk hero dan product imagery.

- `scripts/preflight.mjs`
  - Fungsi/class publik utama: top-level preflight flow.
  - Peran modul: mengecek env production wajib dan akses tulis `DATA_DIR` sebelum server start.

- `scripts/health-check.mjs`
  - Fungsi/class publik utama: top-level health flow.
  - Peran modul: mengecek endpoint `/api/health` pada server yang sedang berjalan.

- `scripts/content-init.mjs`, `scripts/content-doctor.mjs`, `scripts/content-backup.mjs`
  - Fungsi/class publik utama: top-level content tooling.
  - Peran modul: seed, inspeksi, dan backup content JSON untuk operasional Pterodactyl.

- `package.json`
  - Fungsi/class publik utama: npm scripts `start`, `preflight`, `health`, `check`, `content:*`, `assets:generate:win`.
  - Peran modul: manifest Node project, dependency runtime, engine, dan command operasional container.

- `Dockerfile`
  - Fungsi/class publik utama: Not found; container build steps.
  - Peran modul: Node 22 Alpine production image dengan `DATA_DIR=/app/data`, non-root runtime, dan writable data directory.

- `pterodactyl.env.example`
  - Fungsi/class publik utama: Not found; env example.
  - Peran modul: template env production untuk Pterodactyl, termasuk admin password/session secret/data dir/upload limit/WhatsApp.

# Data & Config

- Lokasi `.env*` / config utama:
  - `.env*`: Not found.
  - `pterodactyl.env.example`: contoh env wajib production.
  - `Dockerfile`: default container env dan writeable `/app/data`.
  - `package.json`: scripts/dependencies (`hono`, `@hono/node-server`, `zod`, `nanoid`, `marked`, `sanitize-html`).
  - `public/site.webmanifest`: web app metadata.
  - `.github/workflows/*.yml` dan `.github/dependabot.yml`: CI/security automation.

- Skema data inti:
  - `site`: brand, mark, SEO description, hero copy/image, CTA labels, optional WhatsApp.
  - `media`: upload/built-in image entries with `id`, `src`, `alt`, `builtin`, optional upload metadata.
  - `campaigns`: homepage editorial panels with slug/number/title/text/image.
  - `collections`: slug/title/season/cover/intro, magazine `sections[]`, and `productSlugs[]`.
  - `products`: slug/title/category/collectionSlug/line/description/price/status, `images[]`, `specs[]`, `relatedSlugs[]`.
  - `journal`: slug/type/title/summary/body/image.
  - `boutiques`: slug/city/title/address/hours/email/image.
  - `appointment`, `newsletter`, `metrics`, `quickStrip`, `timeline`: content blocks.

- Lokasi migration/seed:
  - Migrations: Not found.
  - Seeds: `defaultContent` di `src/content-store.js`, ditulis otomatis ke `DATA_DIR/content.json` saat store kosong.

- Folder output/runtime artifacts:
  - `DATA_DIR/content.json`: CMS content runtime.
  - `DATA_DIR/uploads/`: uploaded images runtime.
  - `public/assets/`: built-in generated JPEG assets.
  - `node_modules/`, `.git/`, `data/`, `tmp/`, `coverage/`: excluded from map.

# External Integrations

- npm registry: install dependency via `npm ci`.
- GitHub Actions: CI and CodeQL workflows.
- GitHub Dependabot: dependency update automation.
- Browser mail client: `mailto:` inquiry/newsletter links.
- Optional WhatsApp: `CONTACT_WHATSAPP`/site WhatsApp value renders buyer inquiry link only when configured.
- Runtime DB/payment/email API/queue: Not found.

# Risks / Blind Spots

- File JSON store is single-writer and best for single-admin usage; concurrent admin writes can overwrite last saved content.
- Pterodactyl must persist `DATA_DIR`; otherwise content/uploads reset on container recreation.
- `scripts/generate-assets.ps1` depends on PowerShell + `System.Drawing`, so asset regeneration is Windows-oriented.
- No real checkout, payment, inventory, email sending, CRM, or saved leads by design.
- Upload validation checks MIME type and size, but does not perform image re-encoding or malware scanning.
- Admin auth is single password via env, not multi-user RBAC.
- PageSpeed lab test still requires deployed public HTTPS URL.
