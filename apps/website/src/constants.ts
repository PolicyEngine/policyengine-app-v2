/**
 * Website constants
 */

// App URLs for the split website/calculator architecture
// In dev mode, these are set via VITE_* env vars to localhost URLs
// In production, they fall back to the prod URLs
export const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL || 'https://policyengine.org';

export const CALCULATOR_URL = import.meta.env.VITE_CALCULATOR_URL || 'https://app.policyengine.org';
