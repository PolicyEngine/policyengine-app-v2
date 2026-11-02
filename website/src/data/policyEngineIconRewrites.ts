// The website's own icons, for any app path. website/next.config.ts applies
// these rewrites ahead of the app-zone rewrites, so policyengine.org serves a
// zone's icon paths (such as /us/givecalc/favicon.ico) from these files, not
// from the zone. The direct-host audit reads this list too.
const tealSquareLogoPath = "/assets/logos/policyengine/teal-square.png";

export const policyEngineIconRewrites = [
  { source: "/favicon.ico", destination: tealSquareLogoPath },
  { source: "/apple-touch-icon.png", destination: tealSquareLogoPath },
  { source: "/logo192.png", destination: tealSquareLogoPath },
  { source: "/logo512.png", destination: tealSquareLogoPath },
  { source: "/policyengine-logo.png", destination: tealSquareLogoPath },
  { source: "/icon.svg", destination: "/favicon.svg" },
  { source: "/policyengine-favicon.svg", destination: "/favicon.svg" },
  {
    source: "/:countryId/:appSlug/favicon.ico",
    destination: tealSquareLogoPath,
  },
  {
    source: "/:countryId/:appSlug/apple-touch-icon.png",
    destination: tealSquareLogoPath,
  },
  {
    source: "/:countryId/:appSlug/logo192.png",
    destination: tealSquareLogoPath,
  },
  {
    source: "/:countryId/:appSlug/logo512.png",
    destination: tealSquareLogoPath,
  },
  {
    source: "/:countryId/:appSlug/policyengine-logo.png",
    destination: tealSquareLogoPath,
  },
  { source: "/:countryId/:appSlug/favicon.svg", destination: "/favicon.svg" },
  { source: "/:countryId/:appSlug/icon.svg", destination: "/favicon.svg" },
  {
    source: "/:countryId/:appSlug/policyengine-favicon.svg",
    destination: "/favicon.svg",
  },
];
