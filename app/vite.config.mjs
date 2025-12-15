import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';

// Determine which app to build based on VITE_APP_MODE env var
// Default to website for backwards compatibility with 'npm run dev'
const appMode = process.env.VITE_APP_MODE || 'website';

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
