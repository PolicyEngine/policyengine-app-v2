import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';

// Determine which app to build based on VITE_APP_MODE env var
// Default to website for backwards compatibility with 'npm run dev'
const appMode = process.env.VITE_APP_MODE || 'website';

function getInputConfig() {
  switch (appMode) {
    case 'calculator':
      return { main: resolve(__dirname, 'calculator.html') };
    case 'website':
    default:
      return { main: resolve(__dirname, 'website.html') };
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
