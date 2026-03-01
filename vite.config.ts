/// <reference types="vitest" />
import * as path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import { execSync } from 'child_process'

let commitHash = 'unknown'
let lastUpdate = 'unknown'

try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
  lastUpdate = execSync('git log -1 --format=%cd --date=iso-local').toString().trim();
  lastUpdate = new Date(lastUpdate).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
} catch (e) {
  console.warn('Unable to determine git info');
}

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [
      createHtmlPlugin({
        inject: {
          data: {
            VITE_GA_MEASUREMENT_ID: env.VITE_GA_MEASUREMENT_ID || '',
          }
        },
      }),
      react(),
      tailwindcss(),
    ],
    define: {
      global: 'globalThis',
      'process.env': env,
      __COMMIT_HASH__: JSON.stringify(commitHash),
      __LAST_UPDATE__: JSON.stringify(lastUpdate),
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
        },
      },
    },
    test: {
      root: path.resolve(__dirname, './src'),
    },
  }
});
