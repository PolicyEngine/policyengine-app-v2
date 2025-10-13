import { useState } from 'react';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { Policy } from '@/types/ingredients/Policy';
import { Simulation } from '@/types/ingredients/Simulation';
import { UserSimulation } from '@/types/ingredients/UserSimulation';

interface SimulationSubPageProps {
  simulations?: Simulation[];
  policies?: Policy[];
  households?: Household[];
  geographies?: Geography[];
  userSimulations?: UserSimulation[];
}

/**
 * SimulationSubPage - Displays simulation information for a report
 *
 * This component shows all simulations used in the report (baseline and reform)
 * with their relationships to policies and populations.
 */
export default function SimulationSubPage({
  simulations,
  policies,
  households,
  geographies,
  userSimulations,
}: SimulationSubPageProps) {
  const [selectedSimulationId, setSelectedSimulationId] = useState<string | null>(null);

  if (!simulations || simulations.length === 0) {
    return <div>No simulation data available</div>;
  }

  // Helper function to find policy by ID
  const findPolicy = (policyId?: string): Policy | undefined => {
    if (!policyId || !policies) return undefined;
    return policies.find((p) => p.id === policyId);
  };

  // Helper function to find population (household or geography) by ID
  const findPopulation = (
    populationId: string | undefined,
    populationType: string | undefined
  ): { name: string; type: string } | undefined => {
    if (!populationId) return undefined;

    if (populationType === 'household' && households) {
      const household = households.find((h) => h.id === populationId);
      if (household && household.id) {
        return { name: household.id, type: 'Household' };
      }
    }

    if (populationType === 'geography' && geographies) {
      const geography = geographies.find((g) => g.id === populationId);
      if (geography && geography.id) {
        return { name: geography.name || geography.id, type: 'Geography' };
      }
    }

    return undefined;
  };

  // Label simulations by their position: first is baseline, second is reform
  // The API always returns simulations in this order: [baseline, reform]
  const simulationsWithLabels = simulations.map((sim, index) => ({
    simulation: sim,
    role: index === 0 ? 'Baseline Simulation' : 'Reform Simulation',
  }));

  // Auto-select first simulation
  const selectedSimulation =
    simulationsWithLabels.find((s) => s.simulation.id === selectedSimulationId)?.simulation ||
    simulationsWithLabels[0]?.simulation;

  const selectedSimulationRole =
    simulationsWithLabels.find((s) => s.simulation.id === selectedSimulationId)?.role ||
    simulationsWithLabels[0]?.role;

  // Find user simulation association
  const userSimulation = userSimulations?.find((us) => us.simulationId === selectedSimulation?.id);

  // Find related policy
  const relatedPolicy = findPolicy(selectedSimulation?.policyId);

  // Find related population
  const relatedPopulation = findPopulation(
    selectedSimulation?.populationId,
    selectedSimulation?.populationType
  );

  return (
    <div>
      <h2>Simulation Information</h2>

      {/* Simulation Navigation */}
      {simulationsWithLabels.length > 1 && (
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Select Simulation:</p>
          {simulationsWithLabels.map((item) => (
            <button
              key={item.simulation.id || item.role}
              type="button"
              onClick={() => setSelectedSimulationId(item.simulation.id || null)}
              style={{
                marginRight: '8px',
                padding: '8px 16px',
                backgroundColor:
                  selectedSimulation?.id === item.simulation.id ? '#e0e0e0' : 'transparent',
                border: '1px solid #ccc',
                cursor: 'pointer',
                borderRadius: '4px',
              }}
            >
              {item.role}
            </button>
          ))}
        </div>
      )}

      {/* Simulation Details */}
      {selectedSimulation && (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <h3>{selectedSimulationRole}</h3>

            <div style={{ marginTop: '16px' }}>
              <p>
                <strong>ID:</strong> {selectedSimulation.id || 'N/A'}
              </p>
              <p>
                <strong>Label:</strong> {selectedSimulation.label || 'Unnamed Simulation'}
              </p>
              <p>
                <strong>Country:</strong> {selectedSimulation.countryId || 'N/A'}
              </p>
              <p>
                <strong>API Version:</strong> {selectedSimulation.apiVersion || 'N/A'}
              </p>
              <p>
                <strong>Created:</strong> {selectedSimulation.isCreated ? 'Yes' : 'No'}
              </p>
            </div>

            {/* User Association Info */}
            {userSimulation && (
              <div style={{ marginTop: '16px' }}>
                <p>
                  <strong>User Association:</strong>
                </p>
                <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                  <li>User ID: {userSimulation.userId}</li>
                  <li>Created: {userSimulation.createdAt || 'N/A'}</li>
                  {userSimulation.label && <li>Custom Label: {userSimulation.label}</li>}
                </ul>
              </div>
            )}
          </div>

          {/* Related Policy Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3>Associated Policy</h3>
            <div style={{ marginTop: '16px' }}>
              <p>
                <strong>Policy ID:</strong> {selectedSimulation.policyId || 'N/A'}
              </p>
              {relatedPolicy ? (
                <div style={{ marginLeft: '20px', marginTop: '8px' }}>
                  <p>
                    <strong>Policy Name:</strong> {relatedPolicy.label || 'Unnamed Policy'}
                  </p>
                  <p style={{ color: '#666', fontSize: '14px' }}>[View Policy Details]</p>
                </div>
              ) : (
                <p style={{ marginLeft: '20px', marginTop: '8px', color: '#999' }}>
                  Policy not found
                </p>
              )}
            </div>
          </div>

          {/* Related Population Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3>Associated Population</h3>
            <div style={{ marginTop: '16px' }}>
              <p>
                <strong>Population Type:</strong>{' '}
                {selectedSimulation.populationType || 'N/A'}
              </p>
              <p>
                <strong>Population ID:</strong> {selectedSimulation.populationId || 'N/A'}
              </p>
              {relatedPopulation ? (
                <div style={{ marginLeft: '20px', marginTop: '8px' }}>
                  <p>
                    <strong>{relatedPopulation.type} Name:</strong> {relatedPopulation.name}
                  </p>
                  <p style={{ color: '#666', fontSize: '14px' }}>[View Population Details]</p>
                </div>
              ) : (
                <p style={{ marginLeft: '20px', marginTop: '8px', color: '#999' }}>
                  Population not found
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
