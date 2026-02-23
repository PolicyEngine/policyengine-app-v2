import { IconChevronDown } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { colors, typography } from '@/designTokens';

export interface DropdownItem {
  label: string;
  onClick?: () => void;
  href?: string;
}

export interface NavItemSetup {
  label: string;
  onClick?: () => void;
  href?: string;
  hasDropdown: boolean;
  dropdownItems?: DropdownItem[];
}

interface NavItemProps {
  setup: NavItemSetup;
}

const linkStyles: React.CSSProperties = {
  color: colors.text.inverse,
  fontWeight: typography.fontWeight.medium,
  fontSize: '18px',
  fontFamily: typography.fontFamily.primary,
  textDecoration: 'none',
};

/**
 * Check if href is a relative path (internal) vs absolute URL (external).
 * Type guard that narrows href to string when true.
 */
function isInternalHref(href: string | undefined): href is string {
  return !!href && href.startsWith('/');
}

/**
 * Reusable navigation item component.
 * Can be either a simple link or a dropdown menu.
 *
 * Automatically uses React Router's Link for relative paths (SPA navigation)
 * and standard <a> tags for absolute URLs (cross-app navigation).
 */
export default function NavItem({ setup }: NavItemProps) {
  const { label, onClick, href, hasDropdown, dropdownItems } = setup;

  if (hasDropdown && dropdownItems) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            className="tw:bg-transparent tw:border-none tw:cursor-pointer tw:p-0"
          >
            <div className="tw:flex tw:items-center tw:gap-1">
              <span
                style={{
                  color: colors.text.inverse,
                  fontWeight: typography.fontWeight.medium,
                  fontSize: '18px',
                  fontFamily: typography.fontFamily.primary,
                }}
              >
                {label}
              </span>
              <IconChevronDown size={18} color={colors.text.inverse} />
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="tw:w-[200px] tw:z-[1001]">
          {dropdownItems.map((item) =>
            item.href ? (
              isInternalHref(item.href) ? (
                <DropdownMenuItem key={item.label} asChild>
                  <Link to={item.href}>{item.label}</Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem key={item.label} asChild>
                  <a href={item.href}>{item.label}</a>
                </DropdownMenuItem>
              )
            ) : (
              <DropdownMenuItem key={item.label} onClick={item.onClick}>
                {item.label}
              </DropdownMenuItem>
            )
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Relative paths use React Router's Link for SPA behavior
  if (isInternalHref(href)) {
    return (
      <Link to={href} style={linkStyles}>
        {label}
      </Link>
    );
  }

  // Absolute URLs use standard anchor tag
  return (
    <a
      href={href}
      onClick={href ? undefined : onClick}
      style={linkStyles}
      className="tw:hover:underline"
    >
      {label}
    </a>
  );
}
