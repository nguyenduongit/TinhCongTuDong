import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client-react';
import { GoogleOAuthProvider } from '@react-oauth/google';

import App from './App';

import './index.css';

// Khi chạy local, API server chạy ở cổng 3001
// Khi deploy trên Replit, API và web cùng domain nên setBaseUrl không cần thiết
if (import.meta.env.DEV) {
  setBaseUrl('http://localhost:3001');
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
);

