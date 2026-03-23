import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { exec } from 'child_process'
import { promisify } from 'util'
import { readFile } from 'fs/promises'
import { join } from 'path'

const execAsync = promisify(exec)

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

              const parts = sequence.map(s =>
                s.type === 'position' ? `p${s.id}` : `t${s.id}`
              )
              const spec = parts.join(',')

              const rootDir = join(__dirname, '..')
              const scriptPath = join(rootDir, 'scripts', 'extract-sequence.js')
              const cmd = `node "${scriptPath}" "${spec}"`

              await execAsync(cmd, { cwd: rootDir })

              const sequenceData = await readFile(
                join(__dirname, 'src', 'sequence.json'),
                'utf8'
              )

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
            const rootDir = join(__dirname, '..')
            const scriptPath = join(rootDir, 'scripts', 'extract-sequence.js')
            const cmd = `node "${scriptPath}" search "${query}"`

            const { stdout } = await execAsync(cmd, { cwd: rootDir })

            const lines = stdout.split('\n').filter(l => l.includes(':'))
            const results = lines.map(line => {
              const match = line.match(/(position|transition)\s+(\d+):\s*"([^"]+)"/)
              if (match) {
                return {
                  type: match[1],
                  id: parseInt(match[2]),
                  name: match[3]
                }
              }
              return null
            }).filter(Boolean)

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
