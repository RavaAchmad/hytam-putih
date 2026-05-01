import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'

marked.use({
  gfm: true,
  breaks: true
})

const allowedTags = [
  'p',
  'br',
  'strong',
  'em',
  'ul',
  'ol',
  'li',
  'blockquote',
  'a',
  'h2',
  'h3'
]

const allowedAttributes = {
  a: ['href', 'title', 'target', 'rel']
}

export function renderMarkdown(value = '') {
  const raw = marked.parse(String(value || ''))
  return sanitizeHtml(raw, {
    allowedTags,
    allowedAttributes,
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer',
        target: '_blank'
      })
    }
  })
}
