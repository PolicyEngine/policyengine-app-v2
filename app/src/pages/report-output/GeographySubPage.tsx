import { useState } from 'react';
import { Geography } from '@/types/ingredients/Geography';

interface GeographySubPageProps {
  geographies: Geography[];
}

/**
 * GeographySubPage - Displays geography population information
 *
 * Shows detailed geography information including name, scope, and geographic identifiers.
 */
export default function GeographySubPage({ geographies }: GeographySubPageProps) {
  const [selectedGeographyId, setSelectedGeographyId] = useState<string | null>(null);

  // Auto-select first geography
  const selectedGeography =
    geographies.find((g) => g.id === selectedGeographyId) || geographies[0];

  return (
    <div>
      <h2>Population Information</h2>
      <p>
        <strong>Type:</strong> Geography
      </p>

      {/* Geography Navigation */}
      {geographies.length > 1 && (
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Select Geography:</p>
          {geographies.map((geography) => (
            <button
              key={geography.id}
              type="button"
              onClick={() => setSelectedGeographyId(geography.id || null)}
              style={{
                marginRight: '8px',
                padding: '8px 16px',
                backgroundColor:
                  selectedGeography?.id === geography.id ? '#e0e0e0' : 'transparent',
                border: '1px solid #ccc',
                cursor: 'pointer',
                borderRadius: '4px',
              }}
            >
              {geography.name || geography.geographyId || geography.id}
            </button>
          ))}
        </div>
      )}

      {/* Geography Details */}
      {selectedGeography && (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <h3>Geography Details</h3>

            <div style={{ marginTop: '16px' }}>
              <p>
                <strong>ID:</strong> {selectedGeography.id || 'N/A'}
              </p>
              <p>
                <strong>Name:</strong> {selectedGeography.name || 'N/A'}
              </p>
              <p>
                <strong>Geography ID:</strong> {selectedGeography.geographyId || 'N/A'}
              </p>
              <p>
                <strong>Country:</strong> {selectedGeography.countryId || 'N/A'}
              </p>
              <p>
                <strong>Scope:</strong> {selectedGeography.scope || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
