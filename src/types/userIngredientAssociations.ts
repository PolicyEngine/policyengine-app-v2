export interface UserPolicyAssociation {
  userId: string; // TODO: Verify type
  policyId: string; // TODO: Verify type
  createdAt?: string;
  updatedAt?: string;
}

export interface UserSimulation {
  userId: string; // TODO: Verify type; see if we want to integrate with UserPolicy or Policy
  simulationId: string; // TODO: Verify type; see if we want to integrate with UserPolicy or Policy
  label?: string;
}