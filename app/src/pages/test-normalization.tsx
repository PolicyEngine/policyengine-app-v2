import React from 'react';
import { NormalizationTest } from '@/components/test/NormalizationTest';

/**
 * Test page to verify normalized data structure and policy label access
 * This can be accessed at /test-normalization route
 */
export default function TestNormalizationPage() {
  // Use a test user ID - replace with actual user ID for testing
  const testUserId = 'test-user-123';

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Normalization Structure Test</h1>
      <p>
        This page tests that policy labels are properly accessible through the normalized structure
        when displaying user simulations.
      </p>
      <hr style={{ margin: '2rem 0' }} />
      <NormalizationTest userId={testUserId} />
    </div>
  );
}
