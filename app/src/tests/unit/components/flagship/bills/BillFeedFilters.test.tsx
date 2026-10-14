import { render, screen, userEvent } from '@test-utils';
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

// Radix Select asks for pointer capture, which jsdom does not have.
Element.prototype.hasPointerCapture ??= vi.fn(() => false);
Element.prototype.releasePointerCapture ??= vi.fn();

/** The options a filter's dropdown lists, once opened. */
async function optionsOf(user: ReturnType<typeof userEvent.setup>, filter: 'Level' | 'Stage') {
  await user.click(screen.getByRole('combobox', { name: filter }));
  return (await screen.findAllByRole('option')).map((option) => option.textContent);
}

describe('BillFeedFilters', () => {
  test('given the feed then level and stage are dropdowns with their options', async () => {
    const user = userEvent.setup();
    renderFilters();

    expect(screen.getByRole('combobox', { name: 'Level' })).toHaveTextContent('All levels');
    expect(screen.getByRole('combobox', { name: 'Stage' })).toHaveTextContent('All stages');
    expect(await optionsOf(user, 'Level')).toEqual(['All levels', 'Federal', 'State']);
    await user.keyboard('{Escape}');
    expect(await optionsOf(user, 'Stage')).toEqual(['All stages', 'Enacted', 'Proposed', 'Failed']);
  });

  test('given no bill failed then the stage has no failed option', async () => {
    const user = userEvent.setup();
    renderFilters(NO_BILL_FILTERS, [FEDERAL_PROPOSED, UTAH_ENACTED]);

    expect(await optionsOf(user, 'Stage')).not.toContain('Failed');
  });

  test('given a level is chosen then the filters change to it from all its states', async () => {
    const user = userEvent.setup();
    const onChange = renderFilters({ ...NO_BILL_FILTERS, level: 'state', state: 'ut' });

    await user.click(screen.getByRole('combobox', { name: 'Level' }));
    await user.click(await screen.findByRole('option', { name: 'Federal' }));

    expect(onChange).toHaveBeenCalledWith({ level: 'federal', state: 'all', stage: 'all' });
  });

  test('given a stage is chosen then the level and state stay', async () => {
    const user = userEvent.setup();
    const onChange = renderFilters({ ...NO_BILL_FILTERS, level: 'state', state: 'ut' });

    await user.click(screen.getByRole('combobox', { name: 'Stage' }));
    await user.click(await screen.findByRole('option', { name: 'Enacted' }));

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

    // Counts follow the stage: one enacted bill, in Utah, and none in Georgia.
    expect(screen.getByRole('option', { name: /all states\s*1/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /georgia\s*0/i })).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: /utah\s*1/i }));
    expect(onChange).toHaveBeenCalledWith({ level: 'state', state: 'ut', stage: 'enacted' });
  });
});
