import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/zaki/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'Zaki – Liefer Tour',
        short_name: 'Zaki',
        description: 'Professionelle Liefer-Tour App für Fahrer',
        theme_color: '#1a56db',
        background_color: '#f0f2f5',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'de',
        icons: [
          {
            src: 'icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
});
