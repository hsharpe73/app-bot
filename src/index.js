import React from 'react';
import ReactDOM from 'react-dom/client';
import ChatBot from './components/ChatBot';
import VersionChecker from './components/VersionChecker';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <>
    <VersionChecker />
    <ChatBot />
  </>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        console.log('✅ Service Worker registrado con éxito:', registration);

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // Hay una nueva versión disponible
                console.log('🚨 Nueva versión disponible, avisar desde VersionChecker');
                window.dispatchEvent(new Event('new-version-available'));
              }
            }
          };
        };
      })
      .catch(error => {
        console.error('❌ Falló el registro del Service Worker:', error);
      });
  });
}
