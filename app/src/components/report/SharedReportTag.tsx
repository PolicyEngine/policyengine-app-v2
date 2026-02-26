/**
 * SharedReportTag - Subtle indicator shown next to report title for shared views
 *
 * Displays a small badge indicating the report is being viewed via a shared link.
 * Non-intrusive styling that doesn't distract from the report content.
 */

import { Badge } from '@/components/ui';

export function SharedReportTag() {
  return (
    <Badge variant="secondary" className="tw:text-xs">
      Shared
    </Badge>
  );
}
