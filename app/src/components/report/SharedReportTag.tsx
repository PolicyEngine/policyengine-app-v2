/**
 * SharedReportTag - Subtle indicator shown next to report title for shared views
 *
 * Displays a small badge indicating the report is being viewed via a shared link.
 * Non-intrusive styling that doesn't distract from the report content.
 */

import { Badge } from '@mantine/core';

export function SharedReportTag() {
  return (
    <Badge size="sm" variant="light" color="gray" radius="sm">
      Shared
    </Badge>
  );
}
