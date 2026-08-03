import {
  IconAdjustments,
  IconBook,
  IconBrandGithub,
  IconBrandSlack,
  IconCpu,
  IconFileDescription,
  IconFolder,
  IconGavel,
  IconGitBranch,
  IconMail,
  IconMessageCircle,
  IconPlus,
  IconScale,
  IconUsers,
} from '@tabler/icons-react';
import { Button } from '@/components/ui';
import { WEBSITE_URL } from '@/constants';
import { useAppLocation } from '@/contexts/LocationContext';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { isFlagshipShellEnabled } from '@/libs/featureFlags';
import { colors, typography } from '../designTokens';
import SidebarDivider from './sidebar/SidebarDivider';
import SidebarNavItem from './sidebar/SidebarNavItem';
import SidebarSection from './sidebar/SidebarSection';

interface SidebarProps {
  isOpen?: boolean;
}

export default function Sidebar({ isOpen = true }: SidebarProps) {
  const location = useAppLocation();
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();

  // All internal navigation paths include the country prefix for consistency with v1 app
  const flagshipShell = isFlagshipShellEnabled();

  const navItems = flagshipShell
    ? [
        { label: 'Ask', icon: IconMessageCircle, path: `/${countryId}/ask` },
        { label: 'Tracker', icon: IconGavel, path: `/${countryId}/tracker` },
        { label: 'Build', icon: IconAdjustments, path: `/${countryId}/build` },
        { label: 'Library', icon: IconFolder, path: `/${countryId}/library` },
      ]
    : [
        { label: 'Reports', icon: IconFileDescription, path: `/${countryId}/reports` },
        { label: 'Simulations', icon: IconGitBranch, path: `/${countryId}/simulations` },
        { label: 'Policies', icon: IconScale, path: `/${countryId}/policies` },
        { label: 'Households', icon: IconUsers, path: `/${countryId}/households` },
      ];

  const resourceItems = [
    {
      label: 'GitHub',
      icon: IconBrandGithub,
      path: 'https://github.com/PolicyEngine',
      external: true,
    },
    {
      label: 'Join Slack',
      icon: IconBrandSlack,
      // NOTE: Temporary 30-day joining link added on November 2, 2025
      // Will expire after 30 days OR after 100 people join the Slack
      // TODO: Update this link when it expires
      path: 'https://join.slack.com/t/policyengine-group/shared_invite/zt-3h69snorb-2MPNgFuRGucqGLG_15tijQ',
      external: true,
    },
    {
      label: 'View research',
      icon: IconBook,
      path: `${WEBSITE_URL}/${countryId}/research`,
      external: true,
    },
    {
      label: 'Model overview',
      icon: IconCpu,
      path: `${WEBSITE_URL}/${countryId}/model`,
      external: true,
    },
  ];

  const accountItems = [
    {
      label: 'Contact support',
      icon: IconMail,
      path: 'mailto:hello@policyengine.org',
      external: true,
    },
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="tw:h-full tw:bg-white tw:flex tw:flex-col tw:overflow-y-auto"
      style={{
        borderRight: `1px solid ${colors.border.light}`,
      }}
    >
      <div className="tw:px-4 tw:py-4">
        {/* Flagship shell: a report is the output of a reform, so the
            primary action is starting a reform, not the report wizard. */}
        {flagshipShell ? (
          <Button
            className="tw:w-full"
            style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
            }}
            onClick={() => nav.push(`/${countryId}/build`)}
          >
            New reform
            <IconPlus size={16} />
          </Button>
        ) : (
          <Button
            className="tw:w-full"
            style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
            }}
            onClick={() => nav.push(`/${countryId}/reports/create`)}
          >
            New report
            <IconPlus size={16} />
          </Button>
        )}
      </div>

      <div className="tw:flex tw:flex-col tw:flex-1">
        <SidebarSection>
          {navItems.map((item) => (
            <SidebarNavItem key={item.path} {...item} isActive={location.pathname === item.path} />
          ))}
        </SidebarSection>

        <SidebarDivider />

        <SidebarSection title="Resources">
          {resourceItems.map((item) => (
            <SidebarNavItem
              key={item.path}
              {...item}
              isActive={!item.external && location.pathname === item.path}
            />
          ))}
        </SidebarSection>

        <SidebarDivider />

        <SidebarSection title="My account">
          {accountItems.map((item) => (
            <SidebarNavItem key={item.path} {...item} isActive={location.pathname === item.path} />
          ))}
        </SidebarSection>
      </div>
    </div>
  );
}
