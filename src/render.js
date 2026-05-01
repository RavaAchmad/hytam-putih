import { renderMarkdown } from './markdown.js'
import { templateProfile } from './template-profile.js'

export function renderHome(content) {
  const featuredProducts = featuredBySlug(content.products, content.homepage?.featuredProductSlugs, 8)
  const featuredJournal = featuredBySlug(content.editorials || content.journal, content.homepage?.featuredEditorialSlugs, 3)

  const body = `
    <a class="skip-link" href="#main">Lewati ke konten</a>
    ${renderHeader(content)}
    <main id="main">
      ${renderHero(content)}
      ${renderQuickStrip(content)}

      <section class="section campaign-strip" aria-labelledby="campaign-title">
        <div class="section-heading">
          <p class="eyebrow">Campaign</p>
          <h2 id="campaign-title">A monochrome world with sharp edges.</h2>
          <a class="text-link" href="/collections">View collections</a>
        </div>
        <div class="campaign-grid">
          ${content.campaigns.map(renderCampaignCard).join('')}
        </div>
      </section>

      <section class="section collection-preview" aria-labelledby="collections-title">
        <div class="section-heading">
          <p class="eyebrow">Collections</p>
          <h2 id="collections-title">Digital magazine edits.</h2>
          <a class="text-link" href="/collections">All collections</a>
        </div>
        <div class="collection-grid">
          ${content.collections.map(renderCollectionCard).join('')}
        </div>
      </section>

      ${renderShopSection(content, featuredProducts)}
      ${renderCodeSection(content)}
      ${renderMaisonSection(content)}
      ${renderAtelierSection(content)}
      ${renderEditorialPreview(featuredJournal)}
      ${renderAppointment(content)}
      ${renderBoutiquePreview(content)}
      ${renderNewsletter(content)}
    </main>
    ${renderFooter(content)}
  `

  return renderDocument({
    title: `${content.site.brand} | Luxury Fashion Editorial Commerce`,
    description: content.site.description,
    ogImage: content.site.heroImage,
    body,
    scripts: ['/app.js']
  })
}

export function renderCollectionsIndex(content) {
  return renderDocument({
    title: `Collections | ${content.site.brand}`,
    description: 'Collection stories, campaign edits, and product lines from MAISON RAVA.',
    ogImage: content.collections[0]?.coverImage || content.site.heroImage,
    body: `
      <a class="skip-link" href="#main">Lewati ke konten</a>
      ${renderHeader(content)}
      <main id="main">
        ${renderPageHero('Collections', 'Seasonal edits as digital magazine chapters.', content.collections[0]?.coverImage || content.site.heroImage, content.collections[0]?.coverAlt || content.site.heroAlt)}
        <section class="section">
          <div class="collection-grid large">
            ${content.collections.map(renderCollectionCard).join('')}
          </div>
        </section>
        ${renderNewsletter(content)}
      </main>
      ${renderFooter(content)}
    `
  })
}

export function renderShopIndex(content, query = {}) {
  const products = filterProducts(content.products, query)
  const selectedCategory = String(query.category || 'all').toLowerCase()
  const selectedCollection = String(query.collection || '').toLowerCase()
  const sort = String(query.sort || 'newest')

  return renderDocument({
    title: `Shop | ${content.site.brand}`,
    description: 'Shop sculptural tailoring, evening pieces, leather goods, object jewelry, and accessories from MAISON RAVA.',
    ogImage: products[0]?.images?.[0] || content.site.heroImage,
    body: `
      <a class="skip-link" href="#main">Lewati ke konten</a>
      ${renderHeader(content)}
      <main id="main">
        ${renderPageHero('Shop', 'A compact catalog of surreal tailoring, objects, and evening silhouettes.', content.site.heroImage, content.site.heroAlt, 'Commerce')}
        <section class="section shop-page" aria-labelledby="shop-grid-title">
          <form class="shop-filter-panel" action="/shop" method="get">
            <label>Search<input name="q" value="${attr(query.q || '')}" placeholder="coat, cuff, gown"></label>
            <label>Category
              <select name="category">
                ${content.categories.map((category) => option(category.toLowerCase(), category, selectedCategory)).join('')}
              </select>
            </label>
            <label>Collection
              <select name="collection">
                ${option('', 'All collections', selectedCollection)}
                ${content.collections.map((collection) => option(collection.slug, collection.title, selectedCollection)).join('')}
              </select>
            </label>
            <label>Min price<input name="min" inputmode="numeric" value="${attr(query.min || '')}" placeholder="0"></label>
            <label>Max price<input name="max" inputmode="numeric" value="${attr(query.max || '')}" placeholder="5000"></label>
            <label>Sort
              <select name="sort">
                ${option('newest', 'Newest', sort)}
                ${option('price-low', 'Price low', sort)}
                ${option('price-high', 'Price high', sort)}
              </select>
            </label>
            <button class="button primary" type="submit">Apply</button>
          </form>
          <div class="section-heading">
            <p class="eyebrow">Catalog</p>
            <h2 id="shop-grid-title">${products.length} pieces.</h2>
            <a class="text-link" href="/cart">View cart</a>
          </div>
          ${products.length ? `<div class="product-grid">${products.map(renderProductCard).join('')}</div>` : renderEmptyState('No pieces match this filter.', 'Reset the filters or search for another house code.', '/shop')}
        </section>
      </main>
      ${renderFooter(content)}
    `,
    scripts: ['/app.js']
  })
}

export function renderCollectionDetail(content, collection) {
  const products = collection.productSlugs
    .map((slug) => findBySlug(content.products, slug))
    .filter(Boolean)

  return renderDocument({
    title: `${collection.title} | ${content.site.brand}`,
    description: collection.intro,
    ogImage: collection.coverImage,
    body: `
      <a class="skip-link" href="#main">Lewati ke konten</a>
      ${renderHeader(content)}
      <main id="main">
        ${renderPageHero(collection.title, collection.intro, collection.coverImage, collection.coverAlt, collection.season)}
        <section class="section magazine-flow">
          ${collection.sections.map((section, index) => renderMagazineSection(section, index)).join('')}
        </section>
        <section class="section" aria-labelledby="collection-products">
          <div class="section-heading">
            <p class="eyebrow">Product rail</p>
            <h2 id="collection-products">Pieces in this edit.</h2>
            <a class="text-link" href="/collections">Back to collections</a>
          </div>
          <div class="product-grid">${products.map(renderProductCard).join('')}</div>
        </section>
        ${renderAppointment(content)}
      </main>
      ${renderFooter(content)}
    `,
    scripts: ['/app.js']
  })
}

export function renderProductDetail(content, product) {
  const collection = findBySlug(content.collections, product.collectionSlug)
  const related = product.relatedSlugs.map((slug) => findBySlug(content.products, slug)).filter(Boolean)
  const inquiry = inquiryHref(content, product.title)

  return renderDocument({
    title: `${product.title} | ${content.site.brand}`,
    description: product.description,
    ogImage: product.images[0],
    body: `
      <a class="skip-link" href="#main">Lewati ke konten</a>
      ${renderHeader(content)}
      <main id="main">
        <section class="product-detail">
          <div class="product-gallery">
            ${product.images.map((image, index) => `
              <img class="mono-media" src="${attr(image)}" width="900" height="1050" ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" alt="${attr(product.alt)}">
            `).join('')}
          </div>
          <aside class="product-panel">
            <p class="eyebrow">${escapeHtml(product.line)}</p>
            <h1>${escapeHtml(product.title)}</h1>
            <p class="product-price">${escapeHtml(product.price)}</p>
            <p>${escapeHtml(product.description)}</p>
            <dl class="spec-list">
              ${product.specs.map((spec) => `<div><dt>${escapeHtml(spec.label)}</dt><dd>${escapeHtml(spec.value)}</dd></div>`).join('')}
              <div><dt>Status</dt><dd>${escapeHtml(product.status)}</dd></div>
              ${collection ? `<div><dt>Collection</dt><dd><a href="/collections/${attr(collection.slug)}">${escapeHtml(collection.title)}</a></dd></div>` : ''}
            </dl>
            <div class="hero-actions">
              <button class="button primary" type="button" data-add-cart data-slug="${attr(product.slug)}" data-title="${attr(product.title)}" data-price="${attr(product.priceValue || 0)}" data-image="${attr(product.images[0])}">Add to cart</button>
              ${content.site.whatsapp ? `<a class="button secondary dark" href="${attr(whatsappHref(content, product.title))}">WhatsApp</a>` : ''}
            </div>
            <label class="size-select">Size
              <select data-size-select>
                ${(product.sizes || ['XS', 'S', 'M', 'L']).map((size) => `<option>${escapeHtml(size)}</option>`).join('')}
              </select>
            </label>
            <a class="text-link" href="${attr(inquiry)}">Request private inquiry</a>
            <details class="accordion" open><summary>Shipping</summary><p>Mock checkout uses an invoice flow. Orders are reviewed before fulfilment.</p></details>
            <details class="accordion"><summary>Returns</summary><p>Prototype returns policy: client care confirms eligibility by email after invoice creation.</p></details>
          </aside>
        </section>
        <section class="section" aria-labelledby="related-title">
          <div class="section-heading">
            <p class="eyebrow">Style with</p>
            <h2 id="related-title">Related pieces.</h2>
            <a class="text-link" href="/collections">Explore collections</a>
          </div>
          <div class="product-grid">${related.map(renderProductCard).join('')}</div>
        </section>
      </main>
      ${renderFooter(content)}
    `,
    scripts: ['/app.js']
  })
}

export function renderJournalIndex(content) {
  return renderDocument({
    title: `Journal | ${content.site.brand}`,
    description: 'Editorial notes, release signals, and house craft stories.',
    ogImage: content.journal[0]?.image || content.site.heroImage,
    body: `
      <a class="skip-link" href="#main">Lewati ke konten</a>
      ${renderHeader(content)}
      <main id="main">
        ${renderPageHero('Journal', 'Release notes, craft studies, and image-led stories.', content.journal[0]?.image || content.site.heroImage, content.journal[0]?.alt || content.site.heroAlt)}
        <section class="section">
          <div class="journal-list large">${content.journal.map(renderJournalCard).join('')}</div>
        </section>
      </main>
      ${renderFooter(content)}
    `
  })
}

export function renderEditorialIndex(content) {
  return renderDocument({
    title: `Editorial | ${content.site.brand}`,
    description: 'Editorial notes, craft studies, campaign stories, and commerce essays from MAISON RAVA.',
    ogImage: content.editorials[0]?.image || content.site.heroImage,
    body: `
      <a class="skip-link" href="#main">Lewati ke konten</a>
      ${renderHeader(content)}
      <main id="main">
        ${renderPageHero('Editorial', 'Campaign stories, craft studies, and house notes.', content.editorials[0]?.image || content.site.heroImage, content.editorials[0]?.alt || content.site.heroAlt)}
        <section class="section">
          <div class="journal-list large">${content.editorials.map(renderEditorialCard).join('')}</div>
        </section>
      </main>
      ${renderFooter(content)}
    `
  })
}

export function renderEditorialDetail(content, article) {
  return renderDocument({
    title: `${article.title} | ${content.site.brand}`,
    description: article.summary,
    ogImage: article.image,
    body: `
      <a class="skip-link" href="#main">Lewati ke konten</a>
      ${renderHeader(content)}
      <main id="main">
        ${renderPageHero(article.title, article.summary, article.image, article.alt, article.type)}
        <article class="section prose cms-richtext">
          ${renderMarkdown(article.body)}
          <a class="text-link" href="/editorial">Back to editorial</a>
        </article>
      </main>
      ${renderFooter(content)}
    `
  })
}

export function renderCart(content) {
  return renderDocument({
    title: `Cart | ${content.site.brand}`,
    description: 'Review selected MAISON RAVA pieces before invoice checkout.',
    body: `
      <a class="skip-link" href="#main">Lewati ke konten</a>
      ${renderHeader(content)}
      <main id="main">
        ${renderPageHero('Cart', 'Review pieces, quantities, and invoice estimate.', content.site.heroImage, content.site.heroAlt, 'Local cart')}
        <section class="section cart-layout" data-cart-page>
          <div class="cart-items" data-cart-items>${renderLoadingState('Loading cart')}</div>
          <aside class="summary-card">
            <p class="eyebrow">Order summary</p>
            <div data-cart-summary></div>
            <a class="button primary" href="/checkout">Checkout</a>
            <a class="button secondary dark" href="/shop">Continue shopping</a>
          </aside>
        </section>
      </main>
      ${renderFooter(content)}
    `,
    scripts: ['/app.js']
  })
}

export function renderCheckout(content) {
  return renderDocument({
    title: `Checkout | ${content.site.brand}`,
    description: 'Create a mock MAISON RAVA invoice with QRIS, bank transfer, or e-wallet method.',
    body: `
      <a class="skip-link" href="#main">Lewati ke konten</a>
      ${renderHeader(content)}
      <main id="main">
        ${renderPageHero('Checkout', 'Create an invoice for the private salon team.', content.site.heroImage, content.site.heroAlt, 'Mock invoice')}
        <section class="section checkout-layout">
          <form class="checkout-form" data-checkout-form>
            <div class="form-grid">
              ${formField('name', 'Name', 'text', 'Your name')}
              ${formField('email', 'Email', 'email', 'client@example.com')}
              ${formField('phone', 'Phone', 'tel', '+62')}
              ${formField('country', 'Country', 'text', 'Indonesia')}
            </div>
            <label>Address<textarea name="address" rows="4" required placeholder="Delivery or appointment address"></textarea></label>
            <label>Payment method
              <select name="paymentMethod" required>
                <option>QRIS</option>
                <option>Bank Transfer</option>
                <option>E-Wallet</option>
              </select>
            </label>
            <p class="form-message" data-checkout-message></p>
            <button class="button primary" type="submit">Create invoice</button>
          </form>
          <aside class="summary-card">
            <p class="eyebrow">Cart summary</p>
            <div data-checkout-summary>${renderLoadingState('Loading summary')}</div>
          </aside>
        </section>
      </main>
      ${renderFooter(content)}
    `,
    scripts: ['/app.js']
  })
}

export function renderInvoice(content, order) {
  const title = order ? `Invoice ${order.invoiceId}` : 'Invoice not found'
  return renderDocument({
    title: `${title} | ${content.site.brand}`,
    description: 'MAISON RAVA mock invoice page.',
    body: `
      <a class="skip-link" href="#main">Lewati ke konten</a>
      ${renderHeader(content)}
      <main id="main">
        <section class="section invoice-page">
          ${order ? renderInvoiceCard(order) : renderEmptyState('Invoice not found.', 'Use order status with invoice ID and email.', '/order-status')}
        </section>
      </main>
      ${renderFooter(content)}
    `
  })
}

export function renderOrderStatus(content) {
  return renderDocument({
    title: `Order Status | ${content.site.brand}`,
    description: 'Check MAISON RAVA mock invoice status.',
    body: `
      <a class="skip-link" href="#main">Lewati ke konten</a>
      ${renderHeader(content)}
      <main id="main">
        ${renderPageHero('Order Status', 'Check invoice status with order ID and email.', content.site.heroImage, content.site.heroAlt, 'Client care')}
        <section class="section checkout-layout">
          <form class="checkout-form" data-order-status-form>
            ${formField('orderId', 'Invoice ID', 'text', 'RAVA-20260120-ABC123')}
            ${formField('email', 'Email', 'email', 'client@example.com')}
            <button class="button primary" type="submit">Check status</button>
          </form>
          <aside class="summary-card" data-order-status-result>${renderEmptyState('No invoice loaded.', 'Submit an invoice ID to see the current status.')}</aside>
        </section>
      </main>
      ${renderFooter(content)}
    `,
    scripts: ['/app.js']
  })
}

export function renderMaison(content) {
  return renderDocument({
    title: `Maison | ${content.site.brand}`,
    description: 'The fictional MAISON RAVA story, atelier system, craft manifesto, and private room.',
    ogImage: content.site.heroImage,
    body: `
      <a class="skip-link" href="#main">Lewati ke konten</a>
      ${renderHeader(content)}
      <main id="main">
        ${renderPageHero('Maison', 'A fictional couture system for surreal commerce and precise editorial rhythm.', content.site.heroImage, content.site.heroAlt, 'Manifesto')}
        ${renderMaisonSection(content)}
        ${renderCodeSection(content)}
        ${renderAtelierSection(content)}
        ${renderAppointment(content)}
      </main>
      ${renderFooter(content)}
    `
  })
}

export function renderSearch(content, query = '') {
  const q = String(query || '').trim().toLowerCase()
  const products = q ? content.products.filter((item) => searchText(item).includes(q)).slice(0, 12) : []
  const collections = q ? content.collections.filter((item) => searchText(item).includes(q)).slice(0, 8) : []
  const editorials = q ? content.editorials.filter((item) => searchText(item).includes(q)).slice(0, 8) : []

  return renderDocument({
    title: `Search | ${content.site.brand}`,
    description: 'Search products, collections, and editorials from MAISON RAVA.',
    body: `
      <a class="skip-link" href="#main">Lewati ke konten</a>
      ${renderHeader(content)}
      <main id="main">
        <section class="section search-page">
          <p class="eyebrow">Search</p>
          <h1>Find a house signal.</h1>
          <form action="/search" method="get" class="search-hero-form">
            <input type="search" name="q" value="${attr(query)}" placeholder="coat, aperture, invoice" autofocus>
            <button class="button primary" type="submit">Search</button>
          </form>
          ${q ? `<p class="muted">Results for "${escapeHtml(query)}"</p>` : ''}
        </section>
        <section class="section">
          <div class="section-heading"><p class="eyebrow">Products</p><h2>${products.length} pieces</h2></div>
          ${products.length ? `<div class="product-grid">${products.map(renderProductCard).join('')}</div>` : renderEmptyState('No product results.', 'Try another term.')}
        </section>
        <section class="section">
          <div class="section-heading"><p class="eyebrow">Collections</p><h2>${collections.length} chapters</h2></div>
          ${collections.length ? `<div class="collection-grid">${collections.map(renderCollectionCard).join('')}</div>` : renderEmptyState('No collection results.', 'Try another term.')}
        </section>
        <section class="section">
          <div class="section-heading"><p class="eyebrow">Editorial</p><h2>${editorials.length} notes</h2></div>
          ${editorials.length ? `<div class="journal-list">${editorials.map(renderEditorialCard).join('')}</div>` : renderEmptyState('No editorial results.', 'Try another term.')}
        </section>
      </main>
      ${renderFooter(content)}
    `
  })
}

export function renderJournalDetail(content, article) {
  return renderDocument({
    title: `${article.title} | ${content.site.brand}`,
    description: article.summary,
    ogImage: article.image,
    body: `
      <a class="skip-link" href="#main">Lewati ke konten</a>
      ${renderHeader(content)}
      <main id="main">
        ${renderPageHero(article.title, article.summary, article.image, article.alt, article.type)}
        <article class="section prose cms-richtext">
          ${renderMarkdown(article.body)}
          <a class="text-link" href="/journal">Back to journal</a>
        </article>
      </main>
      ${renderFooter(content)}
    `
  })
}

export function renderBoutiques(content) {
  return renderDocument({
    title: `Boutiques | ${content.site.brand}`,
    description: 'Private rooms and appointment locations.',
    ogImage: content.boutiques[0]?.image || content.site.heroImage,
    body: `
      <a class="skip-link" href="#main">Lewati ke konten</a>
      ${renderHeader(content)}
      <main id="main">
        ${renderPageHero('Boutiques', 'Private rooms by appointment.', content.boutiques[0]?.image || content.site.heroImage, content.boutiques[0]?.alt || content.site.heroAlt)}
        <section class="section">
          <div class="boutique-list large">${content.boutiques.map(renderBoutiqueCard).join('')}</div>
        </section>
        ${renderAppointment(content)}
      </main>
      ${renderFooter(content)}
    `
  })
}

export function renderLogin(message = '') {
  return renderDocument({
    title: 'Admin Login | MAISON RAVA',
    description: 'Login admin MAISON RAVA.',
    body: `
      <main class="admin-shell narrow">
        <section class="admin-card">
          <p class="eyebrow">Admin</p>
          <h1>MAISON RAVA Studio</h1>
          <p class="muted">Masuk untuk mengatur konten, produk, collection, journal, boutiques, dan media library.</p>
          ${message ? `<p class="notice error">${escapeHtml(message)}</p>` : ''}
          <form method="post" action="/admin/login" class="admin-form">
            <label>Password
              <input type="password" name="password" autocomplete="current-password" required>
            </label>
            <button class="button primary" type="submit">Login</button>
          </form>
        </section>
      </main>
    `
  })
}

export function renderAdmin(content, csrfToken, message = '') {
  return renderDocument({
    title: 'Admin CMS | MAISON RAVA',
    description: 'Token-protected MAISON RAVA CMS console.',
    body: `
      <main class="admin-app" data-admin-app>
        <section class="admin-login-panel" data-admin-login>
          <p class="eyebrow">Admin CMS</p>
          <h1>MAISON RAVA Studio</h1>
          <p class="muted">Masuk dengan ADMIN_TOKEN dari environment server. Token disimpan di localStorage untuk prototype ini.</p>
          <form class="admin-token-form" data-admin-login-form>
            <label>Admin token<input type="password" name="token" autocomplete="current-password" required></label>
            <button class="button primary" type="submit">Login</button>
            <p class="form-message" data-admin-login-message>${escapeHtml(message)}</p>
          </form>
        </section>
        <section class="admin-console" data-admin-console hidden>
          <header class="admin-topbar">
            <div>
              <p class="eyebrow">Studio</p>
              <h1>Content, commerce, and orders</h1>
            </div>
            <nav>
              <a class="button secondary dark" href="/">View site</a>
              <button class="button primary" type="button" data-admin-logout>Logout</button>
            </nav>
          </header>
          <div class="admin-tabs" role="tablist">
            <button type="button" data-admin-tab="dashboard" aria-pressed="true">Dashboard</button>
            <button type="button" data-admin-tab="products">Products</button>
            <button type="button" data-admin-tab="collections">Collections</button>
            <button type="button" data-admin-tab="editorials">Editorials</button>
            <button type="button" data-admin-tab="orders">Orders</button>
            <button type="button" data-admin-tab="settings">Settings</button>
          </div>
          <div class="admin-panel" data-admin-panel>${renderLoadingState('Loading admin data')}</div>
        </section>
      </main>
    `,
    scripts: ['/app.js']
  })

  const csrf = csrfInput(csrfToken)
  return renderDocument({
    title: 'Admin Studio | MAISON RAVA',
    description: 'Admin studio MAISON RAVA.',
    body: `
      <main class="admin-shell">
        <header class="admin-topbar">
          <div>
            <p class="eyebrow">Admin Studio</p>
            <h1>Content and Image Manager</h1>
          </div>
          <nav>
            <a class="button secondary dark" href="/">View site</a>
            <form method="post" action="/admin/logout">${csrf}<button class="button primary" type="submit">Logout</button></form>
          </nav>
        </header>
        ${message ? `<p class="notice">${escapeHtml(message)}</p>` : ''}

        <section class="admin-grid">
          <article class="admin-card">
            <h2>Hero and Site</h2>
            <form method="post" action="/admin/site" class="admin-form">
              ${csrf}
              ${input('brand', 'Brand', content.site.brand)}
              ${input('mark', 'Brand mark', content.site.mark)}
              ${textarea('description', 'SEO description', content.site.description)}
              ${input('heroEyebrow', 'Hero eyebrow', content.site.heroEyebrow)}
              ${input('heroTitle', 'Hero title', content.site.heroTitle)}
              ${textarea('heroText', 'Hero text', content.site.heroText)}
              ${selectImage('heroImage', 'Hero image', content.site.heroImage, content)}
              ${input('heroAlt', 'Hero alt text', content.site.heroAlt)}
              ${input('primaryCta', 'Primary CTA', content.site.primaryCta)}
              ${input('secondaryCta', 'Secondary CTA', content.site.secondaryCta)}
              ${input('whatsapp', 'WhatsApp number or URL', content.site.whatsapp)}
              <button class="button primary" type="submit">Save site</button>
            </form>
          </article>
          ${renderMediaManager(content, csrf)}
        </section>

        <section class="admin-card">
          <div class="admin-section-head">
            <h2>Campaign Panels</h2>
            <span>${content.campaigns.length} panels</span>
          </div>
          <div class="editor-list three">${content.campaigns.map((item) => campaignForm(item, content, csrf)).join('')}</div>
          ${campaignForm({ slug: '', number: '', title: '', text: '', image: content.site.heroImage, alt: '' }, content, csrf, true)}
        </section>

        <section class="admin-card">
          <div class="admin-section-head">
            <h2>Collections</h2>
            <span>${content.collections.length} edits</span>
          </div>
          <div class="editor-list">${content.collections.map((item) => collectionForm(item, content, csrf)).join('')}</div>
          ${collectionForm({ slug: '', title: '', season: '', intro: '', coverImage: content.site.heroImage, coverAlt: '', productSlugs: [], sections: [] }, content, csrf, true)}
        </section>

        <section class="admin-card">
          <div class="admin-section-head">
            <h2>Products</h2>
            <span>${content.products.length} items</span>
          </div>
          <div class="editor-list">${content.products.map((item) => productForm(item, content, csrf)).join('')}</div>
          ${productForm({ slug: '', title: '', category: 'Evening', collectionSlug: content.collections[0]?.slug || '', line: '', description: '', price: '', status: '', images: [content.site.heroImage], alt: '', specs: [], relatedSlugs: [] }, content, csrf, true)}
        </section>

        <section class="admin-card">
          <div class="admin-section-head">
            <h2>Journal</h2>
            <span>${content.journal.length} posts</span>
          </div>
          <div class="editor-list">${content.journal.map((item) => journalForm(item, content, csrf)).join('')}</div>
          ${journalForm({ slug: '', type: '', title: '', summary: '', body: '', image: content.site.heroImage, alt: '' }, content, csrf, true)}
        </section>

        <section class="admin-card">
          <div class="admin-section-head">
            <h2>Boutiques</h2>
            <span>${content.boutiques.length} locations</span>
          </div>
          <div class="editor-list">${content.boutiques.map((item) => boutiqueForm(item, content, csrf)).join('')}</div>
          ${boutiqueForm({ slug: '', city: '', title: '', address: '', hours: '', email: '', image: content.site.heroImage, alt: '' }, content, csrf, true)}
        </section>

        <section class="admin-card">
          <h2>House Code, Appointment, Newsletter</h2>
          <form method="post" action="/admin/house" class="admin-form split">
            ${csrf}
            ${input('codeEyebrow', 'Code eyebrow', content.code.eyebrow)}
            ${input('codeTitle', 'Code title', content.code.title)}
            ${textarea('codeText', 'Code text', content.code.text)}
            ${selectImage('codeImage', 'Code image', content.code.image, content)}
            ${input('codeAlt', 'Code alt', content.code.alt)}
            ${input('appointmentTitle', 'Appointment title', content.appointment.title)}
            ${textarea('appointmentText', 'Appointment text', content.appointment.text)}
            ${input('appointmentEmail', 'Appointment email', content.appointment.email)}
            ${input('appointmentSubject', 'Appointment subject', content.appointment.subject)}
            ${input('appointmentLabel', 'Appointment button', content.appointment.label)}
            ${input('newsletterTitle', 'Newsletter title', content.newsletter.title)}
            ${textarea('newsletterText', 'Newsletter text', content.newsletter.text)}
            ${input('newsletterEmail', 'Newsletter email', content.newsletter.email)}
            ${input('newsletterSubject', 'Newsletter subject', content.newsletter.subject)}
            ${input('newsletterLabel', 'Newsletter button', content.newsletter.label)}
            <button class="button primary" type="submit">Save house content</button>
          </form>
        </section>

        <section class="admin-card">
          <h2>Advanced JSON</h2>
          <form method="post" action="/admin/content-json" class="admin-form">
            ${csrf}
            <label>Full content JSON
              <textarea name="contentJson" rows="18" spellcheck="false">${escapeHtml(JSON.stringify(content, null, 2))}</textarea>
            </label>
            <button class="button primary" type="submit">Save JSON</button>
          </form>
        </section>
      </main>
    `
  })
}

export function renderNotFound(content) {
  return renderDocument({
    title: '404 | MAISON RAVA',
    description: 'Halaman tidak ditemukan.',
    body: `
      <main class="admin-shell narrow">
        <section class="admin-card">
          <p class="eyebrow">404</p>
          <h1>Halaman tidak ditemukan</h1>
          <p class="muted">Alamat ini tidak tersedia.</p>
          <a class="button primary" href="/">Kembali ke beranda</a>
        </section>
      </main>
    `,
    ogImage: content?.site?.heroImage
  })
}

function renderHero(content) {
  return `
    <section class="hero" aria-labelledby="hero-title">
      <img class="hero-media mono-media" src="${attr(content.site.heroImage)}" width="1280" height="900" alt="${attr(content.site.heroAlt)}" fetchpriority="high" decoding="async">
      <div class="hero-shade" aria-hidden="true"></div>
      <div class="hero-copy">
        <p class="eyebrow">${escapeHtml(content.site.heroEyebrow)}</p>
        <h1 id="hero-title">${escapeHtml(content.site.heroTitle)}</h1>
        <p class="hero-text">${escapeHtml(content.site.heroText)}</p>
        <div class="hero-actions" aria-label="Aksi utama">
          <a class="button primary" href="#shop">${escapeHtml(content.site.primaryCta)}</a>
          <a class="button secondary" href="/collections">${escapeHtml(content.site.secondaryCta)}</a>
        </div>
      </div>
    </section>
  `
}

function renderPageHero(title, text, image, alt, eyebrow = '') {
  return `
    <section class="page-hero">
      <img class="mono-media" src="${attr(image)}" width="1280" height="760" fetchpriority="high" decoding="async" alt="${attr(alt)}">
      <div>
        ${eyebrow ? `<p class="eyebrow">${escapeHtml(eyebrow)}</p>` : ''}
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(text)}</p>
      </div>
    </section>
  `
}

function renderQuickStrip(content) {
  return `<section class="quick-strip" aria-label="Sorotan layanan">${content.quickStrip.map((item) => `<p>${escapeHtml(item)}</p>`).join('')}</section>`
}

function renderCampaignCard(item) {
  return `
    <article class="campaign-card">
      <img class="mono-media" src="${attr(item.image)}" width="640" height="720" loading="lazy" decoding="async" alt="${attr(item.alt)}">
      <div>
        <span>${escapeHtml(item.number)}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.text)}</p>
      </div>
    </article>
  `
}

function renderCollectionCard(item) {
  return `
    <article class="collection-card">
      <a href="/collections/${attr(item.slug)}">
        <img class="mono-media" src="${attr(item.coverImage)}" width="760" height="920" loading="lazy" decoding="async" alt="${attr(item.coverAlt)}">
        <div>
          <p>${escapeHtml(item.season)}</p>
          <h3>${escapeHtml(item.title)}</h3>
          <span>${escapeHtml(item.intro)}</span>
        </div>
      </a>
    </article>
  `
}

function renderShopSection(content, products) {
  return `
    <section id="shop" class="section collection" aria-labelledby="shop-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Shop</p>
          <h2 id="shop-title">Minimal catalog, maximal signal.</h2>
        </div>
        <a class="text-link" href="/shop">Open full shop</a>
      </div>
      <div class="shop-tools" aria-label="Filter produk">
        <div class="category-row" role="list">
          ${content.categories.map((category, index) => `
            <button class="filter-button" type="button" data-filter="${attr(category.toLowerCase())}" ${index === 0 ? 'aria-pressed="true"' : 'aria-pressed="false"'}>${escapeHtml(category)}</button>
          `).join('')}
        </div>
        <label class="search-box">
          <span>Search</span>
          <input type="search" data-product-search placeholder="Coat, bag, jewelry" autocomplete="off">
        </label>
      </div>
      <div class="filter-bar" aria-label="Informasi koleksi">
        <span>Palette: black, white, graphite, ivory</span>
        <span>Sort: signature edit</span>
        <span>${products.length} shown</span>
      </div>
      <div class="product-grid" data-product-grid>${products.map(renderProductCard).join('')}</div>
    </section>
  `
}

function renderProductCard(item) {
  return `
    <article class="product-card" data-category="${attr(item.category.toLowerCase())}" data-title="${attr(`${item.title} ${item.line} ${item.description}`.toLowerCase())}">
      <a href="/shop/${attr(item.slug)}" aria-label="Lihat ${attr(item.title)}">
        <img class="mono-media" src="${attr(item.images[0])}" width="640" height="720" loading="lazy" decoding="async" alt="${attr(item.alt)}">
      </a>
      <div class="product-meta">
        <p>${escapeHtml(item.line)}</p>
        <h3><a href="/shop/${attr(item.slug)}">${escapeHtml(item.title)}</a></h3>
        <span>${escapeHtml(item.price)}</span>
        <small>${escapeHtml(item.status)}</small>
      </div>
    </article>
  `
}

function renderCodeSection(content) {
  return `
    <section id="code" class="section code-section" aria-labelledby="code-title">
      <div class="code-visual">
        <img class="mono-media" src="${attr(content.code.image)}" width="640" height="720" loading="lazy" decoding="async" alt="${attr(content.code.alt)}">
        <div class="code-symbol" aria-hidden="true"><span></span></div>
      </div>
      <div class="code-copy">
        <p class="eyebrow">${escapeHtml(content.code.eyebrow)}</p>
        <h2 id="code-title">${escapeHtml(content.code.title)}</h2>
        <p>${escapeHtml(content.code.text)}</p>
        <a class="text-link" href="/collections">Find the code in the edit</a>
      </div>
    </section>
  `
}

function renderMaisonSection(content) {
  return `
    <section id="maison" class="section maison" aria-labelledby="maison-title">
      <div class="maison-intro">
        <div>
          <p class="eyebrow">Maison</p>
          <h2 id="maison-title">A strong craft and vision.</h2>
        </div>
        <p>MAISON RAVA is a fictional maison for this project: editorial enough to feel rare, operational enough to run inside a small container, and clear enough for a client to shop without friction.</p>
      </div>
      <div class="timeline" aria-label="Timeline maison">
        ${content.timeline.map((item) => `
          <article>
            <span>${escapeHtml(item.year)}</span>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.text)}</p>
          </article>
        `).join('')}
      </div>
    </section>
  `
}

function renderAtelierSection(content) {
  return `
    <section id="atelier" class="section atelier" aria-labelledby="atelier-title">
      <div class="atelier-copy">
        <p class="eyebrow">Atelier system</p>
        <h2 id="atelier-title">Editorial feel, operationally lean.</h2>
        <p>Konten halaman dibaca dari file JSON dan gambar bisa diatur lewat admin panel. Frontend tetap ringan: tanpa CDN, tanpa tracker, dan tanpa framework browser berat.</p>
      </div>
      <dl class="metric-grid" aria-label="Target performa">
        ${content.metrics.map((item) => `<div><dt>${escapeHtml(item.value)}</dt><dd>${escapeHtml(item.label)}</dd></div>`).join('')}
      </dl>
    </section>
  `
}

function renderEditorialPreview(items) {
  return `
    <section id="editorial" class="section journal" aria-labelledby="journal-title">
      <div class="section-heading">
        <p class="eyebrow">Editorial</p>
        <h2 id="journal-title">Quiet releases, clear signals.</h2>
        <a class="text-link" href="/editorial">All editorial</a>
      </div>
      <div class="journal-list">${items.map(renderEditorialCard).join('')}</div>
    </section>
  `
}

function renderJournalPreview(items) {
  return renderEditorialPreview(items)
}

function renderEditorialCard(item) {
  return `
    <article>
      <a href="/editorial/${attr(item.slug)}">
        <img class="mono-media" src="${attr(item.image)}" width="640" height="420" loading="lazy" decoding="async" alt="${attr(item.alt)}">
        <p>${escapeHtml(item.type)}</p>
        <h3>${escapeHtml(item.title)}</h3>
        <span>${escapeHtml(item.summary)}</span>
      </a>
    </article>
  `
}

function renderJournalCard(item) {
  return renderEditorialCard(item)
}

function renderAppointment(content) {
  return `
    <section id="appointment" class="section appointment" aria-labelledby="appointment-title">
      <div>
        <p class="eyebrow">${escapeHtml(content.appointment.eyebrow)}</p>
        <h2 id="appointment-title">${escapeHtml(content.appointment.title)}</h2>
        <p>${escapeHtml(content.appointment.text)}</p>
      </div>
      <div class="hero-actions">
        <a class="button primary" href="${attr(inquiryHref(content, 'Private fitting'))}">${escapeHtml(content.appointment.label)}</a>
        ${content.site.whatsapp ? `<a class="button secondary dark" href="${attr(whatsappHref(content, 'Private fitting'))}">WhatsApp</a>` : ''}
      </div>
    </section>
  `
}

function renderBoutiquePreview(content) {
  return `
    <section id="visit" class="section visit" aria-labelledby="visit-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Boutiques</p>
          <h2 id="visit-title">Private rooms by appointment.</h2>
        </div>
        <a class="text-link" href="/boutiques">All boutiques</a>
      </div>
      <div class="boutique-list">${content.boutiques.slice(0, 3).map(renderBoutiqueCard).join('')}</div>
    </section>
  `
}

function renderBoutiqueCard(item) {
  return `
    <article>
      <img class="mono-media" src="${attr(item.image)}" width="640" height="420" loading="lazy" decoding="async" alt="${attr(item.alt)}">
      <p>${escapeHtml(item.city)}</p>
      <h3>${escapeHtml(item.title)}</h3>
      <address>${escapeLines(item.address)}<br>${escapeLines(item.hours)}<br>${escapeHtml(item.email)}</address>
    </article>
  `
}

function renderNewsletter(content) {
  return `
    <section class="section newsletter" aria-labelledby="newsletter-title">
      <div>
        <p class="eyebrow">${escapeHtml(content.newsletter.eyebrow)}</p>
        <h2 id="newsletter-title">${escapeHtml(content.newsletter.title)}</h2>
        <p>${escapeHtml(content.newsletter.text)}</p>
      </div>
      <form class="newsletter-form" data-newsletter-form>
        <input type="email" name="email" placeholder="client@example.com" aria-label="Email" required>
        <button class="button primary" type="submit">${escapeHtml(content.newsletter.label)}</button>
        <p class="form-message" data-newsletter-message></p>
      </form>
    </section>
  `
}

function renderMagazineSection(section, index) {
  return `
    <article class="magazine-section ${index % 2 ? 'reverse' : ''}">
      <img class="mono-media" src="${attr(section.image)}" width="760" height="920" loading="lazy" decoding="async" alt="${attr(section.alt)}">
      <div>
        <p class="eyebrow">Chapter ${index + 1}</p>
        <h2>${escapeHtml(section.title)}</h2>
        <p>${escapeHtml(section.text)}</p>
      </div>
    </article>
  `
}

function renderMediaManager(content, csrf) {
  return `
    <article class="admin-card">
      <h2>Media Library</h2>
      <form method="post" action="/admin/media/upload" enctype="multipart/form-data" class="admin-form">
        ${csrf}
        ${input('alt', 'Alt text', '')}
        <label>Image file
          <input type="file" name="file" accept="image/png,image/jpeg,image/webp,image/gif" required>
        </label>
        <button class="button primary" type="submit">Upload image</button>
      </form>
      <div class="media-grid">
        ${content.media.map((item) => `
          <figure class="media-item">
            <img class="mono-media" src="${attr(item.src)}" width="220" height="160" loading="lazy" decoding="async" alt="${attr(item.alt)}">
            <figcaption><strong>${escapeHtml(item.alt || item.id)}</strong><code>${escapeHtml(item.src)}</code></figcaption>
            ${item.builtin ? '<span class="pill">Built in</span>' : `<form method="post" action="/admin/media/${attr(item.id)}/delete">${csrf}<button class="button danger" type="submit">Delete</button></form>`}
          </figure>
        `).join('')}
      </div>
    </article>
  `
}

function campaignForm(item, content, csrf, isNew = false) {
  const action = isNew ? '/admin/campaigns' : `/admin/campaigns/${attr(item.slug)}`
  return `
    <form method="post" action="${action}" class="admin-form editor-card">
      ${csrf}
      <h3>${isNew ? 'Add campaign' : escapeHtml(item.title)}</h3>
      ${input('slug', 'Slug', item.slug)}
      ${input('number', 'Number', item.number)}
      ${input('title', 'Title', item.title)}
      ${textarea('text', 'Text', item.text)}
      ${selectImage('image', 'Image', item.image, content)}
      ${input('alt', 'Alt text', item.alt)}
      ${formActions(isNew, 'Add', 'Save', `/admin/campaigns/${attr(item.slug)}/delete`)}
    </form>
  `
}

function collectionForm(item, content, csrf, isNew = false) {
  const action = isNew ? '/admin/collections' : `/admin/collections/${attr(item.slug)}`
  return `
    <form method="post" action="${action}" class="admin-form editor-card">
      ${csrf}
      <h3>${isNew ? 'Add collection' : escapeHtml(item.title)}</h3>
      ${input('slug', 'Slug', item.slug)}
      ${input('title', 'Title', item.title)}
      ${input('season', 'Season', item.season)}
      ${textarea('intro', 'Intro', item.intro)}
      ${selectImage('coverImage', 'Cover image', item.coverImage, content)}
      ${input('coverAlt', 'Cover alt', item.coverAlt)}
      ${textarea('productSlugs', 'Product slugs, comma separated', item.productSlugs.join(', '))}
      ${textarea('sectionsText', 'Magazine sections, one per line: Title | Text | Image | Alt', sectionsToText(item.sections))}
      ${formActions(isNew, 'Add', 'Save', `/admin/collections/${attr(item.slug)}/delete`)}
    </form>
  `
}

function productForm(item, content, csrf, isNew = false) {
  const action = isNew ? '/admin/products' : `/admin/products/${attr(item.slug)}`
  return `
    <form method="post" action="${action}" class="admin-form editor-card">
      ${csrf}
      <h3>${isNew ? 'Add product' : escapeHtml(item.title)}</h3>
      ${input('slug', 'Slug', item.slug)}
      ${input('title', 'Title', item.title)}
      ${input('category', 'Category', item.category)}
      ${selectCollection('collectionSlug', 'Collection', item.collectionSlug, content)}
      ${input('line', 'Line', item.line)}
      ${textarea('description', 'Description', item.description)}
      ${input('price', 'Price', item.price)}
      ${input('status', 'Status', item.status)}
      ${selectImage('image1', 'Image 1', item.images[0] || '', content)}
      ${selectImage('image2', 'Image 2', item.images[1] || '', content)}
      ${selectImage('image3', 'Image 3', item.images[2] || '', content)}
      ${input('alt', 'Alt text', item.alt)}
      ${textarea('specsText', 'Specs, one per line: Label: Value', specsToText(item.specs))}
      ${textarea('relatedSlugs', 'Related product slugs, comma separated', item.relatedSlugs.join(', '))}
      ${formActions(isNew, 'Add', 'Save', `/admin/products/${attr(item.slug)}/delete`)}
    </form>
  `
}

function journalForm(item, content, csrf, isNew = false) {
  const action = isNew ? '/admin/journal' : `/admin/journal/${attr(item.slug)}`
  return `
    <form method="post" action="${action}" class="admin-form editor-card">
      ${csrf}
      <h3>${isNew ? 'Add journal' : escapeHtml(item.title)}</h3>
      ${input('slug', 'Slug', item.slug)}
      ${input('type', 'Type', item.type)}
      ${input('title', 'Title', item.title)}
      ${textarea('summary', 'Summary', item.summary)}
      ${textarea('body', 'Body', item.body)}
      ${selectImage('image', 'Image', item.image, content)}
      ${input('alt', 'Alt text', item.alt)}
      ${formActions(isNew, 'Add', 'Save', `/admin/journal/${attr(item.slug)}/delete`)}
    </form>
  `
}

function boutiqueForm(item, content, csrf, isNew = false) {
  const action = isNew ? '/admin/boutiques' : `/admin/boutiques/${attr(item.slug)}`
  return `
    <form method="post" action="${action}" class="admin-form editor-card">
      ${csrf}
      <h3>${isNew ? 'Add boutique' : escapeHtml(item.title)}</h3>
      ${input('slug', 'Slug', item.slug)}
      ${input('city', 'City', item.city)}
      ${input('title', 'Title', item.title)}
      ${textarea('address', 'Address', item.address)}
      ${input('hours', 'Hours', item.hours)}
      ${input('email', 'Email', item.email)}
      ${selectImage('image', 'Image', item.image, content)}
      ${input('alt', 'Alt text', item.alt)}
      ${formActions(isNew, 'Add', 'Save', `/admin/boutiques/${attr(item.slug)}/delete`)}
    </form>
  `
}

function formActions(isNew, addLabel, saveLabel, deleteAction) {
  return `
    <div class="form-actions">
      <button class="button primary" type="submit">${isNew ? addLabel : saveLabel}</button>
      ${isNew ? '' : `<button class="button danger" type="submit" formaction="${deleteAction}">Delete</button>`}
    </div>
  `
}

function featuredBySlug(items = [], slugs = [], limit = 4) {
  const picked = Array.isArray(slugs)
    ? slugs.map((slug) => findBySlug(items, slug)).filter(Boolean)
    : []
  const rest = items.filter((item) => !picked.some((pickedItem) => pickedItem.slug === item.slug))
  return [...picked, ...rest].slice(0, limit)
}

function filterProducts(products = [], query = {}) {
  const q = String(query.q || '').trim().toLowerCase()
  const category = String(query.category || 'all').trim().toLowerCase()
  const collection = String(query.collection || '').trim().toLowerCase()
  const min = Number(query.min || 0)
  const max = Number(query.max || Number.MAX_SAFE_INTEGER)
  const sort = String(query.sort || 'newest')

  return products
    .filter((product) => category === 'all' || !category || product.category.toLowerCase() === category)
    .filter((product) => !collection || product.collectionSlug.toLowerCase() === collection)
    .filter((product) => !q || searchText(product).includes(q))
    .filter((product) => Number(product.priceValue || 0) >= min && Number(product.priceValue || 0) <= max)
    .sort((a, b) => {
      if (sort === 'price-low') return Number(a.priceValue || 0) - Number(b.priceValue || 0) || a.title.localeCompare(b.title)
      if (sort === 'price-high') return Number(b.priceValue || 0) - Number(a.priceValue || 0) || a.title.localeCompare(b.title)
      return String(b.createdAt || '').localeCompare(String(a.createdAt || '')) || a.title.localeCompare(b.title)
    })
}

function renderEmptyState(title, text, href = '') {
  return `
    <div class="empty-state">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(text)}</p>
      ${href ? `<a class="button secondary dark" href="${attr(href)}">Continue</a>` : ''}
    </div>
  `
}

function renderLoadingState(label) {
  return `<div class="loading-state"><span></span><p>${escapeHtml(label)}</p></div>`
}

function formField(name, label, type, placeholder) {
  return `<label>${escapeHtml(label)}<input name="${attr(name)}" type="${attr(type)}" placeholder="${attr(placeholder)}" required></label>`
}

function renderInvoiceCard(order) {
  const totals = order.totals || {}
  return `
    <article class="invoice-card">
      <p class="eyebrow">Invoice</p>
      <h1>${escapeHtml(order.invoiceId || order.id)}</h1>
      <p class="status-line">Status: <strong>${escapeHtml(order.status || 'pending')}</strong></p>
      <dl class="spec-list">
        <div><dt>Email</dt><dd>${escapeHtml(order.email || order.customer?.email || '')}</dd></div>
        <div><dt>Payment</dt><dd>${escapeHtml(order.paymentMethod || '')}</dd></div>
        <div><dt>Total</dt><dd>${escapeHtml(formatMoney(totals.total || 0, totals.currency || 'EUR'))}</dd></div>
      </dl>
      <div class="invoice-items">
        ${(order.items || []).map((item) => `
          <div>
            <span>${escapeHtml(item.title)}</span>
            <small>${escapeHtml(item.quantity)} x ${escapeHtml(formatMoney(item.unitPrice || 0, totals.currency || 'EUR'))}</small>
          </div>
        `).join('')}
      </div>
      <div class="payment-methods">
        <span>QRIS</span>
        <span>Bank Transfer</span>
        <span>E-Wallet</span>
      </div>
      <a class="button primary" href="/order-status">Check status</a>
    </article>
  `
}

function formatMoney(value, currency = 'EUR') {
  return `${currency} ${Number(value || 0).toLocaleString('en-US')}`
}

function renderDocument({ title, description, body, scripts = [], ogImage = '/assets/hero-atelier.jpg' }) {
  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <meta name="description" content="${attr(description)}">
    <meta name="theme-color" content="#f7f7f3">
    <meta property="og:title" content="${attr(title)}">
    <meta property="og:description" content="${attr(description)}">
    <meta property="og:image" content="${attr(ogImage)}">
    <meta property="og:type" content="website">
    <title>${escapeHtml(title)}</title>
    <link rel="manifest" href="/site.webmanifest">
    <link rel="preload" as="image" href="${attr(ogImage)}" fetchpriority="high">
    <link rel="stylesheet" href="/styles.css">
  </head>
    <body data-template="${attr(templateProfile.id)}">
    ${body}
    ${scripts.map((src) => `<script src="${attr(src)}" defer></script>`).join('')}
  </body>
</html>`
}

function renderHeader(content) {
  const nav = [
    ['Collections', '/collections'],
    ['Shop', '/shop'],
    ['Editorial', '/editorial'],
    ['Maison', '/maison'],
    ['Search', '/search']
  ]

  return `
    <header class="site-header" aria-label="Navigasi utama">
      <a class="brand" href="/" aria-label="${attr(content.site.brand)} beranda">
        <span class="brand-mark" aria-hidden="true">${escapeHtml(content.site.mark)}</span>
        <span>${escapeHtml(content.site.brand)}</span>
      </a>
      <nav class="desktop-nav" aria-label="Menu utama">${nav.map(([label, href]) => `<a href="${attr(href)}">${escapeHtml(label)}</a>`).join('')}</nav>
      <a class="header-cta" href="/cart">Cart</a>
    </header>
  `
}

function renderFooter(content) {
  return `
    <footer class="site-footer">
      <p>${escapeHtml(content.site.brand)}</p>
      <nav aria-label="Footer">
        <a href="/collections">Collections</a>
        <a href="/shop">Shop</a>
        <a href="/editorial">Editorial</a>
        <a href="/maison">Maison</a>
        <a href="/order-status">Order status</a>
        <a href="/admin">Admin</a>
        <a href="/api/health">Health</a>
      </nav>
    </footer>
  `
}

function csrfInput(token) {
  return `<input type="hidden" name="_csrf" value="${attr(token)}">`
}

function input(name, label, value) {
  return `<label>${escapeHtml(label)}<input name="${attr(name)}" value="${attr(value)}"></label>`
}

function textarea(name, label, value) {
  return `<label>${escapeHtml(label)}<textarea name="${attr(name)}" rows="4">${escapeHtml(value)}</textarea></label>`
}

function selectImage(name, label, value, content) {
  const options = content.media.map((item) => option(item.src, item.alt || item.id, value)).join('')
  const selectedExists = content.media.some((item) => item.src === value)
  return `
    <label>${escapeHtml(label)}
      <select name="${attr(name)}">
        ${value ? option('', 'None', value) : option('', 'None', '')}
        ${selectedExists || !value ? '' : option(value, value, value)}
        ${options}
      </select>
    </label>
  `
}

function selectCollection(name, label, value, content) {
  const options = content.collections.map((item) => option(item.slug, item.title, value)).join('')
  return `<label>${escapeHtml(label)}<select name="${attr(name)}">${option('', 'None', value)}${options}</select></label>`
}

function option(value, label, selected) {
  return `<option value="${attr(value)}" ${value === selected ? 'selected' : ''}>${escapeHtml(label)}${value ? ` - ${escapeHtml(value)}` : ''}</option>`
}

function inquiryHref(content, subject) {
  return `mailto:${attr(content.appointment.email)}?subject=${attr(encodeURIComponent(`${content.appointment.subject}: ${subject}`))}`
}

function whatsappHref(content, subject) {
  const raw = String(content.site.whatsapp || '').trim()
  const text = encodeURIComponent(`Halo, saya ingin inquiry MAISON RAVA: ${subject}`)
  if (raw.startsWith('http://') || raw.startsWith('https://')) return `${raw}${raw.includes('?') ? '&' : '?'}text=${text}`
  const phone = raw.replace(/[^0-9]/g, '')
  return `https://wa.me/${phone}?text=${text}`
}

function findBySlug(items, slug) {
  return items.find((item) => item.slug === slug || item.id === slug)
}

function searchText(item) {
  return Object.values(item)
    .filter((value) => typeof value === 'string' || typeof value === 'number')
    .join(' ')
    .toLowerCase()
}

function specsToText(specs = []) {
  return specs.map((spec) => `${spec.label}: ${spec.value}`).join('\n')
}

function sectionsToText(sections = []) {
  return sections.map((section) => `${section.title} | ${section.text} | ${section.image} | ${section.alt}`).join('\n')
}

function escapeLines(value) {
  return escapeHtml(value).replace(/\r?\n/g, '<br>')
}

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function attr(value = '') {
  return escapeHtml(value)
}
