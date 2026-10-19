import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/pwa-192.png'],
      manifest: {
        name: 'Les Échos de la Fracture',
        short_name: 'La Fracture',
        description: 'Une aventure entre plusieurs mondes.',
        theme_color: '#17251d',
        background_color: '#101a15',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/',
        icons: [
          {
            src: '/icons/pwa-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/pwa-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});