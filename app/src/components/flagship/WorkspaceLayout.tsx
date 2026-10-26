import { spacing } from '@/designTokens';
import { useV3SearchFileInBackground } from '@/hooks/useV3SearchCatalog';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  /** Browsing surfaces (card grids) use the full width; working views stay at reading width. */
  wide?: boolean;
}

/**
 * Shared layout for the working sections (Ask, Build, Reforms): the
 * content in a centered column. The draft reform is Build's own page,
 * not a panel here — elsewhere the top bar links back to it.
 */
export default function WorkspaceLayout({ children, wide = false }: WorkspaceLayoutProps) {
  const contentWidth = wide ? 1400 : 760;
  // On the v2 routes, the search file starts downloading once the page has
  // rendered, so it is in by the time someone searches (nothing on v1).
  useV3SearchFileInBackground();

  return <div style={{ maxWidth: contentWidth, margin: `${spacing.md} auto 0` }}>{children}</div>;
}
