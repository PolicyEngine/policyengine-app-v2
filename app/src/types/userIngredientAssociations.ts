export interface UserIngredientAssociation {
  userId: string; // TODO: Verify type
  createdAt?: string;
  updatedAt?: string;
  label?: string; // Optional label for the association
}

export interface UserPolicyAssociation extends UserIngredientAssociation {
  policyId: string; // TODO: Verify type
}

export interface UserSimulationAssociation extends UserIngredientAssociation {
  simulationId: string; // TODO: Verify type; see if we want to integrate with UserPolicy or Policy
}

export interface UserHouseholdAssociation {
  userId: string; // TODO: Verify type
  householdId: string; // TODO: Verify type
  createdAt?: string;
  updatedAt?: string;
}

export interface UserGeographicAssociation {
  id: string; // Should we associate some kind of ID only for the app or not?
  userId: string;
  geographyType: 'national' | 'subnational';
  geographyIdentifier: string; // e.g., 'us', 'us-california', 'uk-birmingham-edgbaston'
  countryCode: string; // 'us', 'uk'
  regionCode?: string; // 'california', 'birmingham-edgbaston' (only for subnational)
  regionType?: 'state' | 'constituency'; // (only for subnational)
  label: string; // 'United States', 'California', 'Birmingham Edgbaston'
  createdAt: string;
}
