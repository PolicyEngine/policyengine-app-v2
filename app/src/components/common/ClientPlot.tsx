import { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui';

type PlotComponent = React.ComponentType<Record<string, unknown>>;

let cachedPlotComponent: PlotComponent | null = null;
let plotComponentPromise: Promise<PlotComponent> | null = null;

function loadPlotComponent(): Promise<PlotComponent> {
  if (cachedPlotComponent) {
    return Promise.resolve(cachedPlotComponent);
  }

  if (!plotComponentPromise) {
    plotComponentPromise = import('react-plotly.js').then((mod) => {
      cachedPlotComponent = mod.default as PlotComponent;
      return cachedPlotComponent;
    });
  }

  return plotComponentPromise;
}

function getFallbackHeight(style: unknown): number | string {
  if (style && typeof style === 'object' && 'height' in style) {
    const maybeHeight = (style as { height?: number | string }).height;
    if (maybeHeight !== undefined) {
      return maybeHeight;
    }
  }

  return 400;
}

/**
 * Client-only Plotly wrapper for pages that may be server-rendered.
 * Plotly touches `window` at module scope, so we defer the import until after mount.
 */
export function ClientPlot(props: Record<string, unknown>) {
  const [Plot, setPlot] = useState<PlotComponent | null>(() => cachedPlotComponent);

  useEffect(() => {
    let cancelled = false;

    if (!Plot) {
      loadPlotComponent()
        .then((component) => {
          if (!cancelled) {
            setPlot(() => component);
          }
        })
        .catch((error) => {
          console.error('Failed to load Plotly chart:', error);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [Plot]);

  if (!Plot) {
    return (
      <div
        className="tw:flex tw:items-center tw:justify-center"
        style={{ width: '100%', height: getFallbackHeight(props.style) }}
      >
        <Spinner size="md" />
      </div>
    );
  }

  return <Plot {...props} />;
}
