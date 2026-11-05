import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/Forge/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: { skipWaiting: true, clientsClaim: true, cleanupOutdatedCaches: true },
      includeAssets: ['icon-180.png'],
      manifest: {
        name: 'Forge',
        short_name: 'Forge',
        description: 'Calisthenics workout shuffler',
        theme_color: '#0f0b08',
        background_color: '#0f0b08',
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
