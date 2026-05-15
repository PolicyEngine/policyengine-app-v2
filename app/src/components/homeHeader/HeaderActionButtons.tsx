import ThemeToggle from '@/components/ThemeToggle';
import { spacing } from '@/designTokens';
import CountrySelector from './CountrySelector';

export default function HeaderActionButtons() {
  return (
    <div className="tw:flex tw:items-center" style={{ gap: spacing.sm }}>
      <ThemeToggle />
      <CountrySelector />
    </div>
  );
}
