const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g

export function renderMarkdown(value = '') {
  const source = String(value || '').replace(/\r\n?/g, '\n').trim()
  if (!source) return ''

  return source
    .split(/\n{2,}/)
    .map((block) => renderBlock(block))
    .filter(Boolean)
    .join('\n')
}

function renderBlock(block) {
  const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
  if (!lines.length) return ''

  const heading = lines.length === 1 ? lines[0].match(/^(#{2,3})\s+(.+)$/) : null
  if (heading) {
    const level = heading[1].length
    return `<h${level}>${renderInline(heading[2])}</h${level}>`
  }

  if (lines.every((line) => /^[-*]\s+/.test(line))) {
    return `<ul>${lines.map((line) => `<li>${renderInline(line.replace(/^[-*]\s+/, ''))}</li>`).join('')}</ul>`
  }

  if (lines.every((line) => /^\d+\.\s+/.test(line))) {
    return `<ol>${lines.map((line) => `<li>${renderInline(line.replace(/^\d+\.\s+/, ''))}</li>`).join('')}</ol>`
  }

  if (lines.every((line) => /^>\s?/.test(line))) {
    return `<blockquote>${lines.map((line) => renderInline(line.replace(/^>\s?/, ''))).join('<br>')}</blockquote>`
  }

  return `<p>${lines.map((line) => renderInline(line)).join('<br>')}</p>`
}

function renderInline(value) {
  const source = String(value || '')
  let html = ''
  let offset = 0

  for (const match of source.matchAll(linkPattern)) {
    html += renderText(source.slice(offset, match.index))
    html += `<a href="${attr(match[2])}" rel="noopener noreferrer" target="_blank">${renderText(match[1])}</a>`
    offset = match.index + match[0].length
  }

  return html + renderText(source.slice(offset))
}

function renderText(value) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
}

function escapeHtml(value = '') {
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
