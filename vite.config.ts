/// <reference types="vitest" />
import * as path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    define: {
      global: 'globalThis',
      'process.env': env,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        buffer: 'buffer',
      },
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
        },
      },
    },
    server: {
      port: 3001,
      proxy: {
        '/api/hoodi': {
          target: env.VITE_HOODI_API_URL,
          changeOrigin: true,
          secure: true,
        },
        '/api/mainnet': {
          target: env.VITE_MAINNET_API_URL,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/mainnet/, '/api'),
        },
      },
    },
    test: {
      root: path.resolve(__dirname, './src'),
    },
  }
});
