import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const configDir = path.dirname(fileURLToPath(import.meta.url))

function getApiPort() {
  const portFile = path.resolve(configDir, '.api-port')
  try {
    return parseInt(fs.readFileSync(portFile, 'utf8').trim()) || 5000
  } catch {
    return 5000
  }
}

export default defineConfig({
  plugins: [react()],
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
