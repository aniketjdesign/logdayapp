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
        setNeedRefresh(true)
      },
      onOfflineReady() {
        setOfflineReady(true)
      }
    })
    setUpdateSW(() => updateSW)
  }, [])

  const update = async () => {
    if (updateSW) {
      try {
        await updateSW()
        Analytics.appUpdated({
          fromVersion: import.meta.env.VITE_APP_VERSION || 'unknown',
          toVersion: 'latest'
        })
        window.location.reload()
      } catch (error) {
        console.error('Failed to update service worker:', error)
        Analytics.error({
          error: 'Failed to update service worker',
          context: 'useAppUpdate.update',
          metadata: { error: String(error) }
        })
      }
    }
  }

  return {
    needRefresh,
    offlineReady,
    updateApp: update
  }
}
