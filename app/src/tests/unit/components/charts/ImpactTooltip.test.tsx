import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import { ImpactTooltip } from '@/components/charts/ImpactTooltip';

const TEST_ENTRY = {
  name: 'Income tax',
  hoverText: 'Increases by $1,200 per year',
};

describe('ImpactTooltip', () => {
  test('given active tooltip with payload then renders name and hover text', () => {
    // When
    render(<ImpactTooltip active payload={[{ payload: TEST_ENTRY }]} />);

    // Then
    expect(screen.getByText(TEST_ENTRY.name)).toBeInTheDocument();
    expect(screen.getByText(TEST_ENTRY.hoverText)).toBeInTheDocument();
  });

  test('given inactive tooltip then renders no content', () => {
    // When
    render(<ImpactTooltip active={false} payload={[{ payload: TEST_ENTRY }]} />);

    // Then
    expect(screen.queryByText(TEST_ENTRY.name)).not.toBeInTheDocument();
  });

  test('given no payload then renders no content', () => {
    // When
    render(<ImpactTooltip active payload={[]} />);

    // Then
    expect(screen.queryByText(TEST_ENTRY.name)).not.toBeInTheDocument();
  });

  test('given active tooltip then max width is viewport-constrained', () => {
    // When
    render(<ImpactTooltip active payload={[{ payload: TEST_ENTRY }]} />);

    // Then — the tooltip div wrapping the content uses min() for mobile safety
    const nameElement = screen.getByText(TEST_ENTRY.name);
    const tooltipDiv = nameElement.parentElement!;
    expect(tooltipDiv.style.maxWidth).toBe('min(300px, 90vw)');
  });
});
