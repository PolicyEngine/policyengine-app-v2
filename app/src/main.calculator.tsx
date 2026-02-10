/**
 * Entry point for Calculator app (app.policyengine.org)
 */
import { StrictMode } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { createRoot } from 'react-dom/client';
import CalculatorApp from './CalculatorApp';

/**
 * React 19 root-level error handlers
 *
 * These provide centralized error handling for different error scenarios:
 * - onCaughtError: Errors caught by ErrorBoundary components
 * - onUncaughtError: Errors that escape all boundaries
 * - onRecoverableError: Errors React automatically recovers from
 *
 * Note: React 19 types use `unknown` for error parameter to be safe
 */
const rootErrorHandlers = {
  onCaughtError: (error: unknown, errorInfo: { componentStack?: string }) => {
    // Errors caught by ErrorBoundary - logged for debugging
    // In production, this could send to an error tracking service
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  },
  onUncaughtError: (error: unknown, errorInfo: { componentStack?: string }) => {
    // Uncaught errors - these are more severe
    console.error('[Uncaught] Error escaped all boundaries:', error);
    console.error('[Uncaught] Component stack:', errorInfo.componentStack);
  },
  onRecoverableError: (error: unknown, errorInfo: { componentStack?: string }) => {
    // Recoverable errors - React auto-recovered but we should know about them
    console.warn('[Recoverable] React recovered from error:', error);
    console.warn('[Recoverable] Component stack:', errorInfo.componentStack);
  },
};

createRoot(document.getElementById('root')!, rootErrorHandlers).render(
  <StrictMode>
    <CalculatorApp />
    <Analytics />
    <SpeedInsights />
  </StrictMode>
);
