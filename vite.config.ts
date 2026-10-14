import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        // Split heavy third-party libs into long-cacheable vendor chunks.
        // Screens are split separately via React.lazy in App.tsx.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('/scheduler/')) return 'vendor-react';
          if (id.includes('/@firebase/auth') || id.includes('/firebase/auth')) return 'vendor-firebase-auth';
          if (id.includes('/@firebase/') || id.includes('/firebase/')) return 'vendor-firebase';
          if (id.includes('/@supabase/')) return 'vendor-supabase';
          if (id.includes('/lucide-react/')) return 'vendor-icons';
        },
      },
    },
  },
});
