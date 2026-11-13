import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { VitePWA } from 'vite-plugin-pwa'

const commit = (() => { try { return execSync('git rev-parse --short HEAD').toString().trim() } catch { return 'dev' } })()

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(commit) },
  base: '/Forge/',
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      workbox: { globPatterns: ['**/*.{js,css,html,png,woff2,woff}'], cleanupOutdatedCaches: true },
      includeAssets: ['icon-180.png'],
      manifest: {
        name: 'Forge',
        short_name: 'Forge',
        description: 'Calisthenics workout shuffler',
        theme_color: '#0e1013',
        background_color: '#0e1013',
        display: 'standalone',
        start_url: '/Forge/',
        scope: '/Forge/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
})
