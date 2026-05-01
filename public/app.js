const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' })
const cartKey = 'maison-rava-cart'
const adminKey = 'maison-rava-admin-token'

const productGrid = document.querySelector('[data-product-grid]')
const filterButtons = [...document.querySelectorAll('[data-filter]')]
const productSearch = document.querySelector('[data-product-search]')

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(cartKey) || '[]')
  } catch {
    return []
  }
}

function writeCart(items) {
  localStorage.setItem(cartKey, JSON.stringify(items))
  renderCartSurfaces()
}

function addToCart(product) {
  const items = readCart()
  const current = items.find((item) => item.slug === product.slug && item.size === product.size)
  if (current) current.quantity += 1
  else items.push({ ...product, quantity: 1 })
  writeCart(items)
}

function updateProducts() {
  if (!productGrid) return
  const active = filterButtons.find((button) => button.getAttribute('aria-pressed') === 'true')?.dataset.filter || 'all'
  const query = (productSearch?.value || '').trim().toLowerCase()

  for (const card of productGrid.querySelectorAll('.product-card')) {
    const matchesCategory = active === 'all' || card.dataset.category === active
    const matchesText = !query || (card.dataset.title || '').includes(query)
    card.hidden = !(matchesCategory && matchesText)
  }
}

for (const button of filterButtons) {
  button.addEventListener('click', () => {
    for (const current of filterButtons) current.setAttribute('aria-pressed', 'false')
    button.setAttribute('aria-pressed', 'true')
    updateProducts()
  })
}

productSearch?.addEventListener('input', updateProducts)
updateProducts()

document.querySelector('[data-add-cart]')?.addEventListener('click', (event) => {
  const button = event.currentTarget
  const size = document.querySelector('[data-size-select]')?.value || 'One size'
  addToCart({
    slug: button.dataset.slug,
    title: button.dataset.title,
    price: Number(button.dataset.price || 0),
    image: button.dataset.image,
    size
  })
  button.textContent = 'Added'
  setTimeout(() => {
    button.textContent = 'Add to cart'
  }, 1200)
})

function renderCartSurfaces() {
  const items = readCart()
  const cartItems = document.querySelector('[data-cart-items]')
  const cartSummary = document.querySelector('[data-cart-summary]')
  const checkoutSummary = document.querySelector('[data-checkout-summary]')
  const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0)
  const shipping = subtotal > 0 ? 35 : 0
  const total = subtotal + shipping

  if (cartItems) {
    cartItems.innerHTML = items.length ? items.map((item, index) => `
      <article class="cart-row">
        <img class="mono-media" src="${escapeAttr(item.image)}" alt="" width="110" height="130">
        <div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.size || 'One size')}</p>
          <span>${money.format(item.price || 0)}</span>
        </div>
        <label>Qty<input data-cart-qty="${index}" type="number" min="1" max="99" value="${item.quantity || 1}"></label>
        <button class="button danger" type="button" data-cart-remove="${index}">Remove</button>
      </article>
    `).join('') : emptyState('Cart is empty.', 'Add a piece from the shop before checkout.')
  }

  const summary = `
    <dl class="summary-lines">
      <div><dt>Subtotal</dt><dd>${money.format(subtotal)}</dd></div>
      <div><dt>Shipping</dt><dd>${money.format(shipping)}</dd></div>
      <div><dt>Total</dt><dd>${money.format(total)}</dd></div>
    </dl>
  `
  if (cartSummary) cartSummary.innerHTML = summary
  if (checkoutSummary) checkoutSummary.innerHTML = items.length ? summary : emptyState('Cart is empty.', 'Return to shop before creating an invoice.')

  document.querySelectorAll('[data-cart-qty]').forEach((input) => {
    input.addEventListener('change', () => {
      const next = readCart()
      next[Number(input.dataset.cartQty)].quantity = Math.max(1, Number(input.value || 1))
      writeCart(next)
    })
  })

  document.querySelectorAll('[data-cart-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      const next = readCart()
      next.splice(Number(button.dataset.cartRemove), 1)
      writeCart(next)
    })
  })
}

renderCartSurfaces()

document.querySelector('[data-checkout-form]')?.addEventListener('submit', async (event) => {
  event.preventDefault()
  const form = event.currentTarget
  const message = document.querySelector('[data-checkout-message]')
  const cart = readCart()
  if (!cart.length) {
    message.textContent = 'Cart is empty.'
    return
  }

  const data = Object.fromEntries(new FormData(form).entries())
  const payload = {
    customer: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      country: data.country,
      address: data.address
    },
    paymentMethod: data.paymentMethod,
    items: cart.map((item) => ({ slug: item.slug, quantity: item.quantity || 1 }))
  }

  message.textContent = 'Creating invoice...'
  const result = await api('/api/orders', { method: 'POST', body: JSON.stringify(payload) })
  if (!result.ok) {
    message.textContent = result.error.message
    return
  }
  localStorage.removeItem(cartKey)
  location.href = `/invoice/${encodeURIComponent(result.data.order.invoiceId)}`
})

document.querySelector('[data-order-status-form]')?.addEventListener('submit', async (event) => {
  event.preventDefault()
  const form = event.currentTarget
  const data = Object.fromEntries(new FormData(form).entries())
  const target = document.querySelector('[data-order-status-result]')
  target.innerHTML = '<p class="muted">Checking...</p>'
  const result = await api(`/api/orders/${encodeURIComponent(data.orderId)}?email=${encodeURIComponent(data.email)}`)
  if (!result.ok) {
    target.innerHTML = emptyState('Invoice not found.', result.error.message)
    return
  }
  target.innerHTML = invoiceSummary(result.data.order)
})

document.querySelector('[data-newsletter-form]')?.addEventListener('submit', async (event) => {
  event.preventDefault()
  const form = event.currentTarget
  const message = form.querySelector('[data-newsletter-message]')
  const email = new FormData(form).get('email')
  const result = await api('/api/newsletter', {
    method: 'POST',
    body: JSON.stringify({ email, source: location.pathname })
  })
  message.textContent = result.ok ? 'Subscribed.' : result.error.message
  if (result.ok) form.reset()
})

function invoiceSummary(order) {
  return `
    <p class="eyebrow">Invoice</p>
    <h3>${escapeHtml(order.invoiceId)}</h3>
    <dl class="summary-lines">
      <div><dt>Status</dt><dd>${escapeHtml(order.status)}</dd></div>
      <div><dt>Payment</dt><dd>${escapeHtml(order.paymentMethod)}</dd></div>
      <div><dt>Total</dt><dd>${money.format(order.totals.total || 0)}</dd></div>
    </dl>
  `
}

const adminApp = document.querySelector('[data-admin-app]')
if (adminApp) initAdmin()

function initAdmin() {
  const login = document.querySelector('[data-admin-login]')
  const consolePanel = document.querySelector('[data-admin-console]')
  const panel = document.querySelector('[data-admin-panel]')
  const tabs = [...document.querySelectorAll('[data-admin-tab]')]
  let active = 'dashboard'

  document.querySelector('[data-admin-login-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault()
    const token = new FormData(event.currentTarget).get('token')
    const result = await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ token }) })
    const message = document.querySelector('[data-admin-login-message]')
    if (!result.ok) {
      message.textContent = result.error.message
      return
    }
    localStorage.setItem(adminKey, token)
    showAdmin()
  })

  document.querySelector('[data-admin-logout]')?.addEventListener('click', () => {
    localStorage.removeItem(adminKey)
    location.reload()
  })

  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      active = tab.dataset.adminTab
      for (const current of tabs) current.setAttribute('aria-pressed', String(current === tab))
      loadAdminPanel(active)
    })
  }

  if (localStorage.getItem(adminKey)) showAdmin()

  function showAdmin() {
    login.hidden = true
    consolePanel.hidden = false
    loadAdminPanel(active)
  }

  async function loadAdminPanel(tab) {
    panel.innerHTML = '<div class="loading-state"><span></span><p>Loading</p></div>'
    if (tab === 'dashboard') {
      const stats = await adminApi('/api/admin/stats')
      panel.innerHTML = stats.ok ? adminStats(stats.data) : emptyState('Cannot load stats.', stats.error.message)
      return
    }
    if (tab === 'orders') {
      const orders = await adminApi('/api/admin/orders')
      panel.innerHTML = orders.ok ? adminTable('Orders', orders.data.items, ['invoiceId', 'email', 'status', 'paymentMethod']) : emptyState('Cannot load orders.', orders.error.message)
      return
    }
    if (tab === 'settings') {
      const site = await adminApi('/api/admin/site')
      const homepage = await adminApi('/api/admin/homepage')
      panel.innerHTML = site.ok && homepage.ok ? settingsPanel(site.data, homepage.data) : emptyState('Cannot load settings.', 'Check admin token.')
      bindJsonEditor('/api/admin/site', '[data-site-json]')
      bindJsonEditor('/api/admin/homepage', '[data-homepage-json]')
      return
    }

    const endpoint = `/api/admin/${tab}`
    const result = await adminApi(endpoint)
    panel.innerHTML = result.ok ? crudPanel(tab, endpoint, result.data.items) : emptyState(`Cannot load ${tab}.`, result.error.message)
    bindCrud(endpoint)
  }
}

function adminStats(data) {
  return `
    <div class="metric-grid admin-metrics">
      ${Object.entries(data).map(([key, value]) => `<div><dt>${escapeHtml(value)}</dt><dd>${escapeHtml(key)}</dd></div>`).join('')}
    </div>
  `
}

function adminTable(title, rows, keys) {
  return `
    <section class="admin-card">
      <h2>${escapeHtml(title)}</h2>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr>${keys.map((key) => `<th>${escapeHtml(key)}</th>`).join('')}</tr></thead>
          <tbody>${rows.map((row) => `<tr>${keys.map((key) => `<td>${escapeHtml(row[key] || row.customer?.[key] || '')}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      </div>
    </section>
  `
}

function crudPanel(name, endpoint, items) {
  return `
    <section class="admin-card">
      <div class="admin-section-head"><h2>${escapeHtml(name)}</h2><span>${items.length} items</span></div>
      <p class="muted">Edit JSON langsung untuk prototype. Semua input tetap divalidasi oleh API.</p>
      <form data-crud-create="${endpoint}" class="admin-form">
        <label>New item JSON<textarea rows="12" spellcheck="false">${escapeHtml(JSON.stringify(sampleFor(name), null, 2))}</textarea></label>
        <button class="button primary" type="submit">Create</button>
        <p class="form-message"></p>
      </form>
      <div class="editor-list">
        ${items.map((item) => `
          <form data-crud-update="${endpoint}/${encodeURIComponent(item.id || item.slug)}" class="admin-form editor-card">
            <h3>${escapeHtml(item.title || item.invoiceId || item.slug)}</h3>
            <textarea rows="14" spellcheck="false">${escapeHtml(JSON.stringify(item, null, 2))}</textarea>
            <div class="form-actions">
              <button class="button primary" type="submit">Save</button>
              <button class="button danger" type="button" data-crud-delete="${endpoint}/${encodeURIComponent(item.id || item.slug)}">Delete</button>
            </div>
            <p class="form-message"></p>
          </form>
        `).join('')}
      </div>
    </section>
  `
}

function settingsPanel(site, homepage) {
  return `
    <section class="admin-grid">
      <article class="admin-card">
        <h2>Site settings</h2>
        <form data-json-patch="/api/admin/site" class="admin-form">
          <textarea data-site-json rows="22" spellcheck="false">${escapeHtml(JSON.stringify(site, null, 2))}</textarea>
          <button class="button primary" type="submit">Save site</button>
          <p class="form-message"></p>
        </form>
      </article>
      <article class="admin-card">
        <h2>Homepage</h2>
        <form data-json-patch="/api/admin/homepage" class="admin-form">
          <textarea data-homepage-json rows="22" spellcheck="false">${escapeHtml(JSON.stringify(homepage, null, 2))}</textarea>
          <button class="button primary" type="submit">Save homepage</button>
          <p class="form-message"></p>
        </form>
      </article>
    </section>
  `
}

function bindCrud() {
  document.querySelectorAll('[data-crud-create], [data-crud-update]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault()
      const endpoint = form.dataset.crudCreate || form.dataset.crudUpdate
      const method = form.dataset.crudCreate ? 'POST' : 'PATCH'
      const message = form.querySelector('.form-message')
      const body = readTextareaJson(form.querySelector('textarea'), message)
      if (!body) return
      const result = await adminApi(endpoint, { method, body: JSON.stringify(body) })
      message.textContent = result.ok ? 'Saved.' : result.error.message
    })
  })

  document.querySelectorAll('[data-crud-delete]').forEach((button) => {
    button.addEventListener('click', async () => {
      const result = await adminApi(button.dataset.crudDelete, { method: 'DELETE' })
      button.closest('form').querySelector('.form-message').textContent = result.ok ? 'Deleted. Refresh tab.' : result.error.message
    })
  })
}

function bindJsonEditor() {
  document.querySelectorAll('[data-json-patch]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault()
      const message = form.querySelector('.form-message')
      const body = readTextareaJson(form.querySelector('textarea'), message)
      if (!body) return
      const result = await adminApi(form.dataset.jsonPatch, { method: 'PATCH', body: JSON.stringify(body) })
      message.textContent = result.ok ? 'Saved.' : result.error.message
    })
  })
}

function readTextareaJson(textarea, message) {
  try {
    return JSON.parse(textarea.value)
  } catch {
    message.textContent = 'JSON is invalid.'
    return null
  }
}

function sampleFor(name) {
  if (name === 'products') {
    return { title: 'New RAVA Piece', category: 'Objects', collectionSlug: '', line: 'Object', description: 'Describe the piece.', priceValue: 1000, images: ['/assets/hero-atelier.jpg'] }
  }
  if (name === 'collections') {
    return { title: 'New Collection', season: 'Season', intro: 'Collection intro.', productSlugs: [], sections: [] }
  }
  return { title: 'New Editorial', type: 'Editorial', summary: 'Short summary.', body: 'Article body.', image: '/assets/hero-atelier.jpg' }
}

async function adminApi(url, options = {}) {
  return api(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      authorization: `Bearer ${localStorage.getItem(adminKey) || ''}`
    }
  })
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {})
    }
  })
  return response.json().catch(() => ({
    ok: false,
    error: { message: `Request failed with status ${response.status}` }
  }))
}

function emptyState(title, text) {
  return `<div class="empty-state"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></div>`
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttr(value = '') {
  return escapeHtml(value)
}
