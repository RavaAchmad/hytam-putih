# VAEL Atelier Monochrome CMS

Luxury editorial storefront berbasis Hono SSR + file JSON CMS. Website ini menggabungkan campaign imagery, collection magazine pages, product detail premium, journal, boutiques, dan admin image/content manager yang ringan untuk Pterodactyl.

Riset arah visual dan struktur konten ada di `docs/schiaparelli-inspired-analysis.md`.

## Pterodactyl

Environment wajib untuk production:

```txt
NODE_ENV=production
HOST=0.0.0.0
PORT={{SERVER_PORT}}
DATA_DIR=/home/container/data
ADMIN_PASSWORD=isi-password-panjang
ADMIN_SESSION_SECRET=isi-secret-panjang-berbeda
MAX_UPLOAD_BYTES=3000000
CONTACT_WHATSAPP=
HEALTH_HOST=127.0.0.1
HEALTH_PATH=/api/health
```

`DATA_DIR` harus berada di storage persistent Pterodactyl. Server akan gagal start di production jika `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, atau `DATA_DIR` belum aman.

Install command:

```sh
npm ci --omit=dev
```

Startup command:

```sh
npm start
```

`npm start` menjalankan preflight dulu. Kalau env production belum aman atau `DATA_DIR` tidak bisa ditulis, container akan berhenti dengan pesan jelas.

Admin:

```txt
/admin
```

Health check:

```txt
/api/health
```

## Fitur

- Public pages: `/`, `/collections`, `/collections/:slug`, `/products/:slug`, `/journal`, `/journal/:slug`, `/boutiques`.
- Admin CMS: hero/site, campaign panels, collections, products, journal, boutiques, house code, appointment, newsletter, media library, dan advanced JSON.
- Storage: `DATA_DIR/content.json` dan `DATA_DIR/uploads/`.
- Buyer inquiry: `mailto:` dan optional WhatsApp, tanpa checkout/payment/lead storage.
- Security: signed admin cookie, CSRF untuk POST admin, CSP self-only, secure headers, ETag, compression.
- Performance: no CDN, no external fonts, no tracker, local monochrome assets, immutable cache untuk `/assets/*` dan `/uploads/*`.

## Command Lokal

```sh
npm run assets:generate:win
npm run check
npm start
```

## Tools NPM

```sh
npm run preflight       # cek env wajib dan akses tulis DATA_DIR
npm run health          # cek /api/health pada server berjalan
npm run check           # syntax + static guard + smoke test
npm run check:syntax    # syntax check semua JS utama
npm run check:static    # validasi SSR/static/template guard
npm run test:smoke      # test route inti via Hono app.request
npm run content:init    # seed DATA_DIR/content.json default
npm run content:doctor  # ringkasan content.json dan media
npm run content:backup  # backup content.json ke DATA_DIR/backups
```

Modul runtime sengaja pure-JS dan aman untuk user container:

- `hono` + `@hono/node-server`: SSR router/server.
- `zod`: validasi schema CMS.
- `nanoid`: ID/slug suffix ringkas.
- `marked` + `sanitize-html`: journal markdown yang disanitasi.

Untuk menjalankan mode production lokal, set env wajib dulu. Setelah domain publik aktif, uji performa di `https://pagespeed.web.dev/`.
