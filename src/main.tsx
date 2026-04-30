import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SWRConfig } from 'swr';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

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
