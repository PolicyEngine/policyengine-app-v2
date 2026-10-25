import { renderWithCountry, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import FlagshipTopBar from '@/components/flagship/FlagshipTopBar';

// A made-up list, so these cases hold whichever tools are featured: the bar
// links whatever the list holds, in its order (not alphabetical, so a sort
// would show), and a country with no tools gets no rows.
vi.mock('@/data/featuredTools.json', () => ({
  default: {
    us: [
      { slug: 'zeta-tool', label: 'Zeta tool', description: 'Zeta description.' },
      { slug: 'alpha-tool', label: 'Alpha tool', description: 'Alpha description.' },
    ],
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
  test('given listed tools then the more menu links them after Research, in list order', async () => {
    // When
    const rows = await openMoreMenuRows('us');

    // Then
    expect(rows).toEqual([
      'Research',
      '—',
      'Zeta tool',
      'Alpha tool',
      'All interactive tools',
      '—',
      ...OTHER_LINK_ROWS,
    ]);
    expect(screen.getByRole('menuitem', { name: 'Zeta tool' })).toHaveAttribute(
      'href',
      `${WEBSITE_URL}/us/zeta-tool`
    );
    expect(screen.getByRole('menuitem', { name: 'Alpha tool' })).toHaveAttribute(
      'href',
      `${WEBSITE_URL}/us/alpha-tool`
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
