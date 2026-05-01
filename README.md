# MAISON RAVA Luxury Commerce

Production-oriented luxury editorial commerce site for a Pterodactyl Node.js container. The brand is fictional: **MAISON RAVA**, a dark cinematic maison for surreal tailoring, object jewelry, collection stories, mock invoice checkout, and a token-protected CMS.

This repo intentionally keeps the stable single-process architecture already present in the project: **Hono SSR + Hono API + JSON file storage**. It avoids a custom Next.js server because Pterodactyl reliability, low memory usage, and no native dependencies are the priority for this version.

## Features

- Public pages: `/`, `/collections`, `/collections/:slug`, `/shop`, `/shop/:slug`, `/cart`, `/checkout`, `/invoice/:id`, `/order-status`, `/maison`, `/editorial`, `/editorial/:slug`, `/search`.
- Local cart with `localStorage`, quantity updates, remove item, checkout summary.
- Mock invoice checkout with QRIS, Bank Transfer, and E-Wallet methods.
- Order status lookup by invoice ID and email.
- Admin CMS at `/admin` using `ADMIN_TOKEN` with Bearer-token API calls.
- Admin can manage products, collections, editorials, orders, homepage, and site settings.
- JSON storage with automatic seed, atomic writes, `.bak` backup before overwrite, and corrupt JSON recovery.
- Seed content: 12 products, 4 collections, 6 editorials, homepage config, site settings.
- SEO: metadata, `robots.txt`, `sitemap.xml`, semantic SSR HTML.

## Stack

- Runtime: Node.js 20+
- Server/API: Hono + `@hono/node-server`
- Storage: JSON files in `DATA_DIR`
- Validation: Zod
- IDs: Nano ID
- Editorial Markdown: Marked + sanitize-html
- Frontend: server-rendered HTML, structured CSS tokens, small vanilla JS

## Local Editing

This repo is designed so you can edit locally and let Pterodactyl install dependencies on the server. Do not commit `node_modules/` or `package-lock.json`; both are ignored.

If you choose to test locally:

```sh
npm install
npm run build
npm start
```

Development command:

```sh
npm run dev
```

## Pterodactyl Setup

1. Upload or git pull the project files.
2. Set startup command:

```sh
npm start
```

3. Set install command:

```sh
npm install && npm run build
```

4. Set allocation port in the panel.
5. Set environment variables:

```txt
NODE_ENV=production
HOST=0.0.0.0
PORT={{SERVER_PORT}}
SERVER_PORT={{SERVER_PORT}}
DATA_DIR=/home/container/data
ADMIN_TOKEN=your-secure-token
SITE_URL=https://your-domain.example
```

6. Start the server.

On startup the server logs app name, environment, host, port, data directory, and health URL. Production fails fast if `ADMIN_TOKEN` or `DATA_DIR` is missing/unsafe.

## Environment

See `.env.example` and `pterodactyl.env.example`.

Important variables:

- `PORT` or `SERVER_PORT`: container port, fallback `3000`.
- `HOST`: should be `0.0.0.0` in Pterodactyl.
- `DATA_DIR`: persistent storage, default `/home/container/data` when available, otherwise `./data`.
- `ADMIN_TOKEN`: admin login token. Default `change-me-admin-token` is only allowed outside production.
- `SITE_URL`: public URL used for deployment metadata.
- `MAX_UPLOAD_BYTES`: upload limit, default 3000000.
- `CONTACT_WHATSAPP`: optional WhatsApp link/number.

## Data Storage

Required files are auto-created in `DATA_DIR`:

- `site.json`
- `products.json`
- `collections.json`
- `editorials.json`
- `orders.json`
- `subscribers.json`
- `homepage.json`

Uploads live in:

```txt
DATA_DIR/uploads/
```

Tools:

```sh
npm run content:init
npm run content:doctor
npm run content:backup
```

## Admin

Open:

```txt
/admin
```

Login with the exact `ADMIN_TOKEN` from server env. The prototype stores the token in browser `localStorage`; do not expose it as a public env variable.

## API Format

Success:

```json
{ "ok": true, "data": {} }
```

Error:

```json
{ "ok": false, "error": { "code": "ERROR_CODE", "message": "Readable message" } }
```

## Public API

- `GET /api/health`
- `GET /api/site`
- `GET /api/homepage`
- `GET /api/navigation`
- `GET /api/collections`
- `GET /api/collections/:slug`
- `GET /api/products`
- `GET /api/products/:slug`
- `GET /api/editorials`
- `GET /api/editorials/:slug`
- `GET /api/search?q=`
- `POST /api/newsletter`
- `POST /api/contact`
- `POST /api/cart/quote`
- `POST /api/orders`
- `GET /api/orders/:orderId?email=`
- `POST /api/payments/mock-webhook`

`/api/v1/*` is also mounted for frontend migration compatibility.

## Admin API

Use:

```txt
Authorization: Bearer <ADMIN_TOKEN>
```

Endpoints:

- `POST /api/admin/login`
- `GET /api/admin/stats`
- `GET|POST /api/admin/products`
- `PATCH|DELETE /api/admin/products/:id`
- `GET|POST /api/admin/collections`
- `PATCH|DELETE /api/admin/collections/:id`
- `GET|POST /api/admin/editorials`
- `PATCH|DELETE /api/admin/editorials/:id`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:id`
- `GET|PATCH /api/admin/homepage`
- `GET|PATCH /api/admin/site`

## Checks

```sh
npm run build
npm run check
npm run health
```

`npm run build` performs syntax and static production guards. `npm run check` adds smoke tests when dependencies are installed.

## Troubleshooting

- Server exits in production: check `ADMIN_TOKEN`, `DATA_DIR`, and write permission.
- Port unreachable: make sure `HOST=0.0.0.0` and `PORT={{SERVER_PORT}}`.
- Data resets after restart: make sure `/home/container/data` is persistent in Pterodactyl.
- Admin API returns 401: remove stale localStorage token and login again with the current `ADMIN_TOKEN`.
