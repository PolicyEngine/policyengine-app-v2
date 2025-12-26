import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// Determine which app to build based on VITE_APP_MODE env var
// All dev/build scripts must explicitly set this variable
const appMode = process.env.VITE_APP_MODE;

// Port configuration - automatically discovered by scripts/dev-server.mjs
// Falls back to defaults if not set (e.g., during build)
const websitePort = parseInt(process.env.WEBSITE_PORT || '3000', 10);
const calculatorPort = parseInt(process.env.CALCULATOR_PORT || '3001', 10);

// Derive URLs from ports - allows explicit override via VITE_*_URL env vars
const websiteUrl = process.env.VITE_WEBSITE_URL || `http://localhost:${websitePort}`;
const calculatorUrl = process.env.VITE_CALCULATOR_URL || `http://localhost:${calculatorPort}`;

// Validate for dev/build; skip for tests (vitest loads this config but doesn't use appMode)
if (!process.env.VITEST && (!appMode || !['website', 'calculator'].includes(appMode))) {
  throw new Error(
    `VITE_APP_MODE must be "website" or "calculator". Got: "${appMode}"\n` +
      'Use npm scripts: dev:website, dev:calculator, build:website, build:calculator'
  );
}

function getHtmlFile() {
  return appMode === 'calculator' ? 'calculator.html' : 'website.html';
}

function getInputConfig() {
  return { main: resolve(__dirname, getHtmlFile()) };
}

/**
 * SPA fallback plugin for dev server.
 *
 * In production, vercel.json handles rewrites (e.g., "/(.*)" -> "/website.html").
 * Vite's dev server doesn't read vercel.json, so this plugin replicates that behavior.
 *
 * TODO: Remove this plugin when website and calculator are split into separate repos,
 * each with their own index.html and standard Vite SPA config.
 */
function spaFallbackPlugin() {
  const htmlFile = getHtmlFile();

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

export default defineConfig({
  plugins: [react(), tsconfigPaths(), spaFallbackPlugin()],
  base: process.env.BASE_URL || '/',
  server: {
    port: appMode === 'calculator' ? calculatorPort : websitePort,
    strictPort: true,
  },
  define: {
    // Expose VITE_APP_MODE and derived URLs to client-side code
    'import.meta.env.VITE_APP_MODE': JSON.stringify(appMode),
    'import.meta.env.VITE_WEBSITE_URL': JSON.stringify(websiteUrl),
    'import.meta.env.VITE_CALCULATOR_URL': JSON.stringify(calculatorUrl),
  },
  // Use separate cache directories for website and calculator to avoid conflicts
  cacheDir: `node_modules/.vite-${appMode || 'default'}`,
  optimizeDeps: {
    // Force pre-bundle ESM-only packages that cause issues
    include: ['wordwrapjs'],
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
