import { useCallback, useEffect, useRef, useState } from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import { AppLink } from '@/components/AppLink';
import { useAppPathname } from '@/contexts/LocationContext';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, typography } from '@/designTokens';

export interface DropdownItem {
  label: string;
  onClick?: () => void;
  href?: string;
  /** Nested children rendered indented under this item. One level deep only. */
  children?: DropdownItem[];
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

const NAV_ITEM_PADDING_X = 14;
const NAV_UNDERLINE_INSET = 10;
const DROPDOWN_GAP = 10;
const HOVER_OPEN_DELAY_MS = 100;
const HOVER_CLOSE_DELAY_MS = 200;

const navItemStyle: React.CSSProperties = {
  color: colors.text.inverse,
  fontWeight: typography.fontWeight.medium,
  fontSize: '15px',
  fontFamily: typography.fontFamily.primary,
  textDecoration: 'none',
  padding: `8px ${NAV_ITEM_PADDING_X}px`,
  letterSpacing: '0.01em',
  position: 'relative',
};

function NavUnderline({ visible }: { visible: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: `${NAV_UNDERLINE_INSET}px`,
        right: `${NAV_UNDERLINE_INSET}px`,
        bottom: '2px',
        height: '2px',
        borderRadius: '2px',
        backgroundColor: colors.text.inverse,
        transform: visible ? 'scaleX(1)' : 'scaleX(0)',
        transformOrigin: 'center',
        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'none',
      }}
    />
  );
}

function isInternalHref(href: string | undefined): href is string {
  return !!href && href.startsWith('/');
}

function itemMatches(href: string | undefined, pathname: string): boolean {
  if (!href || !isInternalHref(href)) {
    return false;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isItemActive(item: NavItemSetup, pathname: string): boolean {
  if (item.hasDropdown && item.dropdownItems) {
    return item.dropdownItems.some(
      (child) =>
        itemMatches(child.href, pathname) ||
        (child.children?.some((grand) => itemMatches(grand.href, pathname)) ?? false)
    );
  }
  return itemMatches(item.href, pathname);
}

function DropdownRow({
  item,
  depth,
  index,
  visible,
  onSelect,
}: {
  item: DropdownItem;
  depth: number;
  index: number;
  visible: boolean;
  onSelect: (item: DropdownItem) => void;
}) {
  const isChild = depth > 0;
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        textAlign: 'left',
        padding: `${isChild ? 8 : 11}px 16px ${isChild ? 8 : 11}px ${16 + depth * 16}px`,
        borderRadius: '10px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontSize: isChild ? '13px' : '14px',
        fontFamily: typography.fontFamily.primary,
        fontWeight: isChild ? typography.fontWeight.medium : typography.fontWeight.semibold,
        color: isChild ? colors.primary[700] : colors.primary[800],
        transition: `background-color 0.12s ease 0ms, color 0.12s ease 0ms, opacity 0.3s ease ${
          visible ? index * 30 : 0
        }ms`,
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
        e.currentTarget.style.color = isChild ? colors.primary[700] : colors.primary[800];
      }}
    >
      {item.label}
    </button>
  );
}

function DropdownPanel({
  items,
  open,
  onClose,
  onSelect,
}: {
  items: DropdownItem[];
  open: boolean;
  onClose: () => void;
  onSelect: (item: DropdownItem) => void;
}) {
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

  if (!open && contentHeight === 0) {
    return null;
  }

  const rows: Array<{ item: DropdownItem; depth: number }> = [];
  for (const item of items) {
    rows.push({ item, depth: 0 });
    if (item.children) {
      for (const child of item.children) {
        rows.push({ item: child, depth: 1 });
      }
    }
  }

  const handleSelect = (item: DropdownItem) => {
    onClose();
    onSelect(item);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        paddingTop: `${DROPDOWN_GAP}px`,
        zIndex: 1001,
      }}
    >
      <div
        style={{
          transform: visible ? 'translateY(0)' : 'translateY(-8px)',
          minWidth: '220px',
          overflow: 'hidden',
          maxHeight: visible ? `${contentHeight}px` : '0px',
          opacity: visible ? 1 : 0,
          transition:
            'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.97), rgba(240,249,255,0.95))',
          backdropFilter: 'blur(24px) saturate(200%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
          boxShadow:
            '0 20px 60px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.06), inset 0 0 0 1px rgba(255, 255, 255, 0.6)',
        }}
      >
        <div ref={contentRef} style={{ padding: '8px' }}>
          {rows.map(({ item, depth }, i) => (
            <DropdownRow
              key={`${item.label}-${item.href ?? ''}-${depth}`}
              item={item}
              depth={depth}
              index={i}
              visible={visible}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function NavItem({ setup }: NavItemProps) {
  const { label, onClick, href, hasDropdown, dropdownItems } = setup;
  const nav = useAppNavigate();
  const pathname = useAppPathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = isItemActive(setup, pathname);

  const clearTimers = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    if (!dropdownOpen) {
      return;
    }
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [dropdownOpen]);

  const handleMouseEnter = () => {
    setHovered(true);
    if (!hasDropdown) {
      return;
    }
    clearTimers();
    openTimerRef.current = setTimeout(() => setDropdownOpen(true), HOVER_OPEN_DELAY_MS);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    if (!hasDropdown) {
      return;
    }
    clearTimers();
    closeTimerRef.current = setTimeout(() => setDropdownOpen(false), HOVER_CLOSE_DELAY_MS);
  };

  const underlineVisible = active || hovered || dropdownOpen;

  const handleDropdownSelect = (item: DropdownItem) => {
    if (item.href) {
      if (isInternalHref(item.href)) {
        nav.push(item.href);
      } else {
        window.location.href = item.href;
      }
    } else if (item.onClick) {
      item.onClick();
    }
  };

  if (hasDropdown && dropdownItems) {
    return (
      <div
        ref={containerRef}
        style={{ position: 'relative' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          type="button"
          onClick={() => {
            onClick?.();
            setDropdownOpen((prev) => !prev);
          }}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
          style={{
            ...navItemStyle,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
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
          <NavUnderline visible={underlineVisible} />
        </button>
        <DropdownPanel
          items={dropdownItems}
          open={dropdownOpen}
          onClose={() => setDropdownOpen(false)}
          onSelect={handleDropdownSelect}
        />
      </div>
    );
  }

  if (isInternalHref(href)) {
    return (
      <AppLink
        to={href}
        style={navItemStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        aria-current={active ? 'page' : undefined}
      >
        {label}
        <NavUnderline visible={underlineVisible} />
      </AppLink>
    );
  }

  return (
    <a
      href={href}
      onClick={href ? undefined : onClick}
      style={navItemStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      {label}
      <NavUnderline visible={underlineVisible} />
    </a>
  );
}
