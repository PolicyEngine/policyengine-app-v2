import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, test, vi } from 'vitest';
import IframeContent from '@/components/IframeContent';

describe('IframeContent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('accepts same-origin relative iframe URLs for hash sync messages', () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

    render(
      <MemoryRouter initialEntries={['/us/california-wealth-tax']}>
        <Routes>
          <Route
            path="/:countryId/:slug"
            element={
              <IframeContent url="/us/california-wealth-tax/embed" title="California wealth tax" />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: window.location.origin,
        data: {
          type: 'hashchange',
          hash: '/scenario/rauh',
        },
      })
    );

    expect(replaceStateSpy).toHaveBeenCalledWith(
      null,
      '',
      '/us/california-wealth-tax/scenario/rauh'
    );
  });

  test('forwards parent query params into the iframe URL and allows clipboard access', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/us/california-wealth-tax?date=2025-10-17&yield=0.02']}>
        <Routes>
          <Route
            path="/:countryId/:slug"
            element={
              <IframeContent url="/us/california-wealth-tax/embed" title="California wealth tax" />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    const iframe = container.querySelector('iframe');

    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('src')).toContain(
      '/us/california-wealth-tax/embed?date=2025-10-17&yield=0.02'
    );
    expect(iframe?.getAttribute('allow')).toBe('clipboard-write');
  });

  test('syncs iframe query param updates back to the parent URL', () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

    render(
      <MemoryRouter initialEntries={['/us/california-wealth-tax']}>
        <Routes>
          <Route
            path="/:countryId/:slug"
            element={
              <IframeContent url="/us/california-wealth-tax/embed" title="California wealth tax" />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: window.location.origin,
        data: {
          type: 'urlUpdate',
          params: 'date=2025-10-17&yield=0.02',
        },
      })
    );

    expect(replaceStateSpy).toHaveBeenCalledWith(
      null,
      '',
      '/us/california-wealth-tax?date=2025-10-17&yield=0.02'
    );
  });
});
