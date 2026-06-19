module.exports = async function (context) {
  try {
    const response = await fetch('https://www.blitzortung.org/en/JS/live_lightning_maps.js')

    if (!response.ok) {
      context.res = {
        status: response.status,
        body: 'Blitzortung site is down or blocking the request.',
      }
      return
    }

    context.res = {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
      body: await response.text(),
    }
  } catch (error) {
    context.res = {
      status: 500,
      body: 'Proxy failed to reach Blitzortung',
    }
  }
}
