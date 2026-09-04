import { spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useDraftReform } from '@/libs/draftReform';
import ReformPreviewCard from './ReformPreviewCard';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  /** Browsing surfaces (card grids) use the full width; working views stay at reading width. */
  wide?: boolean;
}

/**
 * Shared layout for the working sections (Ask, Build, Reforms). The
 * content sits in a centered column; the moment a draft exists its
 * panel appears — rendered here, docked by SidePanel into the shell's
 * right plane, so the layout never manages rail geometry itself.
 */
export default function WorkspaceLayout({ children, wide = false }: WorkspaceLayoutProps) {
  const draft = useDraftReform();
  const countryId = useCurrentCountry();
  const hasDraft = Boolean(draft && draft.countryId === countryId && draft.provisions.length > 0);
  const contentWidth = wide ? 1400 : 760;

  return (
    <div style={{ maxWidth: contentWidth, margin: `${spacing.md} auto 0` }}>
      {children}
      {hasDraft && <ReformPreviewCard draft={draft!} />}
    </div>
  );
}
