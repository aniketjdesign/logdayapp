import { useState, useEffect } from 'react';
import { Analytics } from '../services/analytics';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

export const useUpdatePrompt = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setUpdateAvailable(true);
    };

    // Check if service worker is supported
    if ('serviceWorker' in navigator) {
      // Get the registration
      navigator.serviceWorker.ready.then(reg => {
        setRegistration(reg);

        // Immediately check for updates
        reg.update();

        // Check for updates every 15 minutes
        const interval = setInterval(() => {
          reg.update();
        }, 15 * 60 * 1000);

        return () => clearInterval(interval);
      });

      // Listen for new service worker installation
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      // Listen for update found event
      window.addEventListener('sw-update-found', handleUpdate);

      return () => {
        window.removeEventListener('sw-update-found', handleUpdate);
      };
    }
  }, []);

  const updateServiceWorker = async () => {
    if (registration) {
      try {
        await registration.update();
        
        if (registration.waiting) {
          // Send message to service worker to skip waiting
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          
          // Track the update in analytics
          Analytics.appUpdated({
            fromVersion: registration.waiting.scriptURL || 'unknown',
            toVersion: registration.active?.scriptURL || 'new'
          });

          // Force reload after a short delay to ensure the new service worker is active
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } catch (error) {
        console.error('Failed to update service worker:', error);
      }
    }
  };

  return { updateAvailable, updateServiceWorker };
};