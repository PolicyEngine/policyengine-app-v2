import React from 'react';
import { useUserSimulations } from '@/hooks/useUserSimulations';

interface NormalizationTestProps {
  userId: string;
}

/**
 * Test component to verify that policy labels are accessible through
 * the normalized structure when displaying simulations
 */
export const NormalizationTest: React.FC<NormalizationTestProps> = ({ userId }) => {
  const { data, isLoading, error, getSimulationsByPolicy } = useUserSimulations(userId);

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error.message}</div>;
  }

  // Test 1: Direct access through helper method
  const testDirectAccess = () => {
    console.log('Test 1: Direct Policy Label Access');
    data.forEach(({ userSimulation, userPolicy, policy }) => {
      const label = userPolicy?.label || policy?.id || 'Not found';
      console.log(`  Simulation ${userSimulation.simulationId}: Policy Label = ${label}`);
    });
  };

  // Test 2: Batch access with all data
  const testBatchAccess = () => {
    console.log('Test 2: Batch Access with Policy Labels');
    data.forEach((item) => {
      console.log(`  Simulation: ${item.userSimulation.label}`);
      console.log(`    Policy Label: ${item.userPolicy?.label || 'Unnamed'}`);
      console.log(`    Policy ID: ${item.policy?.id || 'No policy'}`);
      console.log(
        `    Household: ${item.household?.label || item.household?.id || 'No household'}`
      );
    });
  };

  // Test 3: Filter by policy
  const testFilterByPolicy = (policyId: string) => {
    console.log(`Test 3: Get all simulations for policy ${policyId}`);
    const sims = getSimulationsByPolicy(policyId);
    console.log(`  Found ${sims.length} simulations`);
  };

  // Run tests on mount
  React.useEffect(() => {
    if (!isLoading && !error && data.length > 0) {
      testDirectAccess();
      testBatchAccess();
      if (data[0]?.policy?.id) {
        testFilterByPolicy(data[0].policy.id);
      }
    }
  }, [data, isLoading, error]);

  return (
    <div>
      <h2>Normalization Test Results</h2>
      <div>Total Simulations: {data.length}</div>

      <h3>Simulations with Policy Labels:</h3>
      <ul>
        {data.map((item) => (
          <li key={item.userSimulation.id}>
            <strong>
              {item.userSimulation.label || `Simulation ${item.userSimulation.simulationId}`}
            </strong>
            <ul>
              <li>Policy: {item.userPolicy?.label || item.policy?.id || 'No policy'}</li>
              <li>Household: {item.household?.label || item.household?.id || 'No household'}</li>
              <li>Created: {item.userSimulation.createdAt || 'Unknown'}</li>
            </ul>
          </li>
        ))}
      </ul>

      <h3>Normalized Entities Count:</h3>
      <ul>
        <li>UserSimulations: {data.length}</li>
        <li>Policies: {data.filter((d) => d.policy).length}</li>
        <li>Households: {data.filter((d) => d.household).length}</li>
      </ul>
    </div>
  );
};
