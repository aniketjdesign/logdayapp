import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import zipy from 'zipyai'; 
import { setupKeepAlive } from './utils/keepAlive';

zipy.init('7129b133');

// Setup keep-alive functionality
setupKeepAlive();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);