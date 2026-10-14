/**
 * A phone's screen: narrower than Tailwind's `sm` breakpoint (48rem), so
 * it matches where the `tw:max-sm:` classes apply. For the few layouts
 * that change by width in script rather than in CSS.
 *
 * Not the charts' MOBILE_BREAKPOINT_QUERY (`max-width: 48em`, see
 * useChartDimensions): that one also matches a screen exactly 768px wide,
 * where the `tw:max-sm:` classes no longer apply. Script and CSS must
 * agree on which layout a 768px screen gets, so this one stops at 767px.
 */
export const PHONE_QUERY = '(max-width: 767px)';
