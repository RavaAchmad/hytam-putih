import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

const root = process.cwd()
const srcDir = join(root, 'src')
const srcFiles = (await readdir(srcDir))
  .filter((file) => file.endsWith('.js'))
  .map((file) => `src/${file}`)
const scriptFiles = (await readdir(join(root, 'scripts')))
  .filter((file) => file.endsWith('.mjs'))
  .map((file) => `scripts/${file}`)

const files = [
  ...srcFiles,
  ...scriptFiles,
  'public/styles.css',
  'public/app.js'
]

let total = 0
for (const file of files) {
  const info = await stat(join(root, file))
  total += info.size
}

const css = await readFile(join(root, 'public/styles.css'), 'utf8')
const appJs = await readFile(join(root, 'public/app.js'), 'utf8')
const server = await readFile(join(root, 'src/server.js'), 'utf8')
const store = await readFile(join(root, 'src/content-store.js'), 'utf8')
const render = await readFile(join(root, 'src/render.js'), 'utf8')
const schema = await readFile(join(root, 'src/content-schema.js'), 'utf8')
const markdown = await readFile(join(root, 'src/markdown.js'), 'utf8')
const apiRoutes = await readFile(join(root, 'src/api-routes.js'), 'utf8')
const templateProfile = await readFile(join(root, 'src/template-profile.js'), 'utf8')
const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))

const renderExternalRefs = [...render.matchAll(/(?:src|href)=["']https?:\/\//g)]

if (renderExternalRefs.length > 0) {
  throw new Error(`External render reference found: ${renderExternalRefs.length}`)
}

if (!render.includes('fetchpriority="high"')) {
  throw new Error('Renderer needs fetchpriority="high" for LCP.')
}

if (!render.includes('loading="lazy"')) {
  throw new Error('Renderer should lazy-load below-fold images.')
}

if (!render.includes('/app.js')) {
  throw new Error('Renderer should include the lightweight client script.')
}

if (css.includes('letter-spacing: -')) {
  throw new Error('Negative letter spacing is disabled for this template.')
}

for (const forbidden of ['--wine', '--brass', '--teal', '--indigo', '#7d1231', '#b8872f', '#174846', '#202a60']) {
  if (css.includes(forbidden)) {
    throw new Error(`Non-monochrome legacy token found in CSS: ${forbidden}`)
  }
}

if (!server.includes('Production env missing or unsafe')) {
  throw new Error('Production env guard is missing.')
}

if (!store.includes('image/png,image/jpeg,image/webp,image/gif') && !store.includes('imageTypes')) {
  throw new Error('Upload image type guard is missing.')
}

for (const dependency of ['zod', 'nanoid', 'marked', 'sanitize-html']) {
  if (!packageJson.dependencies?.[dependency]) {
    throw new Error(`Expected dependency missing: ${dependency}`)
  }
}

if (!schema.includes('contentSchema') || !store.includes('validateContent')) {
  throw new Error('Zod content validation is not wired.')
}

if (!markdown.includes('sanitizeHtml') || !markdown.includes('marked.parse')) {
  throw new Error('Markdown rendering must be sanitized.')
}

if (!server.includes("app.route('/api/v1', apiRoutes)") || !apiRoutes.includes("apiRoutes.get('/products")) {
  throw new Error('API v1 routes are not wired for future frontend consumption.')
}

if (!render.includes('data-template="${attr(templateProfile.id)}"') || !templateProfile.includes("id: 'monochrome-maison'")) {
  throw new Error('Template profile is not wired into rendered output.')
}

const clientBytes = Buffer.byteLength(css) + Buffer.byteLength(appJs)
if (clientBytes > 70_000) {
  throw new Error(`Client CSS and JS too large before compression: ${clientBytes} bytes`)
}

if (total > 260_000) {
  throw new Error(`Core source is too large before compression: ${total} bytes`)
}

console.log(`Static check passed. Source size: ${total} bytes. Client CSS+JS: ${clientBytes} bytes.`)
