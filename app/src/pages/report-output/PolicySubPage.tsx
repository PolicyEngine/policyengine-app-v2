import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Policy } from '@/types/ingredients/Policy';
import { UserPolicy } from '@/types/ingredients/UserPolicy';
import { getHierarchicalLabels } from '@/utils/parameterLabels';

interface PolicySubPageProps {
  policies?: Policy[];
  userPolicies?: UserPolicy[];
  reportType: 'economy' | 'household';
}

/**
 * PolicySubPage - Displays policy information for a report
 *
 * This component shows all policies used in the report (baseline, reform, and
 * optionally current law for economy reports) with their parameters and values.
 */
export default function PolicySubPage({ policies, userPolicies, reportType }: PolicySubPageProps) {
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);

  if (!policies || policies.length === 0) {
    return <div>No policy data available</div>;
  }

  // Determine which policies to show based on report type
  // For economy reports: try to show Current Law, Baseline, Reform (3 policies)
  // For household reports: show Baseline, Reform (2 policies)
  const policyTypes: Array<{ label: string; matchLabel?: string }> =
    reportType === 'economy'
      ? [
          { label: 'Current Law', matchLabel: 'current law' },
          { label: 'Baseline Policy', matchLabel: 'baseline' },
          { label: 'Reform Policy', matchLabel: 'reform' },
        ]
      : [
          { label: 'Baseline Policy', matchLabel: 'baseline' },
          { label: 'Reform Policy', matchLabel: 'reform' },
        ];

  // Try to match policies to their roles
  const assignedPolicies = policyTypes
    .map((type) => {
      const policy = policies.find((p) =>
        p.label?.toLowerCase().includes(type.matchLabel || type.label.toLowerCase())
      );
      return policy ? { ...type, policy } : null;
    })
    .filter((item): item is { label: string; matchLabel?: string; policy: Policy } => item !== null);

  // If we couldn't match by label, just use the policies in order
  const displayPolicies =
    assignedPolicies.length > 0
      ? assignedPolicies
      : policies.map((policy, idx) => ({
          label: policyTypes[idx]?.label || `Policy ${idx + 1}`,
          policy,
        }));

  // Auto-select first policy
  const selectedPolicy =
    displayPolicies.find((p) => p.policy.id === selectedPolicyId)?.policy ||
    displayPolicies[0]?.policy;

  const selectedPolicyType =
    displayPolicies.find((p) => p.policy.id === selectedPolicyId)?.label ||
    displayPolicies[0]?.label;

  // Find user policy association
  const userPolicy = userPolicies?.find((up) => up.policyId === selectedPolicy?.id);

  // Helper function to format parameter value with unit
  const formatValue = (value: any, unit?: string): string => {
    if (typeof value === 'number') {
      if (unit === '%') {
        return `${(value * 100).toFixed(1)}%`;
      }
      if (unit === 'currency-USD') {
        return `$${value.toLocaleString()}`;
      }
      return value.toLocaleString();
    }
    return String(value);
  };

  return (
    <div>
      <h2>Policy Information</h2>

      {/* Policy Navigation */}
      {displayPolicies.length > 1 && (
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Select Policy:</p>
          {displayPolicies.map((item) => (
            <button
              key={item.policy.id || item.label}
              type="button"
              onClick={() => setSelectedPolicyId(item.policy.id || null)}
              style={{
                marginRight: '8px',
                padding: '8px 16px',
                backgroundColor:
                  selectedPolicy?.id === item.policy.id ? '#e0e0e0' : 'transparent',
                border: '1px solid #ccc',
                cursor: 'pointer',
                borderRadius: '4px',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Policy Details */}
      {selectedPolicy && (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <h3>{selectedPolicyType}</h3>

            <div style={{ marginTop: '16px' }}>
              <p>
                <strong>ID:</strong> {selectedPolicy.id || 'N/A'}
              </p>
              <p>
                <strong>Label:</strong> {selectedPolicy.label || 'Unnamed Policy'}
              </p>
              <p>
                <strong>Country:</strong> {selectedPolicy.countryId || 'N/A'}
              </p>
              <p>
                <strong>API Version:</strong> {selectedPolicy.apiVersion || 'N/A'}
              </p>
            </div>

            {/* User Association Info */}
            {userPolicy && (
              <div style={{ marginTop: '16px' }}>
                <p>
                  <strong>User Association:</strong>
                </p>
                <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                  <li>User ID: {userPolicy.userId}</li>
                  <li>Created: {userPolicy.createdAt || 'N/A'}</li>
                  {userPolicy.label && <li>Custom Label: {userPolicy.label}</li>}
                </ul>
              </div>
            )}
          </div>

          {/* Parameters Section */}
          <div>
            <h3>Parameters</h3>

            {selectedPolicy.parameters && selectedPolicy.parameters.length > 0 ? (
              <div style={{ marginTop: '16px' }}>
                {selectedPolicy.parameters.map((param, idx) => {
                  const metadata = parameters[param.name];
                  const paramLabel = metadata?.label || param.name;
                  const unit = metadata?.unit || '';
                  const hierarchicalLabels = getHierarchicalLabels(param.name, parameters);

                  return (
                    <div
                      key={idx}
                      style={{
                        marginBottom: '24px',
                        paddingBottom: '16px',
                        borderBottom: '1px solid #e0e0e0',
                      }}
                    >
                      <p>
                        <strong>Parameter:</strong> {param.name}
                      </p>
                      <p>
                        <strong>Label:</strong> {paramLabel}
                      </p>
                      {hierarchicalLabels.length > 0 && (
                        <p>
                          <strong>Hierarchical Labels:</strong> {hierarchicalLabels.join(' > ')}
                        </p>
                      )}

                      <div style={{ marginTop: '12px' }}>
                        <p>
                          <strong>Values:</strong>
                        </p>
                        <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                          {param.values.map((interval, vidx) => (
                            <li key={vidx}>
                              {interval.startDate} to {interval.endDate}:{' '}
                              <strong>{formatValue(interval.value, unit)}</strong>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ marginTop: '16px', color: '#666' }}>No parameters modified</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
