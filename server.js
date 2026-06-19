import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import p_json from './package.json' with { type: 'json' }

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const port = process.env.PORT || 5050

app.use(cors())

async function handleBlitzJs(req, res) {
  try {
    const response = await fetch('https://www.blitzortung.org/en/JS/live_lightning_maps.js')

    if (!response.ok) {
      return res.status(response.status).send('Blitzortung site is down or blocking the Pi.')
    }

    const data = await response.text()

    res.set('Content-Type', 'application/javascript')
    res.send(data)
  } catch (error) {
    res.status(500).send('Proxy failed to reach Blitzortung')
  }
}

app.get('/blitz-js', handleBlitzJs)
app.get('/api/blitz-js', handleBlitzJs)

app.use(express.static(path.join(__dirname, 'dist')))

function getUptime() {
  const seconds = process.uptime()
  const d = Math.floor(seconds / (3600 * 24))
  const h = Math.floor((seconds % (3600 * 24)) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  return `${d}d ${h}h ${m}m ${s}s`
}

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    version: p_json.version,
    uptime: getUptime(),
    timestamp: new Date().toLocaleTimeString(),
  })
})

async function handleKc2gPointPrediction(req, res) {
  const { grid } = req.query
  // Note the "prop." added to the URL below
  const targetUrl = `https://prop.kc2g.com/api/point_prediction.json?grid=${grid}`

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'SkyDash-Pi/1.0',
      },
    })

    if (!response.ok) throw new Error(`KC2G responded with ${response.status}`)

    const data = await response.json()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch solar data' })
  }
}

app.get('/api-kc2g/api/point_prediction.json', handleKc2gPointPrediction)
app.get('/api/kc2g/point-prediction', handleKc2gPointPrediction)

app.get(/^(?!\/(api|blitz-js|api-kc2g)).+/, (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html')

  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(404).send('Dashboard build files (dist) not found. Check your build process.')
  }
})

// Leave out the host string entirely, or use '0.0.0.0'
app.listen(port, '0.0.0.0', () => {
  console.log('SkyDash running and accessible on local network port 5050')
})
