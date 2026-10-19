import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import FlagshipGate from '../../../../../calculator-app/src/app/[countryId]/(workspace)/FlagshipGate';

vi.mock('next/navigation', () => ({
  useParams: () => ({ countryId: mockCountry }),
}));
let mockCountry = 'us';

function renderGate() {
  return render(
    <FlagshipGate>
      <p>Build page</p>
    </FlagshipGate>
  );
}

describe('FlagshipGate', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('given the US, where v3 is the default, then its flagship page renders', () => {
    mockCountry = 'us';
    renderGate();
    expect(screen.getByText('Build page')).toBeInTheDocument();
  });

  test('given the UK without its own flag then its flagship page is not found', () => {
    mockCountry = 'uk';
    renderGate();
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.queryByText('Build page')).not.toBeInTheDocument();
  });

  test('given the UK flag on then the UK flagship page renders', () => {
    mockCountry = 'uk';
    vi.stubEnv('NEXT_PUBLIC_FLAGSHIP_SHELL_UK', 'true');
    renderGate();
    expect(screen.getByText('Build page')).toBeInTheDocument();
  });
});
