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
      'https://714497200ed8.ngrok-free.app',
      '714497200ed8.ngrok-free.app',
      'https://desktop-s15n8v0.tailb44327.ts.net/',
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
