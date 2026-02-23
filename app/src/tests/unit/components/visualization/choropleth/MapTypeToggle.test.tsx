import { render, screen, userEvent } from '@test-utils';
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

    // Radix Tabs uses data-state="active" for the selected trigger
    const geographicTrigger = screen.getByRole('tab', { name: 'Geographic' });
    expect(geographicTrigger).toHaveAttribute('data-state', 'active');
  });

  it('shows hex grid as selected when value is hex', () => {
    const onChange = vi.fn();
    render(<MapTypeToggle value="hex" onChange={onChange} />);

    const hexTrigger = screen.getByRole('tab', { name: 'Hex grid' });
    expect(hexTrigger).toHaveAttribute('data-state', 'active');
  });

  it('calls onChange with hex when hex grid is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MapTypeToggle value="geographic" onChange={onChange} />);

    await user.click(screen.getByRole('tab', { name: 'Hex grid' }));
    expect(onChange).toHaveBeenCalledWith('hex');
  });

  it('calls onChange with geographic when geographic is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MapTypeToggle value="hex" onChange={onChange} />);

    await user.click(screen.getByRole('tab', { name: 'Geographic' }));
    expect(onChange).toHaveBeenCalledWith('geographic');
  });

  it('maintains correct type for onChange callback', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(value: MapVisualizationType) => void>();
    render(<MapTypeToggle value="geographic" onChange={onChange} />);

    await user.click(screen.getByRole('tab', { name: 'Hex grid' }));

    // Verify the callback was called with a valid MapVisualizationType
    expect(onChange).toHaveBeenCalledWith('hex');
  });
});
