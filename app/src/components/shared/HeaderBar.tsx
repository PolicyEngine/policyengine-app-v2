import { Text } from '@/components/ui';
import { colors, spacing } from '@/designTokens';

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
        paddingLeft: spacing.appShell.header.padding.split(' ')[1],
        paddingRight: spacing.appShell.header.padding.split(' ')[1],
        paddingTop: spacing.appShell.header.padding.split(' ')[0],
        paddingBottom: spacing.appShell.header.padding.split(' ')[0],
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
          <Text style={{ color: 'white', fontWeight: 700 }} size="md">
            {title}
          </Text>
        )}
      </div>
      {children}
    </div>
  );
}
