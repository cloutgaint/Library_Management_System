import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// API calls use relative /api URLs (see src/lib/api.js). In development they are
// proxied to the backend; in production set VITE_API_BASE_URL or serve both
// from the same origin.
const backend = process.env.VITE_DEV_BACKEND_URL || 'http://localhost:5000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': backend,
      '/uploads': backend,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
  },
})
