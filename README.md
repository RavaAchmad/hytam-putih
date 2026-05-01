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
npm run generate:assets
npm run check
npm start
```

Untuk menjalankan mode production lokal, set env wajib dulu. Setelah domain publik aktif, uji performa di `https://pagespeed.web.dev/`.
