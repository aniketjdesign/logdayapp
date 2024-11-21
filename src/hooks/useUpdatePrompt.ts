import { useState, useEffect } from 'react';

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
      });

      // Listen for new service worker
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
      await registration.update();
      if (registration.waiting) {
        // Send message to service worker to skip waiting
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    }
  };

  return { updateAvailable, updateServiceWorker };
};