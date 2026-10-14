import { IconExternalLink } from '@tabler/icons-react';
import { Button } from '@/components/ui';
import { colors, typography } from '@/designTokens';
import { BILL_TRACKER_URL } from '@/libs/flagship/billTracker';

/** A bill's page in the bill tracker, beside the report's other source links. */
export function BillTrackerLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="tw:inline-flex tw:items-center tw:gap-0.5"
      style={{
        color: colors.text.secondary,
        fontSize: typography.fontSize.xs,
        fontFamily: typography.fontFamily.primary,
      }}
    >
      Bill tracker
      <IconExternalLink size={11} />
    </a>
  );
}

/** The bill tracker's home, where every tracked bill is listed. */
export function BillTrackerHomeButton() {
  return (
    <Button variant="outline" asChild>
      <a href={BILL_TRACKER_URL} target="_blank" rel="noreferrer">
        Bill tracker
        <IconExternalLink size={16} />
      </a>
    </Button>
  );
}
