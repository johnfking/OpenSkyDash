const { app } = require('@azure/functions')

app.http('blitz-js', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'blitz-js',
  handler: async () => {
    try {
      const response = await fetch('https://www.blitzortung.org/en/JS/live_lightning_maps.js')

      if (!response.ok) {
        return {
          status: response.status,
          body: 'Blitzortung site is down or blocking the request.',
        }
      }

      return {
        headers: {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
        },
        body: await response.text(),
      }
    } catch (error) {
      return {
        status: 500,
        body: 'Proxy failed to reach Blitzortung',
      }
    }
  },
})
