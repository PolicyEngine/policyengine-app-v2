export const LEGACY_V1_REDIRECT_CASES = [
  {
    description: 'US policy route with a focus query',
    inboundUrl: 'https://policyengine.org/us/policy?focus=gov',
    expectedRedirectUrl: 'https://legacy.policyengine.org/us/policy?focus=gov',
  },
  {
    description: 'US household route with full v1-style query params',
    inboundUrl:
      'https://policyengine.org/us/household?focus=householdOutput.netIncome&reform=44066&region=us&timePeriod=2023&baseline=2&household=39725',
    expectedRedirectUrl:
      'https://legacy.policyengine.org/us/household?focus=householdOutput.netIncome&reform=44066&region=us&timePeriod=2023&baseline=2&household=39725',
  },
  {
    description: 'UK household route using raw reform parameters',
    inboundUrl: 'https://policyengine.org/uk/household?basic_rate=16&baseline_basic_rate=20',
    expectedRedirectUrl:
      'https://legacy.policyengine.org/uk/household?basic_rate=16&baseline_basic_rate=20',
  },
  {
    description: 'Canada policy route without query params',
    inboundUrl: 'https://policyengine.org/ca/policy',
    expectedRedirectUrl: 'https://legacy.policyengine.org/ca/policy',
  },
  {
    description: 'Nigeria household route with a trailing slash',
    inboundUrl: 'https://policyengine.org/ng/household/',
    expectedRedirectUrl: 'https://legacy.policyengine.org/ng/household/',
  },
] as const;

export const NON_LEGACY_URL_CASES = [
  {
    description: 'v2 report output share link',
    inboundUrl: 'https://app.policyengine.org/us/report-output/sur-abc123?share=encoded-share-data',
  },
  {
    description: 'v2 policy list page',
    inboundUrl: 'https://policyengine.org/us/policies',
  },
  {
    description: 'v2 household list page',
    inboundUrl: 'https://policyengine.org/us/households',
  },
  {
    description: 'historical population-impact link excluded by strict matcher',
    inboundUrl: 'https://policyengine.org/us/population-impact?basic_rate=18',
  },
  {
    description: 'research page',
    inboundUrl: 'https://policyengine.org/us/research/harris-eitc',
  },
] as const;

export const ALREADY_LEGACY_URL_CASES = [
  {
    description: 'already-legacy US policy route',
    inboundUrl: 'https://legacy.policyengine.org/us/policy?focus=gov',
  },
  {
    description: 'already-legacy UK household route',
    inboundUrl:
      'https://legacy.policyengine.org/uk/household?focus=intro&reform=37636&region=uk&timePeriod=2023&baseline=1',
  },
] as const;
