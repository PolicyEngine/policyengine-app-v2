import NavItem, { NavItemSetup } from './NavItem';

interface DesktopNavigationProps {
  navItems: NavItemSetup[];
}

export default function DesktopNavigation({ navItems }: DesktopNavigationProps) {
  return (
    <div className="tw:hidden tw:lg:flex tw:items-center tw:gap-8">
      {navItems.map((item) => (
        <NavItem key={item.label} setup={item} />
      ))}
    </div>
  );
}
