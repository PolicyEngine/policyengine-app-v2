import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import { OptionChipRow } from '@/pages/reportBuilder/components/chips/OptionChipRow';
import { OptionChipSquare } from '@/pages/reportBuilder/components/chips/OptionChipSquare';
import { INGREDIENT_COLORS } from '@/pages/reportBuilder/constants';

describe.each([
  { variant: 'square', OptionChip: OptionChipSquare },
  { variant: 'row', OptionChip: OptionChipRow },
])('$variant option chip', ({ OptionChip }) => {
  test('given an ingredient error then displays the warning icon and blocks selection', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <OptionChip
        icon={<span>Policy</span>}
        label="Broken policy"
        description="Failed to load"
        isSelected={false}
        onClick={onClick}
        colorConfig={INGREDIENT_COLORS.policy}
        isDisabled
        errorMessage="Error loading this policy"
      />
    );

    const chip = screen.getByText('Broken policy').closest('[role="button"]');
    expect(chip).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByLabelText('Error loading this policy')).toBeInTheDocument();

    await user.click(chip!);
    expect(onClick).not.toHaveBeenCalled();
  });
});
