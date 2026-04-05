import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import { AuthProvider } from './context/AuthContext';

const isExtensionNoise = (text) => {
  const value = String(text || '');
  return (
    value.includes('chrome-extension://') ||
    value.toLowerCase().includes('metamask')
  );
};

window.addEventListener(
  'error',
  (event) => {
    if (isExtensionNoise(event.filename) || isExtensionNoise(event.message)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },
  true
);

window.addEventListener(
  'unhandledrejection',
  (event) => {
    const reasonMessage =
      event.reason?.stack ||
      event.reason?.message ||
      event.reason;

    if (isExtensionNoise(reasonMessage)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },
  true
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
