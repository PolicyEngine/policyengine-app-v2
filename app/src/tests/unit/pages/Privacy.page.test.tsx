import { render } from '@test-utils';
import { describe, expect, test } from 'vitest';
import PrivacyPage from '@/pages/Privacy.page';

describe('PrivacyPage', () => {
  test('given page loads then component renders without error', () => {
    // Given / When
    const { container } = render(<PrivacyPage />);

    // Then
    expect(container.firstChild).toBeInTheDocument();
  });
});
