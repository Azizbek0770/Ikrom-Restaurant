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
    port: 3002,
    host: true,
    allowedHosts: [
      '679b0f6d4fbd.ngrok-free.app',
      'localhost', // Allow localhost
    ]
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});