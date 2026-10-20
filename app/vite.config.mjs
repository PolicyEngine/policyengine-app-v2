import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// Vite only serves Storybook (and Chromatic) and Vitest here. The calculator
// deploys from calculator-app/ (Next.js) and the website from website/.
export default defineConfig({
  plugins: [tailwindcss(), react(), tsconfigPaths()],
  optimizeDeps: {
    // Force pre-bundle ESM-only packages that cause issues
    include: ['wordwrapjs'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.mjs',
  },
});
