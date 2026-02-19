/**
 * GA4 event tracking utility
 *
 * Wraps window.gtag calls. The gtag script is loaded via the HTML files
 * (website.html / calculator.html). This module provides typed helpers
 * so components don't call window.gtag directly.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}

/** Fires when a calculation (household or economy) completes successfully */
export function trackSimulationCompleted(params: {
  calcType: 'household' | 'societyWide';
  countryId: string;
}) {
  trackEvent('simulation_completed', params);
}

/** Fires after 15s on an iframe tool page */
export function trackToolEngaged(params: { toolSlug: string; toolTitle: string }) {
  trackEvent('tool_engaged', params);
}

/** Fires when user clicks the email contact link */
export function trackContactClicked() {
  trackEvent('contact_clicked');
}

/** Fires on successful newsletter subscription */
export function trackNewsletterSignup() {
  trackEvent('newsletter_signup');
}

/** Fires when user clicks "Build Report" to start the creation flow */
export function trackReportStarted() {
  trackEvent('report_started');
}

/** Fires when user saves a custom policy */
export function trackPolicyCreated() {
  trackEvent('policy_created');
}

/** Fires when user downloads CSV data from a chart */
export function trackChartCsvDownloaded() {
  trackEvent('chart_csv_downloaded');
}

/** Fires when user copies Python reproduction code */
export function trackPythonCodeCopied() {
  trackEvent('python_code_copied');
}
