import { IconExternalLink } from '@tabler/icons-react';
import { colors, typography } from '@/designTokens';

/** A bill's page in the bill tracker, beside the report's other source links. */
export default function BillTrackerLink({ href }: { href: string }) {
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
