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
      'https://desktop-s15n8v0.tailb44327.ts.net',
      'https://679b0f6d4fbd.ngrok-free.app',
      'desktop-s15n8v0.tailb44327.ts.net',
      'https://desktop-s15n8v0.tailb44327.ts.net',
      'https://679b0f6d4fbd.ngrok-free.app',
      'legal-otters-like.loca.lt',
      'https://legal-otters-like.loca.lt',
      'many-moles-take.loca.lt',
      'https://many-moles-take.loca.lt',
      'bright-humans-lose.loca.lt',
      'https://bright-humans-lose.loca.lt',
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
