import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      '@core': '/src/core',
      '@utils': '/src/utils',
    },
  },
  server: {
    hmr: {
      clientPort: 5173,
      port: 5173,
    },
  },
});
