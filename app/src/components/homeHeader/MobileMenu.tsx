import { IconMenu2 } from '@tabler/icons-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import CountrySelector from './CountrySelector';
import { NavItemSetup } from './NavItem';

interface MobileMenuProps {
  opened: boolean;
  onOpen: () => void;
  onClose: () => void;
  navItems: NavItemSetup[];
}

export default function MobileMenu({ opened, onOpen, onClose, navItems }: MobileMenuProps) {
  return (
    <>
      {/* Mobile Burger Menu with Country Selector */}
      <div className="tw:flex tw:lg:hidden tw:items-center" style={{ gap: spacing.md }}>
        <CountrySelector />
        <button
          type="button"
          className="tw:p-1 tw:rounded tw:bg-transparent tw:border-none tw:cursor-pointer"
          onClick={onOpen}
          aria-label="Toggle navigation"
        >
          <IconMenu2 size={24} color={colors.text.inverse} />
        </button>
      </div>

      {/* Mobile Sheet */}
      <Sheet open={opened} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          className="tw:w-[300px]"
          style={{ backgroundColor: colors.primary[600] }}
        >
          <SheetHeader>
            <SheetTitle className="tw:text-white">Menu</SheetTitle>
          </SheetHeader>
          <div className="tw:flex tw:flex-col" style={{ gap: spacing.lg, padding: spacing.lg }}>
            {navItems.map((item) =>
              item.hasDropdown && item.dropdownItems ? (
                // Render dropdown as a section
                <div key={item.label}>
                  <span
                    style={{
                      color: colors.text.inverse,
                      fontWeight: typography.fontWeight.medium,
                      fontSize: typography.fontSize.sm,
                      marginBottom: spacing.xs,
                      display: 'block',
                      fontFamily: typography.fontFamily.primary,
                    }}
                  >
                    {item.label}
                  </span>
                  <div
                    className="tw:flex tw:flex-col"
                    style={{ gap: spacing.xs, paddingLeft: spacing.md }}
                  >
                    {item.dropdownItems.map((dropdownItem) => (
                      <a
                        key={dropdownItem.label}
                        href={dropdownItem.href}
                        onClick={dropdownItem.href ? undefined : dropdownItem.onClick}
                        style={{
                          color: colors.text.inverse,
                          textDecoration: 'none',
                          fontWeight: typography.fontWeight.normal,
                          fontSize: typography.fontSize.sm,
                          fontFamily: typography.fontFamily.primary,
                        }}
                      >
                        {dropdownItem.label}
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                // Render regular link
                <a
                  key={item.label}
                  href={item.href}
                  onClick={item.href ? undefined : item.onClick}
                  style={{
                    color: colors.text.inverse,
                    textDecoration: 'none',
                    fontWeight: typography.fontWeight.medium,
                    fontSize: typography.fontSize.sm,
                    fontFamily: typography.fontFamily.primary,
                    display: 'block',
                  }}
                >
                  {item.label}
                </a>
              )
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
