import path from 'path';
import { fileURLToPath } from 'url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: path.resolve(rootDir, 'client'),
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: '@lark-apaas/client-toolkit/logger',
        replacement: path.resolve(
          rootDir,
          'client/src/lib/logger.ts',
        ),
      },
      {
        find: '@client',
        replacement: path.resolve(rootDir, 'client'),
      },
      {
        find: '@shared',
        replacement: path.resolve(rootDir, 'shared'),
      },
      {
        find: '@',
        replacement: path.resolve(rootDir, 'client/src'),
      },
    ],
  },
  build: {
    outDir: path.resolve(rootDir, 'dist/client'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8787',
      '/media': 'http://127.0.0.1:8787',
    },
  },
});
