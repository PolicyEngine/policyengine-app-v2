import { useState } from 'react';
import { Household } from '@/types/ingredients/Household';
import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';

interface HouseholdSubPageProps {
  households: Household[];
  userHouseholds?: UserHouseholdPopulation[];
}

/**
 * HouseholdSubPage - Displays household population information
 *
 * Shows detailed household structure including people, families, and tax units,
 * along with user associations.
 */
export default function HouseholdSubPage({
  households,
  userHouseholds,
}: HouseholdSubPageProps) {
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null);

  // Auto-select first household
  const selectedHousehold =
    households.find((h) => h.id === selectedHouseholdId) || households[0];

  // Find user household association
  const userHousehold = userHouseholds?.find((uh) => uh.householdId === selectedHousehold?.id);

  return (
    <div>
      <h2>Population Information</h2>
      <p>
        <strong>Type:</strong> Household
      </p>

      {/* Household Navigation */}
      {households.length > 1 && (
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Select Household:</p>
          {households.map((household, index) => (
            <button
              key={household.id || index}
              type="button"
              onClick={() => setSelectedHouseholdId(household.id || null)}
              style={{
                marginRight: '8px',
                padding: '8px 16px',
                backgroundColor:
                  selectedHousehold?.id === household.id ? '#e0e0e0' : 'transparent',
                border: '1px solid #ccc',
                cursor: 'pointer',
                borderRadius: '4px',
              }}
            >
              Household {index + 1}
            </button>
          ))}
        </div>
      )}

      {/* Household Details */}
      {selectedHousehold && (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <h3>Household Details</h3>

            <div style={{ marginTop: '16px' }}>
              <p>
                <strong>ID:</strong> {selectedHousehold.id || 'N/A'}
              </p>
              <p>
                <strong>Country:</strong> {selectedHousehold.countryId || 'N/A'}
              </p>
            </div>

            {/* User Association Info */}
            {userHousehold && (
              <div style={{ marginTop: '16px' }}>
                <p>
                  <strong>User Association:</strong>
                </p>
                <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                  <li>User ID: {userHousehold.userId}</li>
                  <li>Created: {userHousehold.createdAt || 'N/A'}</li>
                  {userHousehold.label && <li>Custom Label: {userHousehold.label}</li>}
                </ul>
              </div>
            )}
          </div>

          {/* Household Structure */}
          <div style={{ marginBottom: '24px' }}>
            <h3>Household Structure</h3>

            {selectedHousehold.householdData && (
              <div style={{ marginTop: '16px' }}>
                {/* People Section */}
                {selectedHousehold.householdData.people && (
                  <div style={{ marginBottom: '16px' }}>
                    <p>
                      <strong>People:</strong>{' '}
                      {Object.keys(selectedHousehold.householdData.people).length}
                    </p>
                    <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                      {Object.entries(selectedHousehold.householdData.people).map(
                        ([personId, personData]) => (
                          <li key={personId}>
                            {personId}
                            {personData.age && Object.values(personData.age).length > 0 && (
                              <span>
                                {' '}
                                - Age: {String(Object.values(personData.age)[0]) || 'N/A'}
                              </span>
                            )}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {/* Families Section */}
                {selectedHousehold.householdData.families && (
                  <div style={{ marginBottom: '16px' }}>
                    <p>
                      <strong>Families:</strong>{' '}
                      {Object.keys(selectedHousehold.householdData.families).length}
                    </p>
                    <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                      {Object.entries(selectedHousehold.householdData.families).map(
                        ([familyId, familyData]) => (
                          <li key={familyId}>
                            {familyId}
                            {familyData.members && (
                              <span> - Members: {familyData.members.join(', ')}</span>
                            )}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {/* Tax Units Section */}
                {selectedHousehold.householdData.taxUnits && (
                  <div style={{ marginBottom: '16px' }}>
                    <p>
                      <strong>Tax Units:</strong>{' '}
                      {Object.keys(selectedHousehold.householdData.taxUnits).length}
                    </p>
                    <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                      {Object.entries(selectedHousehold.householdData.taxUnits).map(
                        ([taxUnitId, taxUnitData]) => (
                          <li key={taxUnitId}>
                            {taxUnitId}
                            {taxUnitData.members && (
                              <span> - Members: {taxUnitData.members.join(', ')}</span>
                            )}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
