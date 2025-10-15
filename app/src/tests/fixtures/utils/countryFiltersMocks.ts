/**
 * Mock data for country filtering tests
 * Provides various scenarios of items with different country IDs
 */

// Generic item type for testing
interface TestItem {
  id: string;
  countryId: string;
  label?: string;
}

// US-only items
export const mockUSOnlyItems: TestItem[] = [
  { id: 'us-1', countryId: 'us', label: 'US Item 1' },
  { id: 'us-2', countryId: 'us', label: 'US Item 2' },
  { id: 'us-3', countryId: 'us', label: 'US Item 3' },
];

// UK-only items
export const mockUKOnlyItems: TestItem[] = [
  { id: 'uk-1', countryId: 'uk', label: 'UK Item 1' },
  { id: 'uk-2', countryId: 'uk', label: 'UK Item 2' },
];

// Mixed country items (US, UK, CA)
export const mockMixedCountryItems: TestItem[] = [
  { id: 'us-1', countryId: 'us', label: 'US Item 1' },
  { id: 'uk-1', countryId: 'uk', label: 'UK Item 1' },
  { id: 'us-2', countryId: 'us', label: 'US Item 2' },
  { id: 'uk-2', countryId: 'uk', label: 'UK Item 2' },
  { id: 'ca-1', countryId: 'ca', label: 'CA Item 1' },
];

// Specific item types for semantic filtering tests
export const mockFilteredItems = {
  policies: [
    { id: 'pol-1', countryId: 'us', policyId: 'policy-123', label: 'US Policy 1' },
    { id: 'pol-2', countryId: 'uk', policyId: 'policy-456', label: 'UK Policy 1' },
    { id: 'pol-3', countryId: 'us', policyId: 'policy-789', label: 'US Policy 2' },
  ],
  households: [
    { id: 'hh-1', countryId: 'us', householdId: 'household-123', label: 'US Household 1' },
    { id: 'hh-2', countryId: 'uk', householdId: 'household-456', label: 'UK Household 1' },
    { id: 'hh-3', countryId: 'us', householdId: 'household-789', label: 'US Household 2' },
  ],
  geographies: [
    {
      id: 'geo-1',
      countryId: 'us',
      geographyId: 'california',
      label: 'California',
      scope: 'subnational' as const,
    },
    {
      id: 'geo-2',
      countryId: 'uk',
      geographyId: 'scotland',
      label: 'Scotland',
      scope: 'subnational' as const,
    },
  ],
};
