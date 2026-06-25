import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

const fetchEventSourcePath = path.resolve(__dirname, 'node_modules/@microsoft/fetch-event-source');
const hasFetchEventSource = fs.existsSync(fetchEventSourcePath);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      ...(hasFetchEventSource ? {} : {
        '@microsoft/fetch-event-source': path.resolve(__dirname, './src/utils/fetch-event-source.ts'),
      }),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
      '/health': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
  },
});
