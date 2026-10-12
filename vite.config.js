import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const configDir = path.dirname(fileURLToPath(import.meta.url))
const marketingDist = path.resolve(configDir, 'marketing', 'dist')
const marketingRoots = new Set([
  'app-para-cobradores',
  'calculadora-prestamos',
  'contacto',
  'gestion-cartera-prestamos',
  'latam',
  'precios',
  'recursos',
  'seguridad',
  'sistema-de-cobranza',
  'software-para-financieras',
  'software-para-prestamistas',
])

function marketingStaticPages() {
  const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
  }

  return {
    name: 'bonexa-marketing-static-pages',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url || '/', 'http://localhost').pathname
        const relative = pathname.replace(/^\/+|\/+$/g, '')
        const firstSegment = relative.split('/')[0]
        const isMarketingAsset = relative === 'marketing-assets' || relative.startsWith('marketing-assets/')
        const isEnglishMarketingPage = firstSegment === 'en'
        const isMarketingPage = isEnglishMarketingPage || marketingRoots.has(firstSegment)

        if (!isMarketingAsset && !isMarketingPage) {
          next()
          return
        }

        const candidate = isMarketingAsset
          ? path.resolve(marketingDist, relative)
          : path.resolve(marketingDist, relative, 'index.html')
        if (!candidate.startsWith(`${marketingDist}${path.sep}`) || !fs.existsSync(candidate)) {
          next()
          return
        }

        const extension = path.extname(candidate).toLowerCase()
        response.statusCode = 200
        response.setHeader('Content-Type', contentTypes[extension] || 'text/html; charset=utf-8')
        response.end(fs.readFileSync(candidate))
      })
    },
  }
}

function getApiPort() {
  const portFile = path.resolve(configDir, '.api-port')
  try {
    return parseInt(fs.readFileSync(portFile, 'utf8').trim()) || 5000
  } catch {
    return 5000
  }
}

export default defineConfig({
  plugins: [marketingStaticPages(), react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      ignored: ['**/backend/**'],
    },
    proxy: {
      '/api': {
        target: `http://localhost:${getApiPort()}`,
        changeOrigin: true,
      },
    },
    allowedHosts: ['swarm-wrecker-register.ngrok-free.dev', '.ngrok-free.dev'],
  },
})
