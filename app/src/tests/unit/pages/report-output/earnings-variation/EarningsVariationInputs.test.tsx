import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@test-utils';
import { Provider } from 'react-redux';
import { describe, expect, test, vi } from 'vitest';
import EarningsVariationSubPage from '@/pages/report-output/earnings-variation/EarningsVariationSubPage';
import metadataReducer from '@/reducers/metadataReducer';
import {
  REPORT_YEAR,
  TIPS_POINT_OUTPUT,
  TIPS_VARIATION,
  VARIATION_METADATA_VARIABLES,
} from '@/tests/fixtures/libs/flagship/householdReportMocks';

vi.mock('@/hooks/useReportYear', () => ({ useReportYear: () => REPORT_YEAR }));
vi.mock('@/pages/report-output/earnings-variation/BaselineOnlyChart', () => ({
  default: () => <p>Earnings chart</p>,
}));

function renderSubPage(alsoOfferInputs?: string[]) {
  const store = configureStore({
    reducer: { metadata: metadataReducer },
    preloadedState: {
      metadata: {
        ...metadataReducer(undefined, { type: 'test/init' }),
        currentCountry: 'us',
        version: 'test-model',
        variables: VARIATION_METADATA_VARIABLES,
        entities: { person: { plural: 'people' }, household: { plural: 'households' } },
      },
    },
  });
  render(
    <Provider store={store}>
      <QueryClientProvider client={new QueryClient()}>
        <EarningsVariationSubPage
          baseline={TIPS_POINT_OUTPUT}
          reform={null}
          simulations={[]}
          baselineVariation={TIPS_VARIATION}
          alsoOfferInputs={alsoOfferInputs}
        />
      </QueryClientProvider>
    </Provider>
  );
}

async function offeredVariables() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Net income' }));
  return screen.getAllByRole('button').map((button) => button.textContent ?? '');
}

describe('EarningsVariationSubPage variables (issue #1096)', () => {
  test('given no inputs to offer then only calculated variables are offered, as before', async () => {
    renderSubPage();

    const offered = await offeredVariables();

    expect(offered.some((text) => text.includes('Tip income'))).toBe(false);
  });

  test('given inputs the household sets then they are offered beside the calculated variables', async () => {
    renderSubPage(['tip_income']);

    const offered = await offeredVariables();

    expect(offered.some((text) => text.includes('Tip income'))).toBe(true);
    // An input the household does not set is still left out.
    expect(offered.some((text) => text.startsWith('Age'))).toBe(false);
  });
});
