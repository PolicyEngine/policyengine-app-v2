import { render, screen, userEvent, within } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import PopulationPicker, { populationLabel } from '@/components/flagship/reform/PopulationPicker';
import { UK_REGIONS } from '@/tests/fixtures/components/flagship/draftEditorFixtures';

const REGIONS = [
  { name: 'state/ar', label: 'Arkansas' },
  { name: 'congressional_district/AR-01', label: "Arkansas's 1st congressional district" },
];

describe('populationLabel', () => {
  test('given the whole country then it reads Nationwide', () => {
    expect(populationLabel('', REGIONS)).toBe('Nationwide');
  });

  test('given regions from metadata then a state and a district read by name', () => {
    expect(populationLabel('state/ar', REGIONS)).toBe('Arkansas');
    expect(populationLabel('congressional_district/AR-01', REGIONS)).toBe("Arkansas's 1st");
  });

  test('given metadata still loading then a state reads by name, a district by its code', () => {
    expect(populationLabel('state/ar', [])).toBe('Arkansas');
    expect(populationLabel('state/dc', [])).toBe('District of Columbia');
    expect(populationLabel('congressional_district/AR-01', [])).toBe('AR-01');
  });
});

describe('populationLabel for the UK', () => {
  test('given a UK country then it reads by name', () => {
    expect(populationLabel('country/england', UK_REGIONS)).toBe('England');
  });

  test('given a constituency and a local authority with one name then each says which it is', () => {
    expect(populationLabel('constituency/Bedford', UK_REGIONS)).toBe('Bedford (constituency)');
    expect(populationLabel('local_authority/Bedford', UK_REGIONS)).toBe(
      'Bedford (local authority)'
    );
  });

  test('given metadata still loading then UK regions read by name, never by their prefix', () => {
    expect(populationLabel('country/ni', [])).toBe('Northern Ireland');
    expect(populationLabel('constituency/Aberdeen North', [])).toBe(
      'Aberdeen North (constituency)'
    );
  });
});

describe('PopulationPicker', () => {
  test('given UK regions then the four nations list, and the picker asks for UK places', async () => {
    const user = userEvent.setup();
    render(<PopulationPicker value="" onChange={vi.fn()} regions={UK_REGIONS} />, 'uk');

    await user.click(screen.getByRole('button', { name: 'Population: Nationwide' }));

    expect(screen.getByRole('option', { name: 'England' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Scotland' })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Find a country, constituency or local authority…')
    ).toBeInTheDocument();
    // 650 constituencies and 360 local authorities would swamp the list.
    expect(screen.queryByRole('option', { name: 'Aberdeen North' })).not.toBeInTheDocument();
  });

  test('given a search then constituencies and local authorities join the list, each in its group', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PopulationPicker value="" onChange={onChange} regions={UK_REGIONS} />, 'uk');
    await user.click(screen.getByRole('button', { name: 'Population: Nationwide' }));

    await user.type(
      screen.getByPlaceholderText('Find a country, constituency or local authority…'),
      'Bedford'
    );
    const constituencies = screen.getByRole('group', { name: 'Constituencies' });
    expect(screen.getByRole('group', { name: 'Local authorities' })).toHaveTextContent('Bedford');
    await user.click(within(constituencies).getByRole('option', { name: 'Bedford' }));

    expect(onChange).toHaveBeenCalledWith('constituency/Bedford');
  });
});
