export interface AppZoneRoute {
  source: string;
  destination: string;
  deepDestination?: string;
}

function withDeepRoute(route: AppZoneRoute): AppZoneRoute[] {
  const deepDestination =
    route.deepDestination ?? `${route.destination.replace(/\/$/, "")}/:path*`;

  return [
    {
      source: route.source,
      destination: route.destination,
    },
    {
      source: `${route.source}/:path*`,
      destination: deepDestination,
    },
  ];
}

export const appZoneRoutes: AppZoneRoute[] = [
  {
    source: "/us/taxation-of-benefits-reforms",
    destination:
      "https://crfb-tob-impacts.vercel.app/us/taxation-of-benefits-reforms",
  },
  {
    source: "/uk/scotland-income-tax-reform",
    destination:
      "https://scotland-income-tax-reform.vercel.app/uk/scotland-income-tax-reform",
  },
  {
    source: "/us/pe84",
    destination: "https://april-fools-2026-two.vercel.app/us/pe84/calculator",
    deepDestination: "https://april-fools-2026-two.vercel.app/us/pe84/:path*",
  },
  {
    source: "/uk/student-loan-visualisation",
    destination: "https://student-loan-visualisation.vercel.app/",
    deepDestination: "https://student-loan-visualisation.vercel.app/:path*",
  },
  {
    source: "/uk/energy-price-shock",
    destination: "https://energy-price-shock.vercel.app/uk/energy-price-shock",
  },
  {
    source: "/us/keep-your-pay-act",
    destination: "https://keep-your-pay-act.vercel.app/us/keep-your-pay-act",
  },
  {
    source: "/us/oregon-kicker-refund",
    destination:
      "https://oregon-kicker-refund.vercel.app/us/oregon-kicker-refund",
  },
  {
    source: "/us/spm-calculator",
    destination: "https://spm-calculator.vercel.app/us/spm-calculator",
  },
  {
    source: "/us/working-parents-tax-relief-act",
    destination:
      "https://wptra.vercel.app/us/working-parents-tax-relief-act",
  },
  {
    source: "/us/utah-2026-tax-changes",
    destination:
      "https://policyengine-utah-2026-tax-changes.vercel.app/us/utah-2026-tax-changes",
  },
  {
    source: "/us/wv-sb392-tax-cut",
    destination: "https://wv-sb392-tax-cut.vercel.app/us/wv-sb392-tax-cut",
  },
  {
    source: "/us/missouri-income-tax-elimination",
    destination:
      "https://missouri-income-tax-elimination.vercel.app/us/missouri-income-tax-elimination",
  },
  {
    source: "/us/south-carolina-2026-tax-changes",
    destination:
      "https://south-carolina-2026-tax-changes.vercel.app/us/south-carolina-2026-tax-changes",
  },
  {
    source: "/us/qbi-calculator",
    destination:
      "https://qbi-visualizer.vercel.app/us/qbi-calculator",
  },
  {
    source: "/us/watca",
    destination: "https://working-americans-tax-cut-act-one.vercel.app/us/watca",
  },
  {
    source: "/us/california-wealth-tax",
    destination:
      "https://california-wealth-tax.vercel.app/us/california-wealth-tax",
  },
  {
    source: "/uk/uk-land-value-tax",
    destination: "https://uk-land-value-tax.vercel.app/uk/uk-land-value-tax",
  },
  {
    source: "/uk/spring-statement-2026",
    destination:
      "https://uk-spring-statement-2026-policy-engine.vercel.app/uk/spring-statement-2026",
  },
  {
    source: "/us/tanf-calculator",
    destination: "https://tanf-calculator.vercel.app/us/tanf-calculator",
  },
  {
    source: "/us/coverage-compass",
    destination:
      "https://coverage-compass-policy-engine.vercel.app/us/coverage-compass",
  },
  {
    source: "/us/cliffwatch",
    destination: "https://cliff-watch.vercel.app/",
    deepDestination: "https://cliff-watch.vercel.app/:path*",
  },
  {
    source: "/uk/cliffwatch",
    destination: "https://cliff-watch.vercel.app/?country=uk",
    deepDestination: "https://cliff-watch.vercel.app/:path*?country=uk",
  },
  {
    source: "/us/marriage",
    destination: "https://marriage-zeta-beryl.vercel.app/us/marriage",
  },
  {
    source: "/uk/marriage",
    destination: "https://marriage-zeta-beryl.vercel.app/us/marriage?country=uk",
    deepDestination:
      "https://marriage-zeta-beryl.vercel.app/us/marriage/:path*?country=uk",
  },
  {
    source: "/:countryId/state-legislative-tracker",
    destination: "https://policyengine--state-legislative-tracker.modal.run/",
    deepDestination:
      "https://policyengine--state-legislative-tracker.modal.run/:path*",
  },
  {
    source: "/uk/uk-salary-sacrifice-tool",
    destination:
      "https://uk-salary-sacrifice-analysis.vercel.app/uk/uk-salary-sacrifice-tool",
  },
  {
    source: "/uk/uk-student-loan-calculator",
    destination:
      "https://uk-student-loan-calculator.vercel.app/uk/uk-student-loan-calculator",
  },
  {
    source: "/us/encode-policy-multi-agent-ai",
    destination: "/assets/posts/encode-policy-multi-agent-ai/index.html",
    deepDestination: "/assets/posts/encode-policy-multi-agent-ai/:path*",
  },
  {
    source: "/uk/scottish-budget-2026-27",
    destination:
      "https://post-scottish-budget-dashboard.vercel.app/uk/scottish-budget-2026-27",
  },
  {
    source: "/uk/local-areas-dashboard",
    destination:
      "https://autumn-budget-local-area.vercel.app/uk/local-areas-dashboard",
  },
  {
    source: "/uk/autumn-budget-2025",
    destination:
      "https://uk-autumn-budget-dashboard.vercel.app/uk/autumn-budget-2025",
  },
  {
    source: "/uk/public-services-spending",
    destination:
      "https://uk-public-services-imputation.vercel.app/uk/public-services-spending",
  },
  {
    source: "/us/aca-calc",
    destination: "https://aca-calc.vercel.app/us/aca-calc",
  },
  {
    source: "/us/child-tax-credit-calculator",
    destination:
      "https://ctc-calculator-seven.vercel.app/us/child-tax-credit-calculator",
  },
  {
    source: "/us/child-tax-credit-2024-election-calculator",
    destination:
      "https://vance-harris-ctc-comparison.vercel.app/us/child-tax-credit-2024-election-calculator",
  },
  {
    source: "/us/givecalc",
    destination: "https://givecalc.vercel.app/us/givecalc",
  },
  {
    source: "/uk/2024-manifestos",
    destination:
      "https://uk-2024-manifestos-comparison.vercel.app/uk/2024-manifestos",
  },
  {
    source: "/us/state-eitcs-ctcs",
    destination:
      "https://us-state-eitcs-ctcs.vercel.app/us/state-eitcs-ctcs",
  },
  {
    source: "/us/2024-election-calculator",
    destination:
      "https://2024-election-dashboard-omega.vercel.app/us/2024-election-calculator",
  },
  {
    source: "/us/obbba-household-explorer",
    destination:
      "https://obbba-household-by-household.vercel.app/us/obbba-household-explorer",
  },
  {
    source: "/us/salternative",
    destination: "https://salt-amt-calculator.vercel.app/us/salternative",
  },
  {
    source: "/uk/two-child-limit-comparison",
    destination:
      "https://uk-two-child-limit-app.vercel.app/uk/two-child-limit-comparison",
  },
  {
    source: "/us/rhode-island-ctc-calculator",
    destination:
      "https://ri-ctc-calculator-policy-engine.vercel.app/us/rhode-island-ctc-calculator",
  },
  {
    source: "/us/snap-district-map",
    destination: "https://snap-district-map.vercel.app/us/snap-district-map",
  },
  {
    source: "/us/ads-dashboard",
    destination: "https://policyengine-ads-dashboard.vercel.app/us/ads-dashboard",
  },
  {
    source: "/us/ai-inequality",
    destination: "https://ai-inequality-theta.vercel.app/us/ai-inequality",
  },
  {
    source: "/uk/ai-inequality",
    destination:
      "https://ai-inequality-theta.vercel.app/us/ai-inequality?country=uk",
    deepDestination:
      "https://ai-inequality-theta.vercel.app/us/ai-inequality/:path*?country=uk",
  },
];

export const appZoneAssetRoutes: AppZoneRoute[] = [
  {
    source: "/2025-year-in-review/:path*",
    destination:
      "https://policyengine-2025-year-in-review.vercel.app/2025-year-in-review/:path*",
  },
];

export const appZoneRewrites: AppZoneRoute[] = [
  {
    source: "/us/2025-year-in-review",
    destination:
      "https://policyengine-2025-year-in-review.vercel.app/2025-year-in-review/us",
  },
  {
    source: "/uk/2025-year-in-review",
    destination:
      "https://policyengine-2025-year-in-review.vercel.app/2025-year-in-review/uk",
  },
  ...appZoneRoutes.flatMap(withDeepRoute),
  ...appZoneAssetRoutes,
];
