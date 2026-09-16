import { useState } from 'react';
import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import SPMGeographyChoice from '@/components/household/SPMGeographyChoice';
import SPMMethodologyFootnote from '@/components/household/SPMMethodologyFootnote';
import { Household } from '@/models/Household';
import {
  NATIONAL_SPM,
  RESOLVED_CANONICAL_METADATA,
  RESOLVED_LEGACY_METADATA,
  SPM_RECEIPT,
  SPM_TEST_YEAR,
  stateOnlyHousehold,
} from '@/tests/fixtures/spm/spmMocks';

function Choice() {
  const [household, setHousehold] = useState(stateOnlyHousehold);
  return (
    <SPMGeographyChoice
      household={household}
      year={SPM_TEST_YEAR}
      metadata={RESOLVED_CANONICAL_METADATA}
      onChange={setHousehold}
    />
  );
}

describe('SPM geography choice', () => {
  test.each([
    ['pending', { ...RESOLVED_CANONICAL_METADATA, loading: true }, /Wait for model information/],
    ['failed', { ...RESOLVED_CANONICAL_METADATA, error: 'Network error' }, /Reload the page/],
    [
      'different country',
      { ...RESOLVED_CANONICAL_METADATA, currentCountry: 'uk' },
      /Wait for model information/,
    ],
  ] as const)(
    'given %s metadata then stale choices cannot be edited',
    (_name, metadata, message) => {
      render(
        <SPMGeographyChoice
          household={stateOnlyHousehold().withSPM(NATIONAL_SPM)}
          year={SPM_TEST_YEAR}
          metadata={metadata}
          onChange={vi.fn()}
        />
      );
      expect(screen.getByRole('status')).toHaveTextContent(message);
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    }
  );

  test('given a state-only household then national thresholds require a visible selection', async () => {
    const user = userEvent.setup();
    render(<Choice />);
    const select = screen.getByRole('combobox', { name: 'Supplemental Poverty Measure geography' });
    expect(select).toHaveValue('');
    await user.selectOptions(select, 'national');
    expect(select).toHaveValue('national');
    expect(screen.queryByLabelText(/County FIPS code/)).not.toBeInTheDocument();
  });

  test('given local selection then users supply their own county FIPS input', async () => {
    const user = userEvent.setup();
    render(<Choice />);
    await user.selectOptions(screen.getByRole('combobox'), 'county');
    const county = screen.getByRole('textbox', { name: /County FIPS code/ });
    expect(county).toHaveValue('');
    await user.type(county, '06037');
    expect(county).toHaveValue('06037');
  });

  test('given legacy metadata or UK then canonical selection is not offered', () => {
    const { rerender } = render(
      <SPMGeographyChoice
        household={stateOnlyHousehold()}
        year={SPM_TEST_YEAR}
        metadata={RESOLVED_LEGACY_METADATA}
        onChange={vi.fn()}
      />
    );
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    rerender(
      <SPMGeographyChoice
        household={Household.starter('uk', SPM_TEST_YEAR)}
        year={SPM_TEST_YEAR}
        metadata={{ ...RESOLVED_CANONICAL_METADATA, currentCountry: 'uk' }}
        onChange={vi.fn()}
      />
    );
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  test('given a receipt then methodology shows the returned provenance', () => {
    render(
      <SPMMethodologyFootnote
        output={[
          {
            countryId: 'us',
            householdData: { people: {} },
            spmConfig: NATIONAL_SPM,
            spmProvenance: SPM_RECEIPT,
          },
        ]}
      />
    );
    expect(screen.getByText('Supplemental Poverty Measure methodology')).toBeInTheDocument();
    expect(screen.getByText(/Forecast: test-canonical-forecast/)).toBeInTheDocument();
    expect(screen.getByText(/"forecast_sha256"/)).toHaveTextContent(SPM_RECEIPT.forecast_sha256);
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  });
});
