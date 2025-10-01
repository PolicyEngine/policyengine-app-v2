import { vercelPreset } from '@vercel/react-router/vite';
import type { Config } from '@react-router/dev/config';

export default {
  // SPA mode - no server-side rendering
  ssr: false,
  presets: [vercelPreset()],
} satisfies Config;