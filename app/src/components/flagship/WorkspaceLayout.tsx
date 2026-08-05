import { spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useDraftReform } from '@/libs/draftReform';
import BackToHome from './BackToHome';
import ReformPreviewCard from './ReformPreviewCard';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

/**
 * Shared layout for the working sections (Ask, Build, Tracker). With
 * no draft the content sits alone in a centered column; the moment a
 * draft exists it slides in as a sticky right panel — the panel only
 * exists when there is something in it. Panes wrap to a single column
 * on narrow screens.
 */
export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const draft = useDraftReform();
  const countryId = useCurrentCountry();
  const hasDraft = Boolean(draft && draft.countryId === countryId && draft.provisions.length > 0);

  if (!hasDraft) {
    return (
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <BackToHome />
        <div style={{ maxWidth: 760, margin: `${spacing.md} auto 0` }}>{children}</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto' }}>
      <BackToHome />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: spacing['2xl'],
          alignItems: 'flex-start',
          marginTop: spacing.md,
        }}
      >
        <div style={{ flex: '1 1 480px', minWidth: 0 }}>{children}</div>
        <div
          style={{
            flex: '0 1 360px',
            minWidth: 300,
            position: 'sticky',
            top: spacing.lg,
            animation: 'pe-rail-in 240ms ease-out',
          }}
        >
          <style>{`@keyframes pe-rail-in { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }`}</style>
          <ReformPreviewCard draft={draft!} />
        </div>
      </div>
    </div>
  );
}
