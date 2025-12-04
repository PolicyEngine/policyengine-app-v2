import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';

// Determine which app to build based on VITE_APP_MODE env var
const appMode = process.env.VITE_APP_MODE || 'combined';

function getInputConfig() {
  switch (appMode) {
    case 'calculator':
      return { main: resolve(__dirname, 'calculator.html') };
    case 'website':
      return { main: resolve(__dirname, 'website.html') };
    default:
      // Combined mode - build all (for development/testing)
      return {
        main: resolve(__dirname, 'index.html'),
        calculator: resolve(__dirname, 'calculator.html'),
        website: resolve(__dirname, 'website.html'),
      };
  }
}

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  base: process.env.BASE_URL || '/',
  define: {
    // Expose VITE_APP_MODE to client-side code
    'import.meta.env.VITE_APP_MODE': JSON.stringify(appMode),
  },
  build: {
    rollupOptions: {
      input: getInputConfig(),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.mjs',
  },
});
