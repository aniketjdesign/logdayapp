/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

declare let self: ServiceWorkerGlobalScope

// Use the Vite-injected manifest
self.skipWaiting()
clientsClaim()

// Clean up old caches
cleanupOutdatedCaches()

// Handle updates
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Take control of all clients immediately
      clients.claim(),
      // Clean up old caches
      cleanupOutdatedCaches()
    ])
  )
})

// Precache all assets
precacheAndRoute(self.__WB_MANIFEST)
