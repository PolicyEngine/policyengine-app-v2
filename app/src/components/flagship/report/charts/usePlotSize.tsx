import { useCallback, useLayoutEffect, useState, type ReactElement } from 'react';
import { usePlotArea } from 'recharts';
import {
  FALLBACK_PLOT_HEIGHT,
  FALLBACK_PLOT_WIDTH,
} from '@/components/flagship/report/charts/barLayout';

interface PlotSize {
  width: number;
  height: number;
}

/** Reports the plot area's size from inside a Recharts chart. Renders nothing. */
function PlotSizeProbe({ onSize }: { onSize: (size: PlotSize) => void }) {
  const area = usePlotArea();
  const width = area?.width ?? 0;
  const height = area?.height ?? 0;
  useLayoutEffect(() => {
    if (width > 0 && height > 0) {
      onSize({ width, height });
    }
  }, [width, height, onSize]);
  return null;
}

/**
 * The chart's plot size in pixels, measured once the chart lays out, so
 * the layout can leave label room in pixels. Render `probe` inside the
 * chart. The measure settles: the height drives the domain, and the domain
 * changes only the y-axis's width; the width drives only which labels show.
 */
export function usePlotSize(fallbackHeight = FALLBACK_PLOT_HEIGHT): {
  plotWidth: number;
  plotHeight: number;
  probe: ReactElement;
} {
  const [measured, setMeasured] = useState<PlotSize | null>(null);
  const onSize = useCallback((size: PlotSize) => {
    setMeasured((previous) =>
      previous &&
      Math.abs(previous.width - size.width) < 0.5 &&
      Math.abs(previous.height - size.height) < 0.5
        ? previous
        : size
    );
  }, []);
  return {
    plotWidth: measured?.width ?? FALLBACK_PLOT_WIDTH,
    plotHeight: measured?.height ?? fallbackHeight,
    probe: <PlotSizeProbe onSize={onSize} />,
  };
}
