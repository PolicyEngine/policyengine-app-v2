import { renderWithCountry, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import FlagshipTopBar from '@/components/flagship/FlagshipTopBar';

// A made-up list, so these cases hold whichever tools are featured: the bar
// links whatever the list holds, and a country with no tools gets no rows.
vi.mock('@/data/featuredTools.json', () => ({
  default: {
    us: [{ slug: 'made-up-tool', label: 'Made-up tool', description: 'Made-up description.' }],
    ng: [],
  },
}));

const WEBSITE_URL = 'https://policyengine.org';
const OTHER_LINK_ROWS = ['Model documentation', 'API', 'About', 'Donate', 'GitHub'];

async function openMoreMenuRows(countryId: string) {
  renderWithCountry(<FlagshipTopBar />, countryId, `/${countryId}/build`);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: /more policyengine links/i }));
  const menu = await screen.findByRole('menu');
  return Array.from(menu.children).map((row) =>
    row.getAttribute('role') === 'separator' ? '—' : row.textContent
  );
}

describe('FlagshipTopBar with another featured list', () => {
  test('given a listed tool then the more menu links it after Research', async () => {
    // When
    const rows = await openMoreMenuRows('us');

    // Then
    expect(rows).toEqual([
      'Research',
      '—',
      'Made-up tool',
      'All interactive tools',
      '—',
      ...OTHER_LINK_ROWS,
    ]);
    expect(screen.getByRole('menuitem', { name: 'Made-up tool' })).toHaveAttribute(
      'href',
      `${WEBSITE_URL}/us/made-up-tool`
    );
  });

  test.each(['uk', 'ca', 'ng'])(
    'given %s, with no tools in the list, then the more menu has no tool rows',
    async (countryId) => {
      // When
      const rows = await openMoreMenuRows(countryId);

      // Then
      expect(rows).toEqual(['Research', ...OTHER_LINK_ROWS]);
    }
  );
});
