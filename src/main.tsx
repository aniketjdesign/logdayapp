import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import zipy from 'zipyai';
import * as serviceWorkerRegistration from './utils/serviceWorkerRegistration';
import { capacitorService } from './services/capacitor';
import { Capacitor } from '@capacitor/core';

zipy.init('7129b133');

// Initialize Capacitor if running on a native platform
if (Capacitor.isNativePlatform()) {
  capacitorService.initialize().catch(error => {
    console.error('Failed to initialize Capacitor:', error);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// Register service worker
serviceWorkerRegistration.register({
  onSuccess: (registration) => {
    console.log('ServiceWorker registration successful');
  },
  onUpdate: (registration) => {
    // Notify user of update if needed
    console.log('New version available');
  },
});