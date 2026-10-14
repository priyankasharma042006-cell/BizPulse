import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';

const REQUIRED_ENV = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

function ErrorBoundaryMessage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md bg-white border-4 border-black p-6 text-center">
        <h1 className="font-black uppercase text-xl mb-2">Could not load the app</h1>
        <p className="text-sm mb-4">Check your connection, then reload.</p>
        <button onClick={() => window.location.reload()} className="border-2 border-black px-4 py-2 font-bold uppercase text-xs">Reload</button>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
const missing = REQUIRED_ENV.filter((k) => !import.meta.env[k]);

if (missing.length > 0) {
  // Without these, Firebase/Supabase throw at import time and the page is blank.
  console.error('Missing environment variables:', missing.join(', '));
  root.render(
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md bg-white border-4 border-black p-6">
        <h1 className="font-black uppercase text-xl mb-2">App not configured</h1>
        <p className="text-sm mb-2">These environment variables were missing when the app was built:</p>
        <ul className="text-xs font-mono list-disc pl-5">{missing.map((m) => <li key={m}>{m}</li>)}</ul>
        <p className="text-sm mt-3">Create a <code>.env</code> file (see <code>.env.example</code>) and rebuild.</p>
      </div>
    </div>
  );
} else {
  // App (and therefore Firebase + Supabase) loads as its own chunk after the env check.
  import('./App').then(({ default: App }) => {
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>
    );
  }).catch((e) => {
    console.error('Failed to load app:', e);
    root.render(<ErrorBoundaryMessage />);
  });
}
