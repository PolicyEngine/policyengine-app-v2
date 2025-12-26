/* eslint-disable @typescript-eslint/no-unused-vars */
// This is a demo file. Turn off eslint no-unused-vars, as we want to know all possible vars available.

import React from 'react';
import { Button } from '@mantine/core';
import { useSimulationAssociationsByUser } from '../useUserSimulationAssociations';
import { useUserSimulationById, useUserSimulations } from '../useUserSimulations';
import { useAllEntities, useNormalizedData } from '../utils/normalizedUtils';

/**
 * Example component demonstrating the full simulations hook
 */
export const SimulationsPageExample: React.FC = () => {
  const userId = 'current-user-id'; // Would come from auth context

  // Fetch all user simulations with full context
  const {
    data: simulations,
    isLoading,
    error,
    getSimulationWithFullContext: _getSimulationWithFullContext,
    getSimulationsByPolicy: _getSimulationsByPolicy,
    getNormalizedPolicy: _getNormalizedPolicy,
  } = useUserSimulations(userId);

  // Access normalized data directly
  const allPolicies = useAllEntities('policies');
  const allHouseholds = useAllEntities('households');

  if (isLoading) {
    return <div>Loading simulations...</div>;
  }
  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h1>My Simulations</h1>

      {simulations.map(({ userSimulation, simulation: _simulation, policy, household, userPolicy }) => (
        <div key={userSimulation.id}>
          <h2>{userSimulation.label || `Simulation ${userSimulation.simulationId}`}</h2>

          {/* All related data is automatically available and normalized */}
          <div>
            <p>Policy: {userPolicy?.label || policy?.id || 'Unknown'}</p>
            <p>Household: {household?.id || 'Unknown'}</p>
            <p>Created: {userSimulation.createdAt}</p>
          </div>

          {/* Data is automatically consistent across components */}
          {policy && policy.id && <PolicyDetails policyId={policy.id.toString()} />}
        </div>
      ))}

      <div>
        <h3>Statistics</h3>
        <p>Total Policies in Cache: {allPolicies.length}</p>
        <p>Total Households in Cache: {allHouseholds.length}</p>
      </div>
    </div>
  );
};

/**
 * Component that accesses normalized policy data
 * Will automatically use cached data from the parent component's fetch
 */
const PolicyDetails: React.FC<{ policyId: string }> = ({ policyId }) => {
  // This will use the normalized cache - no additional fetch needed!
  const policy = useNormalizedData('policies', policyId);

  if (!policy) {
    return null;
  }

  return (
    <div>
      <h4>Policy Details (from normalized cache)</h4>
      <pre>{JSON.stringify(policy, null, 2)}</pre>
    </div>
  );
};

/**
 * Example of accessing a single simulation with full context
 */
export const SimulationDetailExample: React.FC<{ simulationId: string }> = ({ simulationId }) => {
  const userId = 'current-user-id';

  const { simulation, policy, household, userPolicy, userHousehold, isLoading, error } =
    useUserSimulationById(userId, simulationId);

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h1>Simulation Details</h1>

      {/* All data is fetched efficiently with cache checking */}
      <div>
        <h2>Simulation {simulation?.id}</h2>
        <p>Label: {userPolicy?.label || 'Unnamed'}</p>

        <h3>Policy</h3>
        <p>ID: {policy?.id}</p>
        <p>User Label: {userPolicy?.label}</p>

        <h3>Household</h3>
        <p>ID: {household?.id}</p>
        {userHousehold && <p>User Label: {userHousehold.label}</p>}
      </div>

      {/* Any updates to this data will automatically propagate to all components */}
      <UpdateSimulationButton simulation={simulation} />
    </div>
  );
};

/**
 * Example mutation that will automatically update all references
 */
const UpdateSimulationButton: React.FC<{ simulation: any }> = ({ simulation: _simulation }) => {
  // When this mutation completes, @normy/react-query will automatically
  // update all components that reference this simulation

  return (
    <Button
      onClick={() => {
        // Mutation would go here
        // The response will be automatically normalized
        // All components using this simulation will update
      }}
    >
      Update Simulation
    </Button>
  );
};

/**
 * Example of using the lightweight associations hook
 * Perfect for sidebars, navigation, or simple lists
 */
export const SimulationSidebarExample: React.FC = () => {
  const userId = 'current-user-id';

  // Just get the associations - lightweight and fast
  const { data: associations, isLoading } = useSimulationAssociationsByUser(userId);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="sidebar">
      <h3>My Simulations ({associations?.length || 0})</h3>
      <ul>
        {associations?.map((sim) => (
          <li key={sim.id}>
            <a href={`/simulations/${sim.simulationId}`}>
              {sim.label || `Simulation ${sim.simulationId}`}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Example showing when to use each hook
 */
export const HookUsageGuide: React.FC = () => {
  const userId = 'current-user-id';

  return (
    <div>
      <h2>Hook Usage Examples</h2>

      {/* Use associations for counts and simple lists */}
      <SimulationCount userId={userId} />

      {/* Use full hook for detailed views */}
      <SimulationCards userId={userId} />
    </div>
  );
};

const SimulationCount: React.FC<{ userId: string }> = ({ userId }) => {
  // Lightweight - just needs count
  const { data } = useSimulationAssociationsByUser(userId);
  return <div>You have {data?.length || 0} simulations</div>;
};

const SimulationCards: React.FC<{ userId: string }> = ({ userId }) => {
  // Needs full context for rich UI
  const { data } = useUserSimulations(userId);

  return (
    <div>
      {data.map(({ userSimulation, policy, household }) => (
        <div key={userSimulation.id} className="card">
          <h3>{userSimulation.label}</h3>
          <p>Policy: {policy?.id}</p>
          <p>Household: {household?.id}</p>
        </div>
      ))}
    </div>
  );
};
