import { spacing } from '@/designTokens';
import AuthMenu from '../auth/AuthMenu';
import CountrySelector from './CountrySelector';

export default function HeaderActionButtons() {
  return (
    <div className="tw:flex tw:items-center" style={{ gap: spacing.md }}>
      <CountrySelector />
      {/* Renders nothing unless sign-in is enabled. */}
      <AuthMenu variant="inverse" />
    </div>
  );
}
