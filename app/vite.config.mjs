import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// The Vite build holds only the calculator; the website is the Next.js app in
// website/. All dev/build scripts must still set VITE_APP_MODE=calculator.
const appMode = process.env.VITE_APP_MODE;

// Port configuration - set by scripts/dev-server.mjs, or by
// website/scripts/dev-server.mjs, which also passes the Next.js website's port.
// Only set during dev server; undefined during tests and builds
const websitePort = process.env.WEBSITE_PORT ? parseInt(process.env.WEBSITE_PORT, 10) : undefined;
const calculatorPort = process.env.CALCULATOR_PORT
  ? parseInt(process.env.CALCULATOR_PORT, 10)
  : undefined;

// Derive URLs from ports only when ports are explicitly set (dev server mode)
// During tests/builds, these remain undefined so constants.ts uses production fallbacks
const websiteUrl = websitePort ? `http://localhost:${websitePort}` : undefined;
const calculatorUrl = calculatorPort ? `http://localhost:${calculatorPort}` : undefined;

// Validate for dev/build; skip for tests (vitest loads this config but doesn't use appMode)
if (!process.env.VITEST && appMode !== 'calculator') {
  throw new Error(
    `VITE_APP_MODE must be "calculator". Got: "${appMode}"\n` +
      'Use npm scripts: dev:calculator, build:calculator'
  );
}

const HTML_FILE = 'calculator.html';

function getInputConfig() {
  return { main: resolve(__dirname, HTML_FILE) };
}

/**
 * SPA fallback plugin for dev server.
 *
 * Serves calculator.html for every client-side route, since the entry is not
 * index.html and Vite's dev server only falls back to index.html.
 */
function spaFallbackPlugin() {
  const htmlFile = HTML_FILE;

  const isStaticAsset = (url) => url.includes('.');
  const isViteInternal = (url) => url.startsWith('/@');
  const isNodeModule = (url) => url.startsWith('/node_modules');
  const isSpaRoute = (url) => !isStaticAsset(url) && !isViteInternal(url) && !isNodeModule(url);

  const middleware = (req, res, next) => {
    if (req.url && isSpaRoute(req.url)) {
      req.url = `/${htmlFile}`;
    }
    next();
  };

  const plugin = {
    name: 'spa-fallback',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
  };

  return plugin;
}

// Build define object - only include URLs when explicitly set (dev server mode)
// This ensures production builds use the fallbacks in constants.ts
const viteDefines = {
  'import.meta.env.VITE_APP_MODE': JSON.stringify(appMode),
};
if (websiteUrl) {
  viteDefines['import.meta.env.VITE_WEBSITE_URL'] = JSON.stringify(websiteUrl);
}
if (calculatorUrl) {
  viteDefines['import.meta.env.VITE_CALCULATOR_URL'] = JSON.stringify(calculatorUrl);
}

export default defineConfig({
  plugins: [tailwindcss(), react(), tsconfigPaths(), spaFallbackPlugin()],
  base: process.env.BASE_URL || '/',
  server: {
    // Use discovered ports in dev, defaults otherwise
    port: calculatorPort ?? 3001,
    strictPort: true,
  },
  define: viteDefines,
  // Separate cache directory per VITE_APP_MODE (tests run without one)
  cacheDir: `node_modules/.vite-${appMode || 'default'}`,
  optimizeDeps: {
    // Force pre-bundle ESM-only packages that cause issues
    include: ['wordwrapjs'],
  },
  build: {
    rollupOptions: {
      input: getInputConfig(),
      output: {
        manualChunks: {
          // Stable vendor chunks — cached separately from app code
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-markdown': [
            'react-markdown',
            'rehype-katex',
            'remark-gfm',
            'remark-math',
            'react-syntax-highlighter',
          ],
          'vendor-motion': ['framer-motion'],
          'vendor-query': ['@tanstack/react-query', '@reduxjs/toolkit', 'react-redux'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.mjs',
  },
});
