import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import {
  buildSequencePayloadFromGrappleMapText,
} from '../scripts/grapplemap-sequence-core.js'

const grapplemapTextPath = join(__dirname, '..', 'GrappleMap.txt')
const previewSequencePath = join(__dirname, 'src', 'sequence.json')

function sequenceExtractorPlugin() {
  return {
    name: 'sequence-extractor',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/extract' && req.method === 'POST') {
          let body = ''
          req.on('data', chunk => body += chunk)
          req.on('end', async () => {
            try {
              const { sequence } = JSON.parse(body)
              const grapplemapText = await readFile(grapplemapTextPath, 'utf8')
              const payload = buildSequencePayloadFromGrappleMapText('custom', grapplemapText, sequence)
              const sequenceData = JSON.stringify(payload, null, 2)

              await writeFile(previewSequencePath, sequenceData, 'utf8')

              res.setHeader('Content-Type', 'application/json')
              res.end(sequenceData)
            } catch (err) {
              console.error('Extraction failed:', err)
              res.statusCode = 500
              res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }

        if (req.url.startsWith('/api/search')) {
          const url = new URL(req.url, `http://localhost`)
          const query = url.searchParams.get('q')

          if (!query) {
            res.statusCode = 400
            res.end('Missing query')
            return
          }

          try {
            const { loadGraph } = await import('../scripts/grapplemap-loader.js')
            const graph = loadGraph(grapplemapTextPath)
            const results = graph.findByName(query).slice(0, 20).map(result => ({
              type: result.type,
              id: result.id,
              name: result.name,
            }))

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(results))
          } catch (err) {
            console.error('Search failed:', err)
            res.statusCode = 500
            res.end(JSON.stringify({ error: err.message }))
          }
          return
        }

        if (req.url === '/sequence.json') {
          try {
            const sequenceData = await readFile(
              join(__dirname, 'src', 'sequence.json'),
              'utf8'
            )
            res.setHeader('Content-Type', 'application/json')
            res.end(sequenceData)
          } catch (err) {
            res.statusCode = 404
            res.end(JSON.stringify({ error: 'sequence.json not found' }))
          }
          return
        }

        next()
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), sequenceExtractorPlugin()],
  server: {
    port: 5173,
    open: true
  }
})
