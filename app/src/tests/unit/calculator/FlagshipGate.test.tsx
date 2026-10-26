import { render, screen, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { flagshipFallbackRedirect } from '../../../../../calculator-app/src/app/[countryId]/(workspace)/flagshipFallback';
import FlagshipGate from '../../../../../calculator-app/src/app/[countryId]/(workspace)/FlagshipGate';

const mockReplace = vi.fn();
let mockCountryId = 'uk';
const mockFlags = { env: false, storage: false };

vi.mock('next/navigation', () => ({
  useParams: () => ({ countryId: mockCountryId }),
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock('@/libs/featureFlags', () => ({
  isFlagshipShellEnvEnabled: () => mockFlags.env,
  isFlagshipShellEnabled: () => mockFlags.env || mockFlags.storage,
}));

describe('flagshipFallbackRedirect', () => {
  test('given a country still on v2 then its v2 Reports page is the fallback', () => {
    expect(flagshipFallbackRedirect('uk')).toBe('/uk/reports');
  });

  test('given the US then there is no redirect', () => {
    expect(flagshipFallbackRedirect('us')).toBeNull();
  });

  test('given a segment that is not a country code then there is no redirect', () => {
    expect(flagshipFallbackRedirect('../evil')).toBeNull();
  });
});

describe('FlagshipGate', () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockCountryId = 'uk';
    mockFlags.env = false;
    mockFlags.storage = false;
  });

  test('given the UK flag is off then a v3 link redirects to the v2 Reports page', async () => {
    render(
      <FlagshipGate>
        <p>Build</p>
      </FlagshipGate>
    );

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/uk/reports'));
    expect(screen.queryByText('Build')).not.toBeInTheDocument();
    expect(screen.queryByText('Page not found')).not.toBeInTheDocument();
  });

  test('given the UK override is on then the page renders without a redirect', async () => {
    mockFlags.storage = true;
    render(
      <FlagshipGate>
        <p>Build</p>
      </FlagshipGate>
    );

    expect(await screen.findByText('Build')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test('given the US flag is on then the page renders', () => {
    mockCountryId = 'us';
    mockFlags.env = true;
    render(
      <FlagshipGate>
        <p>Build</p>
      </FlagshipGate>
    );

    expect(screen.getByText('Build')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test('given the US flag is off then the not-found page stays', async () => {
    mockCountryId = 'us';
    render(
      <FlagshipGate>
        <p>Build</p>
      </FlagshipGate>
    );

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
