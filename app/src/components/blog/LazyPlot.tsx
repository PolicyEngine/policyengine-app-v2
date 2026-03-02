import { lazy, Suspense } from 'react';
import { Spinner } from '@/components/ui';

const PlotComponent = lazy(() =>
  import('react-plotly.js').then((mod) => ({ default: mod.default }))
);

/**
 * Lazy-loaded Plotly chart component.
 * Only loads the react-plotly.js bundle when rendered (typically in blog posts).
 * This keeps Plotly (~3MB) out of the main application bundle.
 */
export function LazyPlot(props: React.ComponentProps<typeof PlotComponent>) {
  return (
    <Suspense
      fallback={
        <div className="tw:flex tw:items-center tw:justify-center" style={{ height: 400 }}>
          <Spinner size="md" />
        </div>
      }
    >
      <PlotComponent {...props} />
    </Suspense>
  );
}
