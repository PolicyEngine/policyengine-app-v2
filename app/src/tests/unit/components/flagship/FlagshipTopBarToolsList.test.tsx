import { renderWithCountry, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import FlagshipTopBar from '@/components/flagship/FlagshipTopBar';

// A made-up Tools menu, so these cases hold whichever tools apps.json marks:
// the bar links whatever the menu lists, in the menu's order (not alphabetical
// here, so a re-sort would show), and a country with no tools gets no rows.
vi.mock('@/utils/toolsMenu', () => ({
  getToolsMenuEntries: (countryId: string) =>
    countryId === 'us'
      ? [
          { slug: 'zeta-tool', label: 'Zeta tool' },
          { slug: 'alpha-tool', label: 'Alpha tool' },
        ]
      : [],
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

describe('FlagshipTopBar with another Tools menu', () => {
  test('given listed tools then the more menu links them after Research, in the menu order', async () => {
    // When
    const rows = await openMoreMenuRows('us');

    // Then
    expect(rows).toEqual(['Research', '—', 'Zeta tool', 'Alpha tool', '—', ...OTHER_LINK_ROWS]);
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
    'given %s, with no tools, then the more menu has no tool rows',
    async (countryId) => {
      // When
      const rows = await openMoreMenuRows(countryId);

      // Then
      expect(rows).toEqual(['Research', ...OTHER_LINK_ROWS]);
    }
  );
});
