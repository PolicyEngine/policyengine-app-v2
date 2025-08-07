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
