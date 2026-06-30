import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function getApiPort() {
  const portFile = path.resolve(__dirname, '.api-port')
  try {
    return parseInt(fs.readFileSync(portFile, 'utf8').trim()) || 5000
  } catch {
    return 5000
  }
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    watch: {
      ignored: ['**/backend/**'],
    },
    proxy: {
      '/api': {
        target: `https://localhost:${getApiPort()}`,
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts: ['swarm-wrecker-register.ngrok-free.dev', '.ngrok-free.dev'],
  },
})
