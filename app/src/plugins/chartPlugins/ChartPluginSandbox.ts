/**
 * Chart Plugin Sandbox
 *
 * Provides secure execution of chart plugin code in an iframe sandbox.
 * The plugin code runs in isolation and can only communicate via postMessage.
 *
 * Architecture:
 * 1. Main app sends plugin code + report data to sandbox iframe
 * 2. Sandbox executes code with a mock Plotly that captures chart data
 * 3. Sandbox sends captured Plotly data back to main app
 * 4. Main app renders the chart natively with real Plotly
 *
 * This approach ensures:
 * - Plugin code cannot access DOM, localStorage, cookies, etc.
 * - Plugin code cannot make network requests
 * - Plugin code cannot access parent window
 * - Errors in plugin code don't crash the main app
 */

import type { ReportOutput } from './types';

/**
 * Result of rendering a chart plugin.
 */
export interface ChartRenderResult {
  success: boolean;
  error?: string;
  /** Plotly trace data */
  data?: unknown[];
  /** Plotly layout */
  layout?: unknown;
  /** Plotly config */
  config?: unknown;
}

/**
 * The HTML content for the sandbox iframe.
 * This creates an isolated execution environment.
 */
const SANDBOX_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval';">
</head>
<body>
<script>
// Captured Plotly data
let capturedData = null;
let capturedLayout = null;
let capturedConfig = null;

// Mock Plotly object that captures data instead of rendering
const Plotly = {
  newPlot: function(container, data, layout, config) {
    capturedData = data;
    capturedLayout = layout || {};
    capturedConfig = config || {};
    return Promise.resolve();
  },
  react: function(container, data, layout, config) {
    capturedData = data;
    capturedLayout = layout || {};
    capturedConfig = config || {};
    return Promise.resolve();
  },
  // Mock other Plotly methods that might be called
  relayout: function() { return Promise.resolve(); },
  restyle: function() { return Promise.resolve(); },
  update: function() { return Promise.resolve(); },
  purge: function() {},
  d3: {
    format: function(fmt) {
      return function(val) {
        // Basic formats
        if (fmt === ',.0f') return Math.round(val).toLocaleString();
        if (fmt === '.0f') return Math.round(val).toString();
        if (fmt === '.1f') return val.toFixed(1);
        if (fmt === '.2f') return val.toFixed(2);
        if (fmt === '.3f') return val.toFixed(3);
        if (fmt === '.4f') return val.toFixed(4);
        // Signed formats
        if (fmt === '+.2f') return (val >= 0 ? '+' : '') + val.toFixed(2);
        if (fmt === '+.3f') return (val >= 0 ? '+' : '') + val.toFixed(3);
        if (fmt === '+.4f') return (val >= 0 ? '+' : '') + val.toFixed(4);
        // Percentage formats
        if (fmt === '.1%') return (val * 100).toFixed(1) + '%';
        if (fmt === '.2%') return (val * 100).toFixed(2) + '%';
        if (fmt === '+.1%') return (val >= 0 ? '+' : '') + (val * 100).toFixed(1) + '%';
        if (fmt === '+.2%') return (val >= 0 ? '+' : '') + (val * 100).toFixed(2) + '%';
        // Currency formats
        if (fmt === '$,.0f') return '$' + Math.round(val).toLocaleString();
        if (fmt === '$,.2f') return '$' + val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        return String(val);
      };
    }
  }
};

// Mock container element
const mockContainer = {
  id: 'chart-container',
  style: {},
  clientWidth: 800,
  clientHeight: 600,
  offsetWidth: 800,
  offsetHeight: 600,
  getBoundingClientRect: function() {
    return { width: 800, height: 600, top: 0, left: 0, right: 800, bottom: 600 };
  }
};

// Listen for render requests
window.addEventListener('message', async function(event) {
  const { type, pluginId, code, output, countryId } = event.data || {};

  if (type !== 'render') return;

  // Reset captured data
  capturedData = null;
  capturedLayout = null;
  capturedConfig = null;

  try {
    // Create a function from the plugin code
    // The code should export a 'render' function
    const moduleCode = code + '\\n;if(typeof render === "function"){render({output:__output__,countryId:__countryId__,container:__container__,Plotly:__Plotly__});}else if(typeof module!=="undefined"&&module.exports&&typeof module.exports.render==="function"){module.exports.render({output:__output__,countryId:__countryId__,container:__container__,Plotly:__Plotly__});}';

    // Create safe execution context
    const safeEval = new Function(
      '__output__',
      '__countryId__',
      '__container__',
      '__Plotly__',
      'module',
      moduleCode
    );

    // Execute with provided data
    const module = { exports: {} };
    await safeEval(output, countryId, mockContainer, Plotly, module);

    // Send back the captured data
    parent.postMessage({
      type: 'render_complete',
      pluginId: pluginId,
      data: capturedData,
      layout: capturedLayout,
      config: capturedConfig
    }, '*');

  } catch (error) {
    parent.postMessage({
      type: 'render_error',
      pluginId: pluginId,
      error: error.message || String(error)
    }, '*');
  }
});

// Signal that sandbox is ready
parent.postMessage({ type: 'sandbox_ready' }, '*');
</script>
</body>
</html>
`;

/**
 * Chart Plugin Sandbox manages secure execution of plugin code.
 */
export class ChartPluginSandbox {
  private iframe: HTMLIFrameElement | null = null;
  private ready = false;
  private readyPromise: Promise<void>;
  private resolveReady!: () => void;
  private pendingRenders = new Map<
    string,
    { resolve: (result: ChartRenderResult) => void; timeout: ReturnType<typeof setTimeout> }
  >();

  constructor() {
    this.readyPromise = new Promise((resolve) => {
      this.resolveReady = resolve;
    });
    this.createIframe();
  }

  /**
   * Create the sandbox iframe.
   */
  private createIframe(): void {
    // Create iframe
    this.iframe = document.createElement('iframe');
    this.iframe.style.display = 'none';
    this.iframe.sandbox.add('allow-scripts');
    // Do NOT add allow-same-origin - this ensures true isolation

    // Listen for messages from iframe
    window.addEventListener('message', this.handleMessage);

    // Create blob URL for iframe content
    const blob = new Blob([SANDBOX_HTML], { type: 'text/html' });
    this.iframe.src = URL.createObjectURL(blob);

    // Add to document
    document.body.appendChild(this.iframe);
  }

  /**
   * Handle messages from the sandbox iframe.
   */
  private handleMessage = (event: MessageEvent): void => {
    const { type, pluginId, data, layout, config, error } = event.data || {};

    if (type === 'sandbox_ready') {
      this.ready = true;
      this.resolveReady();
      return;
    }

    if (type === 'render_complete' || type === 'render_error') {
      const pending = this.pendingRenders.get(pluginId);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRenders.delete(pluginId);

        if (type === 'render_error') {
          pending.resolve({
            success: false,
            error: error || 'Unknown render error',
          });
        } else {
          pending.resolve({
            success: true,
            data,
            layout,
            config,
          });
        }
      }
    }
  };

  /**
   * Wait for the sandbox to be ready.
   */
  async waitForReady(): Promise<void> {
    return this.readyPromise;
  }

  /**
   * Execute plugin code and return chart data.
   *
   * @param pluginId Unique identifier for this render
   * @param code The plugin JavaScript code
   * @param output The report output data
   * @param countryId The country ID ('us' or 'uk')
   * @param timeoutMs Timeout in milliseconds (default: 10000)
   */
  async render(
    pluginId: string,
    code: string,
    output: ReportOutput,
    countryId: string,
    timeoutMs: number = 10000
  ): Promise<ChartRenderResult> {
    // Wait for sandbox to be ready
    await this.waitForReady();

    if (!this.iframe?.contentWindow) {
      return {
        success: false,
        error: 'Sandbox iframe not available',
      };
    }

    return new Promise((resolve) => {
      // Set up timeout
      const timeout = setTimeout(() => {
        this.pendingRenders.delete(pluginId);
        resolve({
          success: false,
          error: 'Plugin render timed out',
        });
      }, timeoutMs);

      // Store pending render
      this.pendingRenders.set(pluginId, { resolve, timeout });

      // Send render request to sandbox
      this.iframe!.contentWindow!.postMessage(
        {
          type: 'render',
          pluginId,
          code,
          output,
          countryId,
        },
        '*'
      );
    });
  }

  /**
   * Destroy the sandbox and clean up resources.
   */
  destroy(): void {
    window.removeEventListener('message', this.handleMessage);

    // Clear all pending renders
    for (const [, pending] of this.pendingRenders) {
      clearTimeout(pending.timeout);
      pending.resolve({
        success: false,
        error: 'Sandbox destroyed',
      });
    }
    this.pendingRenders.clear();

    // Remove iframe
    if (this.iframe) {
      URL.revokeObjectURL(this.iframe.src);
      this.iframe.remove();
      this.iframe = null;
    }

    this.ready = false;
  }
}

/**
 * Global sandbox instance.
 * Lazily initialized when first needed.
 */
let globalSandbox: ChartPluginSandbox | null = null;

export function getChartPluginSandbox(): ChartPluginSandbox {
  if (!globalSandbox) {
    globalSandbox = new ChartPluginSandbox();
  }
  return globalSandbox;
}

export function destroyChartPluginSandbox(): void {
  if (globalSandbox) {
    globalSandbox.destroy();
    globalSandbox = null;
  }
}
