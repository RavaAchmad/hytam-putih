import { app } from '../../src/server.js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function handler(request) {
  return app.fetch(request)
}

export {
  handler as DELETE,
  handler as GET,
  handler as HEAD,
  handler as OPTIONS,
  handler as PATCH,
  handler as POST,
  handler as PUT
}
