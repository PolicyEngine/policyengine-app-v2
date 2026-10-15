import { act, fireEvent, render, screen, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DistrictChoroplethMap } from '@/components/flagship/report/DistrictChoroplethMap';
import {
  MOCK_DISTRICT_CHOROPLETH_DATA,
  MOCK_GEOJSON_FEATURE_COLLECTION,
} from '@/tests/fixtures/components/visualization/usDistrictChoroplethMapMocks';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('DistrictChoroplethMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_GEOJSON_FEATURE_COLLECTION),
    });
  });

  test('given a trackpad pinch then the map zooms and reset restores the initial view', async () => {
    const { container } = render(<DistrictChoroplethMap data={MOCK_DISTRICT_CHOROPLETH_DATA} />);
    await screen.findByRole('button', { name: 'Zoom in' });
    // Let the zoomable group apply its initial centering before capturing it.
    await act(async () => {});
    const group = container.querySelector('.rsm-zoomable-group')!;
    const initialTransform = group.getAttribute('transform');
    fireEvent.wheel(group, { deltaY: -50, ctrlKey: true, clientX: 400, clientY: 200 });
    await waitFor(() => expect(group.getAttribute('transform')).not.toBe(initialTransform));
    // d3 ends a wheel gesture after 150 ms of inactivity.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reset view' }));
    await waitFor(() => expect(group.getAttribute('transform')).toBe(initialTransform));
  });

  test('given the map then no district is a tab stop', async () => {
    // Given
    const { container } = render(<DistrictChoroplethMap data={MOCK_DISTRICT_CHOROPLETH_DATA} />);

    // When
    await waitFor(() => expect(container.querySelectorAll('path.rsm-geography').length).toBe(4));

    // Then: 437 unnamed stops would sit between the zoom buttons and the lists.
    expect(container.querySelectorAll('path.rsm-geography:not([tabindex="-1"])')).toHaveLength(0);
  });

  test('given the map then screen readers hear one named image', async () => {
    // Given
    render(<DistrictChoroplethMap data={MOCK_DISTRICT_CHOROPLETH_DATA} />);

    // Then
    expect(
      await screen.findByRole('img', { name: /congressional district map/i })
    ).toBeInTheDocument();
  });

  test('given zoom buttons then zooming in and out changes the view', async () => {
    const { container } = render(<DistrictChoroplethMap data={MOCK_DISTRICT_CHOROPLETH_DATA} />);
    const zoomIn = await screen.findByRole('button', { name: 'Zoom in' });
    await act(async () => {});
    const group = container.querySelector('.rsm-zoomable-group')!;
    const initialTransform = group.getAttribute('transform');
    fireEvent.click(zoomIn);
    await waitFor(() => expect(group.getAttribute('transform')).not.toBe(initialTransform));
    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    await waitFor(() => expect(group.getAttribute('transform')).toBe(initialTransform));
  });

  test('given a click handler then clicking a district passes its ID', async () => {
    // Given
    const onDistrictClick = vi.fn();
    render(
      <DistrictChoroplethMap
        data={MOCK_DISTRICT_CHOROPLETH_DATA.slice(0, 3)}
        onDistrictClick={onDistrictClick}
      />
    );

    // When
    fireEvent.click(await screen.findByTestId('district-CA-12'));
    // Texas has no data, so it takes no click.
    fireEvent.click(screen.getByTestId('district-TX-23'));

    // Then
    expect(onDistrictClick).toHaveBeenCalledTimes(1);
    expect(onDistrictClick).toHaveBeenCalledWith('CA-12');
  });

  test('given a selected district then it alone is outlined and drawn last', async () => {
    // Given
    const { container } = render(
      <DistrictChoroplethMap data={MOCK_DISTRICT_CHOROPLETH_DATA} selectedDistrict="AL-01" />
    );

    // When
    const selected = await screen.findByTestId('district-AL-01');

    // Then
    expect(selected).toHaveAttribute('data-selected', 'true');
    expect(selected).toHaveAttribute('stroke-width', '2');
    expect(container.querySelectorAll('[data-selected]')).toHaveLength(1);
    const paths = container.querySelectorAll('path.rsm-geography');
    expect(paths[paths.length - 1]).toBe(selected);
  });
});
