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
      'https://5stqritz6i.eu.loclx.io',
      '5stqritz6i.eu.loclx.io',
      'https://4f7ac415f262.ngrok-free.app',
      '98caeef2f37c.ngrok-free.app',
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
