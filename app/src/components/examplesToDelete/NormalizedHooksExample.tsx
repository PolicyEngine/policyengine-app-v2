import React from 'react';
import { 
  useUserPoliciesNormalized,
  useUserSimulationsNormalized,
  useUserReportsNormalized 
} from '@/hooks/normalizedHooks';

// TODO: Remove this file after integrating normalized hooks more broadly
/**
 * Example component demonstrating how to use the normalized hooks
 * to access ingredient data and their dependencies
 */
export const SimulationDashboard: React.FC<{ userId: string }> = ({ userId }) => {
  // Fetch all user simulations with their dependencies
  const {
    entities,
    result: simulationIds,
    isLoading,
    error,
    getSimulation,
    getPolicy,
    getUserSimulation,
  } = useUserSimulationsNormalized(userId);

  if (isLoading) return <div>Loading simulations...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>User Simulations</h2>
      {simulationIds.map((simId) => {
        const userSimulation = getUserSimulation(simId);
        const simulation = userSimulation?.simulation;
        const policy = simulation?.policyId ? getPolicy(simulation.policyId.toString()) : null;

        return (
          <div key={simId}>
            <h3>{userSimulation?.label || `Simulation ${simId}`}</h3>
            <p>Created: {userSimulation?.createdAt}</p>
            {simulation && (
              <div>
                <h4>Simulation Details:</h4>
                <p>Country: {simulation.countryId}</p>
                <p>API Version: {simulation.apiVersion}</p>
              </div>
            )}
            {policy && (
              <div>
                <h4>Associated Policy:</h4>
                <p>Policy ID: {policy.id}</p>
                <p>Parameters: {policy.parameters?.length || 0}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Example showing how to access a specific policy by ID
 */
export const PolicyViewer: React.FC<{ userId: string; policyId: string }> = ({ 
  userId, 
  policyId 
}) => {
  const {
    entities,
    getPolicy,
    getUserPolicy,
    isLoading,
    error,
  } = useUserPoliciesNormalized(userId);

  if (isLoading) return <div>Loading policy...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const userPolicy = getUserPolicy(policyId);
  const policy = getPolicy(policyId);

  if (!userPolicy) return <div>Policy not found</div>;

  return (
    <div>
      <h2>{userPolicy.label || 'Unnamed Policy'}</h2>
      <p>User Policy ID: {userPolicy.id}</p>
      <p>Created: {userPolicy.createdAt}</p>
      
      {policy && (
        <div>
          <h3>Policy Details:</h3>
          <p>Country: {policy.countryId}</p>
          <p>API Version: {policy.apiVersion}</p>
          <h4>Parameters:</h4>
          <ul>
            {policy.parameters?.map((param: any, index: number) => (
              <li key={index}>
                {param.name}: {param.values?.length || 0} value intervals
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/**
 * Example showing how to search through normalized data
 */
export const PolicySearch: React.FC<{ userId: string }> = ({ userId }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const {
    searchPoliciesByLabel,
    getPolicy,
    isLoading,
  } = useUserPoliciesNormalized(userId);

  if (isLoading) return <div>Loading...</div>;

  const searchResults = searchPoliciesByLabel(searchTerm);

  return (
    <div>
      <input
        type="text"
        placeholder="Search policies..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      <div>
        {searchResults.map((userPolicy: any) => {
          const policy = getPolicy(userPolicy.policyId);
          return (
            <div key={userPolicy.id}>
              <h3>{userPolicy.label}</h3>
              <p>Parameters: {policy?.parameters?.length || 0}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Example showing complete report view with all nested dependencies
 */
export const ReportViewer: React.FC<{ userId: string; reportId: string }> = ({ 
  userId, 
  reportId 
}) => {
  const {
    getFullReportData,
    isLoading,
    error,
  } = useUserReportsNormalized(userId);

  if (isLoading) return <div>Loading report...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const fullReport = getFullReportData(reportId);

  if (!fullReport) return <div>Report not found</div>;

  return (
    <div>
      <h2>Report: {fullReport.label}</h2>
      
      {fullReport.report && (
        <div>
          <h3>Report Details:</h3>
          <p>Report ID: {fullReport.report.id}</p>
          <p>Generated: {fullReport.report.reportData?.timestamp}</p>
        </div>
      )}
      
      {fullReport.userSimulation && (
        <div>
          <h3>Simulation:</h3>
          <p>Simulation ID: {fullReport.userSimulation.simulationId}</p>
          <p>Label: {fullReport.userSimulation.label}</p>
          
          {fullReport.userSimulation.simulation?.policy && (
            <div>
              <h4>Policy:</h4>
              <p>Policy ID: {fullReport.userSimulation.simulation.policy.id}</p>
              <p>Parameters: {fullReport.userSimulation.simulation.policy.parameters?.length || 0}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};