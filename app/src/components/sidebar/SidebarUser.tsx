import { colors, typography } from '../../designTokens';

interface SidebarUserProps {
  name: string;
  initials: string;
}

export default function SidebarUser({ name, initials }: SidebarUserProps) {
  return (
    <div className="tw:flex tw:items-center tw:gap-3">
      <div
        className="tw:w-8 tw:h-8 tw:rounded-full tw:flex tw:items-center tw:justify-center"
        style={{
          backgroundColor: colors.gray[100],
          color: colors.gray[700],
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.semibold,
        }}
      >
        {initials}
      </div>
      <span
        style={{
          fontSize: typography.fontSize.sm,
          lineHeight: typography.lineHeight.snug,
          fontWeight: typography.fontWeight.medium,
          color: colors.gray[900],
        }}
      >
        {name}
      </span>
    </div>
  );
}
