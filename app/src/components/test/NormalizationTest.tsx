import React from 'react';
import { useUserSimulationsNormalized } from '@/hooks/useUserSimulationNormalized';

interface NormalizationTestProps {
  userId: string;
}

/**
 * Test component to verify that policy labels are accessible through
 * the normalized structure when displaying simulations
 */
export const NormalizationTest: React.FC<NormalizationTestProps> = ({ userId }) => {
  const {
    entities,
    result,
    isLoading,
    error,
    getPolicyLabelForSimulation,
    getSimulationsWithPolicyLabels,
  } = useUserSimulationsNormalized(userId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  // Test 1: Direct access through helper method
  const testDirectAccess = () => {
    console.log('Test 1: Direct Policy Label Access');
    result.forEach(simId => {
      const label = getPolicyLabelForSimulation(simId);
      console.log(`  Simulation ${simId}: Policy Label = ${label || 'Not found'}`);
    });
  };

  // Test 2: Batch access with all data
  const testBatchAccess = () => {
    console.log('Test 2: Batch Access with Policy Labels');
    const simulationsWithLabels = getSimulationsWithPolicyLabels();
    simulationsWithLabels.forEach(item => {
      console.log(`  Simulation: ${item.label}`);
      console.log(`    - ID: ${item.id}`);
      console.log(`    - Policy Label: ${item.policyLabel}`);
      console.log(`    - Has UserPolicy: ${!!item.userPolicy}`);
    });
  };

  // Test 3: Verify normalized structure relationships
  const testNormalizedStructure = () => {
    console.log('Test 3: Normalized Structure Verification');
    
    // Check userSimulations have userPolicyId references
    Object.entries(entities.userSimulations || {}).forEach(([id, userSim]: [string, any]) => {
      console.log(`  UserSimulation ${id}:`);
      console.log(`    - Has userPolicy ref: ${!!userSim.userPolicy}`);
      console.log(`    - Has userPolicyId: ${!!userSim.userPolicyId}`);
      console.log(`    - Policy ID from simulation: ${userSim.simulation}`);
    });

    // Check userPolicies are properly stored
    console.log(`  Total UserPolicies: ${Object.keys(entities.userPolicies || {}).length}`);
    console.log(`  Total Policies: ${Object.keys(entities.policies || {}).length}`);
  };

  // Run tests on mount
  React.useEffect(() => {
    if (!isLoading && !error && result.length > 0) {
      console.log('=== Running Normalization Tests ===');
      testDirectAccess();
      testBatchAccess();
      testNormalizedStructure();
      console.log('=== Tests Complete ===');
    }
  }, [isLoading, error, result]);

  return (
    <div>
      <h2>Normalization Test Results</h2>
      <p>Check console for detailed test output</p>
      
      <h3>Simulations Dashboard Preview</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {getSimulationsWithPolicyLabels().map(item => (
          <div key={item.id} style={{ 
            border: '1px solid #ccc', 
            padding: '1rem', 
            borderRadius: '4px' 
          }}>
            <h4>{item.label || `Simulation ${item.id}`}</h4>
            <p><strong>Policy:</strong> {item.policyLabel}</p>
            <p><strong>Simulation ID:</strong> {item.id}</p>
            {item.userSimulation && (
              <p><strong>Created:</strong> {new Date(item.userSimulation.createdAt).toLocaleDateString()}</p>
            )}
          </div>
        ))}
      </div>

      <h3>Raw Entities Count</h3>
      <ul>
        <li>UserSimulations: {Object.keys(entities.userSimulations || {}).length}</li>
        <li>Simulations: {Object.keys(entities.simulations || {}).length}</li>
        <li>UserPolicies: {Object.keys(entities.userPolicies || {}).length}</li>
        <li>Policies: {Object.keys(entities.policies || {}).length}</li>
      </ul>
    </div>
  );
};