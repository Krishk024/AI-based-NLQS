import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AdminApp } from './src/admin/AdminApp';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
const isAdminRoute = window.location.pathname.startsWith('/admin');

root.render(
  <React.StrictMode>
    {isAdminRoute ? <AdminApp /> : <App />}
  </React.StrictMode>
);
