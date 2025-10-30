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
      'https://jy7udglarq.eu.loclx.io',
      'jy7udglarq.eu.loclx.io',
      'https://0a2ed997fab2.ngrok-free.app',
      '0a2ed997fab2.ngrok-free.app',
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
