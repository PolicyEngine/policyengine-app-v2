import { colors } from '../../designTokens';

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
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {initials}
      </div>
      <span
        style={{
          fontSize: 14,
          lineHeight: '20px',
          fontWeight: 500,
          color: colors.gray[900],
        }}
      >
        {name}
      </span>
    </div>
  );
}
