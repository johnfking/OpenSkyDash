const { app } = require('@azure/functions')
const pJson = require('../../../package.json')

const startedAt = Date.now()

function getUptime() {
  const seconds = Math.floor((Date.now() - startedAt) / 1000)
  const d = Math.floor(seconds / (3600 * 24))
  const h = Math.floor((seconds % (3600 * 24)) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  return `${d}d ${h}h ${m}m ${s}s`
}

app.http('health', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'health',
  handler: async () => ({
    jsonBody: {
      status: 'ok',
      version: pJson.version,
      uptime: getUptime(),
      timestamp: new Date().toLocaleTimeString(),
    },
  }),
})
