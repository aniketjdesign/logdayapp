import { useEffect, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'
import { Analytics } from '../services/analytics'

export function useAppUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)
  const [updateSW, setUpdateSW] = useState<(() => Promise<void>) | undefined>()

  useEffect(() => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('New version available!')
        setNeedRefresh(true)
      },
      onOfflineReady() {
        setOfflineReady(true)
      },
      onRegisteredSW(swUrl, registration) {
        // Check for updates every minute
        setInterval(() => {
          registration?.update()
        }, 60 * 1000)
      }
    })
    setUpdateSW(() => updateSW)
  }, [])

  const updateApp = async () => {
    if (updateSW) {
      try {
        // Send message to skip waiting
        const registration = await navigator.serviceWorker.ready
        if (registration.waiting) {
          registration.waiting.postMessage('SKIP_WAITING')
        }
        
        await updateSW()
        Analytics.appUpdated({
          fromVersion: import.meta.env.VITE_APP_VERSION || 'unknown',
          toVersion: 'latest'
        })
        
        // Force reload after a short delay
        setTimeout(() => {
          window.location.reload()
        }, 100)
      } catch (err) {
        console.error('Failed to update:', err)
      }
    }
  }

  return {
    needRefresh,
    offlineReady,
    updateApp
  }
}
