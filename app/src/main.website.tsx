/**
 * Entry point for Website (policyengine.org)
 */
import { StrictMode } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { createRoot } from 'react-dom/client';
import WebsiteApp from './WebsiteApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WebsiteApp />
    <Analytics />
    <SpeedInsights />
  </StrictMode>
);
