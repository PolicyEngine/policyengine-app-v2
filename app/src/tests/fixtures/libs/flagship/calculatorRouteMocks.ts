const notServed = () => new Response(null, { status: 404 });

/**
 * The calculator's own API routes that a report asks for its model,
 * scorecard and calibration checks, each answering 404 as it does outside
 * calculator-app, where these routes are not served. For `fetchRespondingTo`.
 */
export const CALCULATOR_ROUTES_NOT_SERVED = {
  '/api/model-validation': notServed,
  '/api/scorecard-comparisons': notServed,
  '/api/calibration-targets': notServed,
};
