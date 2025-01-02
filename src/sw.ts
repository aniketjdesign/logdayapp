/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

declare let self: ServiceWorkerGlobalScope

// Don't skip waiting by default to allow update notification
// self.skipWaiting()
clientsClaim()

// Clean up old caches
cleanupOutdatedCaches()

// Handle updates
self.addEventListener('install', (event) => {
  // Don't skip waiting here to allow update notification
  event.waitUntil(Promise.resolve())
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

// Listen for message to skip waiting
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Precache all assets
precacheAndRoute(self.__WB_MANIFEST)
