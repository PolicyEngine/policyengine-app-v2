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
 * A menu's rows in document order: every element in it, or in a group that
 * wraps them, is one row, whatever it is, and parts nested inside a row are
 * not rows of their own.
 */
function rowElements(parent: HTMLElement): HTMLElement[] {
  return Array.from(parent.children as HTMLCollectionOf<HTMLElement>).flatMap((child) =>
    child.dataset.slot === 'dropdown-menu-group' ? rowElements(child) : [child]
  );
}

/** Only the dropdown's own separator counts, so a bare `role="separator"` reads as a row. */
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
 * following the link (a Cmd/Ctrl-click opening a new tab, say). A listener on
 * window, after every handler on the page, records the answer and then
 * cancels the click itself, because jsdom cannot follow it. A click the page
 * stops before it reaches window is answered by the dispatch's own result.
 */
export function clickIsCancelled(row: HTMLElement, init: MouseEventInit) {
  let cancelledByPage: boolean | undefined;
  const record = (event: Event) => {
    cancelledByPage = event.defaultPrevented;
    event.preventDefault();
  };
  window.addEventListener('click', record);
  try {
    const notCancelled = fireEvent.click(row, init);
    return cancelledByPage ?? !notCancelled;
  } finally {
    window.removeEventListener('click', record);
  }
}
