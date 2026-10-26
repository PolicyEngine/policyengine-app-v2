import { fireEvent, screen, userEvent } from '@test-utils';

export const WEBSITE_URL = 'https://policyengine.org';

/** The website links after the tools group, the same in every country. */
export const OTHER_LINK_ROWS = ['Model documentation', 'API', 'About', 'Donate', 'GitHub'];

/** Opens one of the bar's menus by its button's name and returns the menu. */
export async function openMenu(name: string | RegExp) {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name }));
  return screen.findByRole('menu');
}

export const openMoreMenu = () => openMenu(/more policyengine links/i);
export const openPhoneMenu = () => openMenu('Menu');

/**
 * A menu's items, labels and separators in document order, through any
 * groups that wrap them. Only the dropdown's own parts count, so a bare
 * `role="separator"` element shows up as a missing separator.
 */
function rowElements(menu: HTMLElement) {
  return Array.from(
    menu.querySelectorAll<HTMLElement>(
      '[data-slot^="dropdown-menu-"]:not([data-slot="dropdown-menu-group"])'
    )
  );
}

const isSeparator = (row: HTMLElement) => row.dataset.slot === 'dropdown-menu-separator';

/** A menu's rows in order, each separator as '—'. */
export function menuRows(menu: HTMLElement) {
  return rowElements(menu).map((row) => (isSeparator(row) ? '—' : row.textContent));
}

/** A menu's link rows from `from` on, as label and href, each separator as '—'. */
export function linkRows(menu: HTMLElement, from = 0) {
  return rowElements(menu)
    .slice(from)
    .map((row) =>
      isSeparator(row)
        ? '—'
        : { tag: row.tagName, label: row.textContent, href: row.getAttribute('href') }
    );
}

/**
 * Whether the page cancels a click on `row`, which would stop the browser
 * following the link (a Cmd/Ctrl-click opening a new tab, say). The check
 * runs last, on window, and then cancels the click itself, because jsdom
 * cannot follow it.
 */
export function clickIsCancelled(row: HTMLElement, init: MouseEventInit) {
  let cancelled = false;
  const record = (event: Event) => {
    cancelled = event.defaultPrevented;
    event.preventDefault();
  };
  window.addEventListener('click', record);
  try {
    fireEvent.click(row, init);
  } finally {
    window.removeEventListener('click', record);
  }
  return cancelled;
}
