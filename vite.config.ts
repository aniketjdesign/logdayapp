import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Check if running in StackBlitz
const isStackBlitz = process.env.SHELL?.includes('webcontainer');

export default defineConfig({
  plugins: [
    react(),
    // Only enable PWA in production or non-StackBlitz environments
    !isStackBlitz && VitePWA({
      registerType: 'prompt',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,vue,txt,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      },
      devOptions: {
        enabled: true,
        type: 'module'
      },
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Logday - Workout Tracker',
        short_name: 'Logday',
        description: 'Never skip log day - Track your workouts',
        theme_color: '#2463EB',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['fitness', 'health', 'lifestyle'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'apple touch icon'
          }
        ],
        screenshots: [
          {
            src: 'screenshot1.png',
            sizes: '1170x2532',
            type: 'image/png',
            platform: 'narrow',
            label: 'Homescreen of Logday App'
          }
        ]
      }
    })
  ].filter(Boolean),
  optimizeDeps: {
    exclude: ['lucide-react']
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom']
        }
      }
    }
  }
});