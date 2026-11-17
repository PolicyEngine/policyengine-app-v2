import type { ReactNode } from 'react';
import { IconExternalLink } from '@tabler/icons-react';
import { spacing } from '@/designTokens';

/** What the link adds to its text for screen readers. */
const NEW_TAB_NOTE = ' (opens in a new tab)';

/**
 * A link to one of the app's pages that opens in a new tab, so the admin
 * page stays as it was. It shows an external-link icon and says so to
 * screen readers.
 */
export default function NewTabLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="tw:text-primary tw:underline-offset-4 tw:hover:underline"
      style={{ display: 'inline-flex', alignItems: 'center', gap: spacing.xs }}
    >
      {children}
      <IconExternalLink size={13} aria-hidden style={{ flexShrink: 0 }} />
      <span className="tw:sr-only">{NEW_TAB_NOTE}</span>
    </a>
  );
}
