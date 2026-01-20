import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// Determine which app to build based on VITE_APP_MODE env var
// All dev/build scripts must explicitly set this variable
const appMode = process.env.VITE_APP_MODE;

// Port configuration - automatically discovered by scripts/dev-server.mjs
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
  plugins: [react(), tsconfigPaths(), spaFallbackPlugin()],
  base: process.env.BASE_URL || '/',
  server: {
    // Use discovered ports in dev, defaults otherwise
    port: appMode === 'calculator' ? (calculatorPort ?? 3001) : (websitePort ?? 3000),
    strictPort: true,
  },
  define: viteDefines,
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
    testTimeout: 30000, // 30 seconds per test (increased from default 5s)
    hookTimeout: 30000, // 30 seconds for setup/teardown hooks
    pool: 'forks', // Use process forks for better isolation
    poolOptions: {
      forks: {
        singleFork: false, // Use multiple forks for parallelization
        isolate: true, // Isolate each test file
      },
    },
  },
});
