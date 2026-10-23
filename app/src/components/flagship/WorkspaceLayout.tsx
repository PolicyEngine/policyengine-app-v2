import { spacing } from '@/designTokens';

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

  return <div style={{ maxWidth: contentWidth, margin: `${spacing.md} auto 0` }}>{children}</div>;
}
