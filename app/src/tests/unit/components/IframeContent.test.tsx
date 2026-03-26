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
              <IframeContent
                url="/us/california-wealth-tax/embed"
                title="California wealth tax"
              />
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
});
