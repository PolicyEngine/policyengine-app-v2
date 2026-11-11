import ModelCatalogGate from '@/components/flagship/ModelCatalogGate';
import { spacing } from '@/designTokens';
import { useV3SearchFileInBackground } from '@/hooks/useV3SearchCatalog';
import { useV3VariablesInBackground } from '@/hooks/useV3Variables';

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
  // On the v2 routes, the search file and the catalog version's variables
  // start downloading once the page has rendered, so they are in by the
  // time someone searches or builds a household (nothing on v1).
  useV3SearchFileInBackground();
  useV3VariablesInBackground();

  return (
    <div style={{ maxWidth: contentWidth, margin: `${spacing.md} auto 0` }}>
      <ModelCatalogGate>{children}</ModelCatalogGate>
    </div>
  );
}
