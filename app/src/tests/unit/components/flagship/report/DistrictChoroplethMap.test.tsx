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
});
