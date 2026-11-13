import { createEvent, fireEvent, screen, userEvent } from '@test-utils';

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
 * following the link (a Cmd/Ctrl-click opening a new tab, say). A recorder on
 * window has the last word on this click alone: it is added once the click
 * reaches document, so it runs after any window listener the page added
 * during the click, and it ignores other clicks dispatched meanwhile. It then
 * cancels the click itself, because jsdom cannot follow it. A click the page
 * stops before document is answered by the click's own flag.
 */
export function clickIsCancelled(row: HTMLElement, init: MouseEventInit) {
  const click = createEvent.click(row, init);
  let cancelledByPage: boolean | undefined;
  const record = (event: Event) => {
    if (event === click) {
      cancelledByPage = event.defaultPrevented;
      event.preventDefault();
    }
  };
  const addRecorder = (event: Event) => {
    if (event === click) {
      window.addEventListener('click', record);
    }
  };
  document.addEventListener('click', addRecorder);
  try {
    fireEvent(row, click);
  } finally {
    document.removeEventListener('click', addRecorder);
    window.removeEventListener('click', record);
  }
  return cancelledByPage ?? click.defaultPrevented;
}
