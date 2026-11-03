import { cleanup, render, screen, userEvent } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ReportMetaPanel } from '@/pages/reportBuilder/components/ReportMetaPanel';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { seedYearListMetadata, YEAR_LISTS, yearValues } from '@/tests/fixtures/libs/yearListMocks';
import {
  REPORT_POPULATIONS,
  reportStateFor,
  type ReportPopulation,
} from '@/tests/fixtures/pages/reportBuilder/components/ReportMetaPanelMocks';

/** Opens the report year menu and reads the years it offers. */
async function offeredYears(population: ReportPopulation): Promise<string[]> {
  const user = userEvent.setup();
  render(<ReportMetaPanel reportState={reportStateFor(population)} setReportState={vi.fn()} />);
  await user.click(screen.getByRole('combobox', { name: 'Report year' }));
  return (await screen.findAllByRole('option')).map((option) => option.textContent ?? '');
}

describe('ReportMetaPanel year menu', () => {
  beforeEach(() => {
    // Radix Select scrolls its options and captures the pointer, which jsdom lacks.
    Element.prototype.scrollIntoView ??= vi.fn();
    Element.prototype.hasPointerCapture ??= vi.fn(() => false);
  });

  afterEach(() => {
    // Unmount first, so clearing the store updates nothing on screen.
    cleanup();
    store.dispatch(clearMetadata());
  });

  describe('given household years that start before the society-wide years', () => {
    beforeEach(() => {
      seedYearListMetadata({
        societyWideYears: YEAR_LISTS.US_SOCIETY_WIDE_FROM_2024,
        householdYears: YEAR_LISTS.US_HOUSEHOLD,
      });
    });

    test('given a household report then the menu offers the household years', async () => {
      expect(await offeredYears(REPORT_POPULATIONS.HOUSEHOLD)).toEqual(
        yearValues(YEAR_LISTS.US_HOUSEHOLD)
      );
    });

    test('given a society-wide report then the menu offers only the society-wide years', async () => {
      expect(await offeredYears(REPORT_POPULATIONS.SOCIETY_WIDE)).toEqual(
        yearValues(YEAR_LISTS.US_SOCIETY_WIDE_FROM_2024)
      );
    });
  });
});
