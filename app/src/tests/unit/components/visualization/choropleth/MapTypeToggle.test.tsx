import { fireEvent, render, screen } from '@test-utils';
import { describe, expect, it, vi } from 'vitest';
import { MapTypeToggle } from '@/components/visualization/choropleth/MapTypeToggle';
import type { MapVisualizationType } from '@/components/visualization/choropleth/types';

describe('MapTypeToggle', () => {
  it('renders both toggle options', () => {
    const onChange = vi.fn();
    render(<MapTypeToggle value="geographic" onChange={onChange} />);

    expect(screen.getByText('Geographic')).toBeInTheDocument();
    expect(screen.getByText('Hex grid')).toBeInTheDocument();
  });

  it('shows geographic as selected when value is geographic', () => {
    const onChange = vi.fn();
    render(<MapTypeToggle value="geographic" onChange={onChange} />);

    const geographicLabel = screen.getByText('Geographic');
    // The selected option should have the active class from SegmentedControl
    expect(geographicLabel.closest('[data-active="true"]')).toBeInTheDocument();
  });

  it('shows hex grid as selected when value is hex', () => {
    const onChange = vi.fn();
    render(<MapTypeToggle value="hex" onChange={onChange} />);

    const hexLabel = screen.getByText('Hex grid');
    expect(hexLabel.closest('[data-active="true"]')).toBeInTheDocument();
  });

  it('calls onChange with hex when hex grid is clicked', () => {
    const onChange = vi.fn();
    render(<MapTypeToggle value="geographic" onChange={onChange} />);

    fireEvent.click(screen.getByText('Hex grid'));
    expect(onChange).toHaveBeenCalledWith('hex');
  });

  it('calls onChange with geographic when geographic is clicked', () => {
    const onChange = vi.fn();
    render(<MapTypeToggle value="hex" onChange={onChange} />);

    fireEvent.click(screen.getByText('Geographic'));
    expect(onChange).toHaveBeenCalledWith('geographic');
  });

  it('maintains correct type for onChange callback', () => {
    const onChange = vi.fn<(value: MapVisualizationType) => void>();
    render(<MapTypeToggle value="geographic" onChange={onChange} />);

    fireEvent.click(screen.getByText('Hex grid'));

    // Verify the callback receives the correct type
    const callArg = onChange.mock.calls[0][0];
    expect(callArg === 'geographic' || callArg === 'hex').toBe(true);
  });
});
