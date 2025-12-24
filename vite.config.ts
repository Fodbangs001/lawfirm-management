import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5001,
    proxy: {
      '/api': {
        // Try the common dev API ports. Our backend will auto-increment if 3001 is taken.
        target: 'http://localhost:3001',
        changeOrigin: true,
        // Vite will retry the fallback targets if the primary is unavailable.
        // @ts-expect-error - vite accepts this in runtime even if TS types lag behind.
        fallbackTargets: ['http://localhost:3002', 'http://localhost:3003'],
      },
    },
  },
})
