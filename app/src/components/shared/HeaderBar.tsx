import { Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';

const PolicyEngineLogo = '/assets/logos/policyengine/white.svg';

interface HeaderBarProps {
  title?: string;
  children?: React.ReactNode;
  showLogo?: boolean;
}

export default function HeaderBar({ title, children, showLogo = false }: HeaderBarProps) {
  return (
    <div
      className="tw:flex tw:items-center tw:justify-between"
      style={{
        backgroundColor: colors.primary[900],
        padding: spacing.appShell.header.padding,
        minHeight: spacing.appShell.header.height,
      }}
    >
      <div className="tw:flex tw:items-center">
        {showLogo && (
          <img
            src={PolicyEngineLogo}
            alt="PolicyEngine"
            style={{
              height: 20,
              width: 'auto',
              marginRight: title ? 12 : 0,
            }}
          />
        )}
        {title && (
          <Text style={{ color: colors.white, fontWeight: typography.fontWeight.bold }} size="md">
            {title}
          </Text>
        )}
      </div>
      {children}
    </div>
  );
}
