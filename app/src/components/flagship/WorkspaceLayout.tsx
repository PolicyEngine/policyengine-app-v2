import { spacing } from '@/designTokens';
import BackToHome from './BackToHome';
import DraftRail from './DraftRail';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

/**
 * Shared two-pane layout for the working sections (Ask, Build,
 * Tracker): content on the left, the draft reform always visible in a
 * sticky right rail — no scrolling to find your work. Panes wrap to a
 * single column on narrow screens.
 */
export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
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
        <div style={{ flex: '0 1 360px', minWidth: 300, position: 'sticky', top: spacing.lg }}>
          <DraftRail />
        </div>
      </div>
    </div>
  );
}
