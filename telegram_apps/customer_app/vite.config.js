import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3001,
    host: true,
    allowedHosts: [
      'https://b5ipdakrhm.eu.loclx.io',
      'b5ipdakrhm.eu.loclx.io',
      'https://89ad3978a3f7.ngrok-free.app',
      '89ad3978a3f7.ngrok-free.app',
      'localhost', // Allow localhost
    ]
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});
