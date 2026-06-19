const { app } = require('@azure/functions')

app.http('kc2g-point-prediction', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'kc2g/point-prediction',
  handler: async (request) => {
    const grid = request.query.get('grid')

    if (!grid) {
      return {
        status: 400,
        jsonBody: { error: 'Missing grid query parameter' },
      }
    }

    const targetUrl = `https://prop.kc2g.com/api/point_prediction.json?grid=${encodeURIComponent(grid)}`

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'SkyDash-Azure/1.0',
        },
      })

      if (!response.ok) {
        throw new Error(`KC2G responded with ${response.status}`)
      }

      return {
        headers: {
          'Cache-Control': 'public, max-age=900',
        },
        jsonBody: await response.json(),
      }
    } catch (error) {
      return {
        status: 500,
        jsonBody: { error: 'Failed to fetch solar data' },
      }
    }
  },
})
