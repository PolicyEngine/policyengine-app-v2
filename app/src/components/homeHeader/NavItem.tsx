import { useCallback, useEffect, useRef, useState } from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
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

const navItemStyle: React.CSSProperties = {
  color: colors.text.inverse,
  fontWeight: typography.fontWeight.medium,
  fontSize: '15px',
  fontFamily: typography.fontFamily.primary,
  textDecoration: 'none',
  padding: '6px 14px',
  borderRadius: '6px',
  transition: 'background-color 0.15s ease',
  letterSpacing: '0.01em',
};

const hoverHandlers = {
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
  },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.backgroundColor = 'transparent';
  },
};

/**
 * Check if href is a relative path (internal) vs absolute URL (external).
 */
function isInternalHref(href: string | undefined): href is string {
  return !!href && href.startsWith('/');
}

/**
 * Apple-style dropdown panel with smooth height reveal and content fade.
 */
function AppleDropdown({
  items,
  open,
  onClose,
}: {
  items: DropdownItem[];
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open && contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      const timer = setTimeout(() => setContentHeight(0), 250);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleSelect = useCallback(
    (item: DropdownItem) => {
      onClose();
      if (item.href) {
        if (isInternalHref(item.href)) {
          navigate(item.href);
        } else {
          window.location.href = item.href;
        }
      } else if (item.onClick) {
        item.onClick();
      }
    },
    [navigate, onClose]
  );

  if (!open && contentHeight === 0) { return null; }

  return (
    <>
      {/* Invisible click-away layer (no dim) — sits below the header's z-index */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999,
          cursor: 'default',
        }}
      />
      {/* Dropdown panel */}
      <div
        style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: visible
            ? 'translateX(-50%) translateY(0)'
            : 'translateX(-50%) translateY(-8px)',
          marginTop: '10px',
          minWidth: '220px',
          overflow: 'hidden',
          maxHeight: visible ? `${contentHeight}px` : '0px',
          opacity: visible ? 1 : 0,
          transition:
            'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: '14px',
          background: `linear-gradient(135deg, rgba(255,255,255,0.97), rgba(240,249,255,0.95))`,
          backdropFilter: 'blur(24px) saturate(200%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
          boxShadow:
            '0 20px 60px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.06), inset 0 0 0 1px rgba(255, 255, 255, 0.6)',
          zIndex: 1001,
        }}
      >
        <div ref={contentRef} style={{ padding: '8px' }}>
          {items.map((item, i) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleSelect(item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                textAlign: 'left',
                padding: '11px 16px',
                borderRadius: '10px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: typography.fontFamily.primary,
                fontWeight: typography.fontWeight.semibold,
                color: colors.primary[800],
                transition: 'background-color 0.12s ease, color 0.12s ease, opacity 0.3s ease',
                transitionDelay: visible ? `${i * 50}ms` : '0ms',
                opacity: visible ? 1 : 0,
                lineHeight: '1.3',
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary[500];
                e.currentTarget.style.color = colors.text.inverse;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.primary[800];
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/**
 * Reusable navigation item component.
 * Can be either a simple link or a dropdown menu.
 */
export default function NavItem({ setup }: NavItemProps) {
  const { label, onClick, href, hasDropdown, dropdownItems } = setup;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!dropdownOpen) { return; }
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  // Close on Escape
  useEffect(() => {
    if (!dropdownOpen) { return; }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setDropdownOpen(false); }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [dropdownOpen]);

  if (hasDropdown && dropdownItems) {
    return (
      <div ref={containerRef} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => {
            onClick?.();
            setDropdownOpen((prev) => !prev);
          }}
          style={{
            ...navItemStyle,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          {...hoverHandlers}
        >
          <span>{label}</span>
          <IconChevronDown
            size={15}
            color={colors.text.inverse}
            style={{
              opacity: 0.7,
              transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </button>
        <AppleDropdown
          items={dropdownItems}
          open={dropdownOpen}
          onClose={() => setDropdownOpen(false)}
        />
      </div>
    );
  }

  // Relative paths use React Router's Link for SPA behavior
  if (isInternalHref(href)) {
    return (
      <Link to={href} style={navItemStyle} {...hoverHandlers}>
        {label}
      </Link>
    );
  }

  // Absolute URLs use standard anchor tag
  return (
    <a href={href} onClick={href ? undefined : onClick} style={navItemStyle} {...hoverHandlers}>
      {label}
    </a>
  );
}
