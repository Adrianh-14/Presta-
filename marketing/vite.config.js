import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  publicDir: false,
  plugins: [react()],
  build: {
    outDir: '.build/landing-client',
    emptyOutDir: true,
    rollupOptions: { input: path.resolve('marketing/landing.html') },
  },
});
