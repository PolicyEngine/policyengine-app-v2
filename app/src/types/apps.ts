/**
 * Interactive App Type Definitions
 *
 * Defines the schema for apps.json which contains all interactive calculators,
 * visualizations, and embedded applications.
 */

/**
 * App type discriminator
 */
export type AppType = 'streamlit' | 'iframe' | 'custom';

/**
 * Base fields shared by all app types
 */
interface BaseApp {
  /** App slug for URL routing */
  slug: string;

  /** App title for display */
  title: string;

  /** Brief description of the app */
  description: string;

  /** External URL where the app is hosted */
  url: string;

  /** Array of tags (topics and locations) */
  tags: string[];

  /** Country ID (us, uk, etc.) */
  countryId: string;
}

/**
 * Streamlit app with sleep-state handling
 */
export interface StreamlitApp extends BaseApp {
  /** App type discriminator */
  type: 'streamlit';
}

/**
 * Standard iframe embed (no special handling)
 */
export interface IframeApp extends BaseApp {
  /** App type discriminator */
  type: 'iframe';
}

/**
 * Custom app with specialized render logic
 */
export interface CustomApp extends BaseApp {
  /** App type discriminator */
  type: 'custom';

  /** Name of the custom component to render */
  component: string;

  /** Optional: whether this app supports URL parameter synchronization */
  urlSync?: boolean;

  /** Optional: whether this app uses postMessage communication */
  postMessage?: boolean;
}

/**
 * Union type for all app types
 */
export type App = StreamlitApp | IframeApp | CustomApp;

/**
 * Props for app page component
 */
export interface AppPageProps {
  /** App slug from URL params */
  appSlug?: string;
}

/**
 * Props for StreamlitEmbed component
 */
export interface StreamlitEmbedProps {
  /** Streamlit app URL with ?embedded=true */
  embedUrl: string;

  /** Streamlit app URL without embedded param (for wake-up link) */
  directUrl: string;

  /** Page title */
  title: string;

  /** Iframe accessibility title */
  iframeTitle: string;

  /** Optional fixed height */
  height?: number | string;

  /** Optional fixed width */
  width?: number | string;
}

/**
 * Props for basic IframeContent component
 */
export interface IframeContentProps {
  /** URL to embed */
  url: string;

  /** Page/iframe title */
  title?: string;

  /** Optional height */
  height?: string;

  /** Optional width */
  width?: string;
}

/**
 * Props for advanced iframe with postMessage support
 */
export interface AdvancedIframeProps extends IframeContentProps {
  /** Enable URL parameter forwarding */
  forwardUrlParams?: boolean;

  /** Enable postMessage listening */
  enablePostMessage?: boolean;

  /** Allowed origins for postMessage */
  allowedOrigins?: string[];
}
