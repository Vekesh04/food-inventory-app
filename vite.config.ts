import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      external: []
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react']
  },
  server: {
    host: true,
    port: 5173
  },
  resolve: {
    alias: {
      // Add any aliases if needed
    }
  }
});