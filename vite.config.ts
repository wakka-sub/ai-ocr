import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { configDefaults } from 'vitest/config'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      manifest: {
        name: 'AI OCR App',
        short_name: 'AI OCR',
        start_url: '/',
        display: 'standalone',
        icons: [
          {
            src: 'vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
