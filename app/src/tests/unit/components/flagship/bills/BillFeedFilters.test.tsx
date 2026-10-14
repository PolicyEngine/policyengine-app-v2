import { render, screen, userEvent, within } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import BillFeedFilters from '@/components/flagship/bills/BillFeedFilters';
import { NO_BILL_FILTERS, type BillFilters } from '@/libs/flagship/billFilters';
import {
  FEDERAL_PROPOSED,
  FILTER_BILLS,
  UTAH_ENACTED,
} from '@/tests/fixtures/libs/flagship/billFilterMocks';

function renderFilters(value: BillFilters = NO_BILL_FILTERS, bills = FILTER_BILLS) {
  const onChange = vi.fn();
  render(
    <BillFeedFilters
      bills={bills}
      searched={bills}
      value={value}
      onChange={onChange}
      controlStyle={{}}
    />
  );
  return onChange;
}

describe('BillFeedFilters', () => {
  test('given the feed then level and stage each offer their options', () => {
    renderFilters();

    const level = screen.getByRole('group', { name: 'Level' });
    expect(
      within(level)
        .getAllByRole('tab')
        .map((tab) => tab.textContent)
    ).toEqual(['All', 'Federal', 'State']);
    const stage = screen.getByRole('group', { name: 'Stage' });
    expect(
      within(stage)
        .getAllByRole('tab')
        .map((tab) => tab.textContent)
    ).toEqual(['All', 'Enacted', 'Proposed', 'Failed']);
  });

  test('given no bill failed then the stage has no failed option', () => {
    renderFilters(NO_BILL_FILTERS, [FEDERAL_PROPOSED, UTAH_ENACTED]);

    expect(
      within(screen.getByRole('group', { name: 'Stage' })).queryByRole('tab', { name: 'Failed' })
    ).not.toBeInTheDocument();
  });

  test('given a level is chosen then the filters change to it from all its states', async () => {
    const user = userEvent.setup();
    const onChange = renderFilters({ ...NO_BILL_FILTERS, level: 'state', state: 'ut' });

    await user.click(screen.getByRole('tab', { name: 'Federal' }));

    expect(onChange).toHaveBeenCalledWith({ level: 'federal', state: 'all', stage: 'all' });
  });

  test('given a stage is chosen then the level and state stay', async () => {
    const user = userEvent.setup();
    const onChange = renderFilters({ ...NO_BILL_FILTERS, level: 'state', state: 'ut' });

    await user.click(screen.getByRole('tab', { name: 'Enacted' }));

    expect(onChange).toHaveBeenCalledWith({ level: 'state', state: 'ut', stage: 'enacted' });
  });

  test('given all levels then there is no state picker', () => {
    renderFilters();

    expect(screen.queryByRole('button', { name: /^state:/i })).not.toBeInTheDocument();
  });

  test('given the state level then a state picker lists each state with its bills', async () => {
    const user = userEvent.setup();
    const onChange = renderFilters({ ...NO_BILL_FILTERS, level: 'state', stage: 'enacted' });

    await user.click(screen.getByRole('button', { name: 'State: All states' }));

    // Counts follow the stage: one enacted bill, in Utah.
    expect(screen.getByRole('option', { name: /all states\s*1/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /georgia/i })).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: /utah\s*1/i }));
    expect(onChange).toHaveBeenCalledWith({ level: 'state', state: 'ut', stage: 'enacted' });
  });
});
