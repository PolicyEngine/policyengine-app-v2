import { lazy, Suspense } from 'react';
import { Center, Loader } from '@mantine/core';
import { colors } from '@/designTokens';

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
        <Center h={400}>
          <Loader size="md" color={colors.primary[500]} />
        </Center>
      }
    >
      <PlotComponent {...props} />
    </Suspense>
  );
}
