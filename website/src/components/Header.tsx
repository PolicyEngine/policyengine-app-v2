"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconChevronDown,
  IconMenu2,
  IconWorld,
  IconX,
} from "@tabler/icons-react";
import {
  colors,
  spacing,
  typography,
} from "@policyengine/design-system/tokens";
import { useCountryId } from "@/hooks/useCountryId";

const PolicyEngineLogo = "/assets/logos/policyengine/white.svg";

interface DropdownItem {
  label: string;
  href: string;
}

interface NavItemSetup {
  label: string;
  href?: string;
  hasDropdown: boolean;
  dropdownItems?: DropdownItem[];
  external?: boolean;
}

const COUNTRIES = [
  { id: "us", label: "United States" },
  { id: "uk", label: "United Kingdom" },
];

const navItemStyle: React.CSSProperties = {
  color: colors.text.inverse,
  fontWeight: typography.fontWeight.medium,
  fontSize: "15px",
  fontFamily: typography.fontFamily.primary,
  textDecoration: "none",
  padding: "6px 14px",
  borderRadius: "6px",
  transition: "background-color 0.15s ease",
  letterSpacing: "0.01em",
};

const hoverHandlers = {
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.12)";
  },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.backgroundColor = "transparent";
  },
};

// --- Dropdown panel ---

function DropdownPanel({
  items,
  open,
  onClose,
}: {
  items: DropdownItem[];
  open: boolean;
  onClose: () => void;
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

  if (!open && contentHeight === 0) return null;

  return (
    <>
      {/* Click-away layer */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 999,
          cursor: "default",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "100%",
          left: "50%",
          transform: visible
            ? "translateX(-50%) translateY(0)"
            : "translateX(-50%) translateY(-8px)",
          marginTop: "10px",
          minWidth: "220px",
          overflow: "hidden",
          maxHeight: visible ? `${contentHeight}px` : "0px",
          opacity: visible ? 1 : 0,
          transition:
            "max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          borderRadius: "14px",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.97), rgba(240,249,255,0.95))",
          backdropFilter: "blur(24px) saturate(200%)",
          WebkitBackdropFilter: "blur(24px) saturate(200%)",
          boxShadow:
            "0 20px 60px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.06), inset 0 0 0 1px rgba(255, 255, 255, 0.6)",
          zIndex: 1001,
        }}
      >
        <div ref={contentRef} style={{ padding: "8px" }}>
          {items.map((item, i) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                textAlign: "left",
                padding: "11px 16px",
                borderRadius: "10px",
                textDecoration: "none",
                fontSize: "14px",
                fontFamily: typography.fontFamily.primary,
                fontWeight: typography.fontWeight.semibold,
                color: colors.primary[800],
                transition:
                  "background-color 0.12s ease, color 0.12s ease, opacity 0.3s ease",
                transitionDelay: visible ? `${i * 50}ms` : "0ms",
                opacity: visible ? 1 : 0,
                lineHeight: "1.3",
                letterSpacing: "-0.01em",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary[500];
                e.currentTarget.style.color = colors.text.inverse;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = colors.primary[800];
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

// --- NavItem ---

function NavItem({ setup }: { setup: NavItemSetup }) {
  const { label, href, hasDropdown, dropdownItems } = setup;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [dropdownOpen]);

  if (hasDropdown && dropdownItems) {
    return (
      <div ref={containerRef} style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          style={{
            ...navItemStyle,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
          {...hoverHandlers}
        >
          <span>{label}</span>
          <IconChevronDown
            size={15}
            color={colors.text.inverse}
            style={{
              opacity: 0.7,
              transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </button>
        <DropdownPanel
          items={dropdownItems}
          open={dropdownOpen}
          onClose={() => setDropdownOpen(false)}
        />
      </div>
    );
  }

  if (href) {
    // External rewrite routes (Model, API) use <a> to avoid Next.js RSC prefetch 404s
    const Tag = setup.external ? "a" : Link;
    return (
      <Tag href={href} style={navItemStyle} {...hoverHandlers}>
        {label}
      </Tag>
    );
  }

  return null;
}

// --- Country selector ---

function CountrySelector() {
  const countryId = useCountryId();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [visible, setVisible] = useState(false);

  const handleCountryChange = useCallback(
    (newCountryId: string) => {
      setOpen(false);
      const pathParts = pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) {
        pathParts[0] = newCountryId;
        router.push(`/${pathParts.join("/")}`);
      } else {
        router.push(`/${newCountryId}`);
      }
    },
    [pathname, router],
  );

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

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Country selector"
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "6px",
          borderRadius: "6px",
          transition: "background-color 0.15s ease",
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
        }}
        {...hoverHandlers}
      >
        <IconWorld size={18} color={colors.text.inverse} />
      </button>

      {(open || contentHeight > 0) && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 999,
              cursor: "default",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              transform: visible ? "translateY(0)" : "translateY(-8px)",
              marginTop: "10px",
              minWidth: "220px",
              overflow: "hidden",
              maxHeight: visible ? `${contentHeight}px` : "0px",
              opacity: visible ? 1 : 0,
              transition:
                "max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              borderRadius: "14px",
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.97), rgba(240,249,255,0.95))",
              backdropFilter: "blur(24px) saturate(200%)",
              WebkitBackdropFilter: "blur(24px) saturate(200%)",
              boxShadow:
                "0 20px 60px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.06), inset 0 0 0 1px rgba(255, 255, 255, 0.6)",
              zIndex: 1001,
            }}
          >
            <div ref={contentRef} style={{ padding: "8px" }}>
              {COUNTRIES.map((country, i) => (
                <button
                  key={country.id}
                  type="button"
                  onClick={() => handleCountryChange(country.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    textAlign: "left",
                    padding: "11px 16px",
                    borderRadius: "10px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontFamily: typography.fontFamily.primary,
                    fontWeight:
                      countryId === country.id
                        ? typography.fontWeight.bold
                        : typography.fontWeight.semibold,
                    color: colors.primary[800],
                    transition:
                      "background-color 0.12s ease, color 0.12s ease, opacity 0.3s ease",
                    transitionDelay: visible ? `${i * 50}ms` : "0ms",
                    opacity: visible ? 1 : 0,
                    lineHeight: "1.3",
                    letterSpacing: "-0.01em",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primary[500];
                    e.currentTarget.style.color = colors.text.inverse;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = colors.primary[800];
                  }}
                >
                  {country.label}
                  {countryId === country.id && (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: "12px",
                        opacity: 0.6,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// --- Mobile menu ---

const mobileNavLinkStyle: React.CSSProperties = {
  color: colors.text.inverse,
  textDecoration: "none",
  fontWeight: typography.fontWeight.medium,
  fontSize: typography.fontSize.sm,
  fontFamily: typography.fontFamily.primary,
  display: "block",
};

function MobileNavLink({
  item,
  onClose,
}: {
  item: NavItemSetup;
  onClose: () => void;
}) {
  const Tag = item.external ? "a" : Link;
  return (
    <Tag href={item.href || "#"} onClick={onClose} style={mobileNavLinkStyle}>
      {item.label}
    </Tag>
  );
}

function MobileMenu({
  open,
  onClose,
  navItems,
}: {
  open: boolean;
  onClose: () => void;
  navItems: NavItemSetup[];
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        justifyContent: "flex-end",
        pointerEvents: open ? "auto" : "none",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.4)",
          opacity: open ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      />
      {/* Panel */}
      <div
        style={{
          position: "relative",
          width: "300px",
          height: "100%",
          backgroundColor: colors.primary[600],
          padding: spacing.lg,
          display: "flex",
          flexDirection: "column",
          gap: spacing.lg,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              color: colors.text.inverse,
              fontWeight: typography.fontWeight.semibold,
              fontSize: typography.fontSize.lg,
              fontFamily: typography.fontFamily.primary,
            }}
          >
            Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <IconX size={20} color={colors.text.inverse} />
          </button>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: spacing.lg,
          }}
        >
          {navItems.map((item) =>
            item.hasDropdown && item.dropdownItems ? (
              <div key={item.label}>
                <span
                  style={{
                    color: colors.text.inverse,
                    fontWeight: typography.fontWeight.medium,
                    fontSize: typography.fontSize.sm,
                    marginBottom: spacing.xs,
                    display: "block",
                    fontFamily: typography.fontFamily.primary,
                  }}
                >
                  {item.label}
                </span>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: spacing.xs,
                    paddingLeft: spacing.md,
                  }}
                >
                  {item.dropdownItems.map((dropdownItem) => (
                    <Link
                      key={dropdownItem.label}
                      href={dropdownItem.href}
                      onClick={onClose}
                      style={{
                        color: colors.text.inverse,
                        textDecoration: "none",
                        fontWeight: typography.fontWeight.normal,
                        fontSize: typography.fontSize.sm,
                        fontFamily: typography.fontFamily.primary,
                      }}
                    >
                      {dropdownItem.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <MobileNavLink key={item.label} item={item} onClose={onClose} />
            ),
          )}
        </div>
      </div>
    </div>
  );
}

// --- Main Header ---

export default function Header() {
  const countryId = useCountryId();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: NavItemSetup[] = [
    { label: "Research", href: `/${countryId}/research`, hasDropdown: false },
    {
      label: "Model",
      href: `/${countryId}/model`,
      hasDropdown: false,
      external: true,
    },
    {
      label: "API",
      href: `/${countryId}/api`,
      hasDropdown: false,
      external: true,
    },
    {
      label: "About",
      hasDropdown: true,
      dropdownItems: [
        { label: "Team", href: `/${countryId}/team` },
        { label: "Supporters", href: `/${countryId}/supporters` },
        { label: "Citations", href: `/${countryId}/citations` },
        { label: "AI & machine learning", href: `/${countryId}/ai` },
      ],
    },
    { label: "Donate", href: `/${countryId}/donate`, hasDropdown: false },
  ];

  return (
    <header
      data-testid="site-header"
      style={{
        position: "sticky",
        top: 0,
        padding: `${spacing.sm} ${spacing["2xl"]}`,
        height: spacing.layout.header,
        background: `linear-gradient(to right, ${colors.primary[800]}, ${colors.primary[600]})`,
        borderBottom: `0.5px solid ${colors.primary[700]}`,
        boxShadow: `0px 2px 4px -1px ${colors.shadow.light}, 0px 4px 6px -1px ${colors.shadow.medium}`,
        zIndex: 1000,
        fontFamily: typography.fontFamily.primary,
        width: "100%",
        boxSizing: "border-box",
        opacity: mobileOpen ? 0 : 1,
        transition: "opacity 0.1s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: "100%",
        }}
      >
        {/* Left: logo + desktop nav */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <Link
            href={`/${countryId}`}
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              marginRight: spacing.md,
            }}
          >
            <img
              src={PolicyEngineLogo}
              alt="PolicyEngine"
              style={{ height: "24px", width: "auto" }}
            />
          </Link>

          {/* Desktop nav — hidden on small screens */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
            }}
            className="tw:hidden tw:lg:flex"
          >
            {navItems.map((item) => (
              <NavItem key={item.label} setup={item} />
            ))}
          </div>
        </div>

        {/* Right: country selector (desktop) */}
        <div className="tw:hidden tw:lg:flex" style={{ alignItems: "center" }}>
          <CountrySelector />
        </div>

        {/* Right: mobile controls */}
        <div
          className="tw:flex tw:lg:hidden"
          style={{ alignItems: "center", gap: spacing.md }}
        >
          <CountrySelector />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Toggle navigation"
            style={{
              padding: "4px",
              borderRadius: "4px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            <IconMenu2 size={24} color={colors.text.inverse} />
          </button>
        </div>
      </div>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        navItems={navItems}
      />
    </header>
  );
}
