import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    watch: {
      ignored: ['**/backend/**'],
    },
    proxy: {
      '/api': {
        target: 'https://localhost:53906',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
