import type { Config } from '@react-router/dev/config';
import { vercelPreset } from '@vercel/react-router/vite';

export default {
  // SPA mode - no server-side rendering
  ssr: false,
  presets: [vercelPreset()],
} satisfies Config;
