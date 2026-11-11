import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import { IngredientSectionFull } from '@/pages/reportBuilder/components/IngredientSectionFull';

describe('IngredientSectionFull', () => {
  test('given the selected policy has errored then displays the shared error state', () => {
    render(
      <IngredientSectionFull
        type="policy"
        currentId="policy-123"
        currentLabel="Broken policy"
        selectedErrorMessage="Error loading this policy"
        onCreateCustom={vi.fn()}
        onBrowseMore={vi.fn()}
        onDeselectPolicy={vi.fn()}
        onViewPolicy={vi.fn()}
      />
    );

    expect(screen.getByText('Broken policy')).toBeInTheDocument();
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
    expect(screen.getByLabelText('Error loading this policy')).toBeInTheDocument();
    expect(screen.getByText('Broken policy').closest('[aria-disabled]')).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });
});
