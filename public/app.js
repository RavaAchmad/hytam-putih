const productGrid = document.querySelector('[data-product-grid]')
const filterButtons = [...document.querySelectorAll('[data-filter]')]
const productSearch = document.querySelector('[data-product-search]')

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
