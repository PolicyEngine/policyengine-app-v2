import { colors, typography } from '../../designTokens';

interface SidebarSectionProps {
  title?: string;
  children: React.ReactNode;
}

export default function SidebarSection({ title, children }: SidebarSectionProps) {
  return (
    <div className="tw:flex tw:flex-col tw:gap-1 tw:px-2 tw:py-2">
      {title && (
        <span
          className="tw:px-3 tw:pb-1"
          style={{
            fontSize: typography.fontSize.xs,
            lineHeight: typography.lineHeight.normal,
            fontWeight: typography.fontWeight.medium,
            color: colors.text.secondary,
          }}
        >
          {title}
        </span>
      )}
      <div className="tw:flex tw:flex-col tw:gap-0.5">{children}</div>
    </div>
  );
}
