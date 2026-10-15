import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import HouseholdBuilderForm from '@/components/household/HouseholdBuilderForm';
import { Household } from '@/models/Household';

// The SPM choice needs the full model metadata; here only its place in the form matters.
vi.mock('@/components/household/SPMGeographyChoice', () => ({
  default: () => <div>Supplemental Poverty Measure geography</div>,
}));

const YEAR = '2026';

function renderForm(props: Partial<React.ComponentProps<typeof HouseholdBuilderForm>> = {}) {
  return render(
    <HouseholdBuilderForm
      household={Household.starter('us', YEAR).withSPM({ geography_kind: 'national' })}
      metadata={{ variables: {}, entities: {} }}
      year={YEAR}
      maritalStatus="single"
      numChildren={0}
      basicPersonFields={[]}
      basicNonPersonFields={[]}
      onChange={vi.fn()}
      onMaritalStatusChange={vi.fn()}
      onNumChildrenChange={vi.fn()}
      {...props}
    />
  );
}

describe('HouseholdBuilderForm', () => {
  test('given no layout props then the SPM choice and the stacked sections show, as before', () => {
    renderForm();

    expect(screen.getByText('Supplemental Poverty Measure geography')).toBeInTheDocument();
    expect(screen.getByRole('separator', { hidden: true })).toBeInTheDocument();
  });

  test('given hideSpmGeography then the SPM choice is left out', () => {
    renderForm({ hideSpmGeography: true });

    expect(screen.queryByText('Supplemental Poverty Measure geography')).not.toBeInTheDocument();
    expect(screen.getByText('Marital status')).toBeInTheDocument();
  });

  test('given the columns layout then the sections sit in a grid, without the divider', () => {
    const { container } = renderForm({ layout: 'columns' });

    expect(container.firstElementChild).toHaveClass('tw:lg:grid-cols-3');
    expect(screen.queryByRole('separator', { hidden: true })).not.toBeInTheDocument();
    expect(screen.getByText('Individuals')).toBeInTheDocument();
    expect(screen.getByText('Household')).toBeInTheDocument();
  });
});
