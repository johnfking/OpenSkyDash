module.exports = async function (context, req) {
  const grid = req.query.grid

  if (!grid) {
    context.res = {
      status: 400,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({ error: 'Missing grid query parameter' }),
    }
    return
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

    context.res = {
      headers: {
        'Cache-Control': 'public, max-age=900',
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(await response.json()),
    }
  } catch (error) {
    context.res = {
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({ error: 'Failed to fetch solar data' }),
    }
  }
}
