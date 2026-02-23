import { IconExternalLink } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui';
import { colors, spacing } from '../../designTokens';

interface SidebarNavItemProps {
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  isActive?: boolean;
  external?: boolean;
  disabled?: boolean;
}

export default function SidebarNavItem({
  label,
  icon: Icon,
  path,
  isActive,
  external,
  disabled,
}: SidebarNavItemProps) {
  const content = (
    <div className="tw:flex tw:items-center tw:gap-5 tw:flex-nowrap">
      <Icon
        size={20}
        stroke={1.5}
        color={disabled ? colors.gray[400] : isActive ? colors.gray[700] : colors.text.secondary}
      />
      <span
        className="tw:flex-1 tw:text-sm"
        style={{
          fontWeight: isActive ? 500 : 400,
          color: disabled ? colors.gray[400] : isActive ? colors.gray[900] : colors.gray[700],
        }}
      >
        {label}
      </span>
      {external && (
        <IconExternalLink
          size={14}
          stroke={1.5}
          color={disabled ? colors.gray[400] : colors.text.secondary}
        />
      )}
    </div>
  );

  const buttonStyles: React.CSSProperties = {
    display: 'block',
    width: '100%',
    borderRadius: spacing.radius.element,
    padding: '8px 12px',
    backgroundColor: isActive ? colors.gray[50] : 'transparent',
    textDecoration: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    border: 'none',
  };

  if (disabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            style={buttonStyles}
            onClick={(e) => e.preventDefault()}
            className="tw:hover:bg-gray-50"
          >
            {content}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Under development</TooltipContent>
      </Tooltip>
    );
  }

  if (external) {
    return (
      <a
        href={path}
        target="_blank"
        rel="noopener noreferrer"
        style={buttonStyles}
        className="tw:hover:bg-gray-50"
      >
        {content}
      </a>
    );
  }

  return (
    <Link to={path} style={buttonStyles} className="tw:hover:bg-gray-50">
      {content}
    </Link>
  );
}
