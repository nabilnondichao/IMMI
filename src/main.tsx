import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SWRConfig } from 'swr';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

// Supprimer l'ancienne clé auth personnalisée si elle existe
// (évite le conflit de lock avec la clé Supabase par défaut)
try {
  localStorage.removeItem('immoafrik-auth');
  // Nettoyer toutes les clés dupliquées liées à Supabase auth sauf la clé officielle
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('immoafrik-auth')) localStorage.removeItem(key);
  });
} catch { /* ignore si localStorage non accessible */ }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SWRConfig value={{
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000,
      errorRetryCount: 2,
    }}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </SWRConfig>
  </StrictMode>,
);
