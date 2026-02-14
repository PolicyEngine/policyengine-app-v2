import { RECHARTS_WATERMARK } from '@/utils/chartUtils';

/**
 * PolicyEngine logo watermark for Recharts charts.
 * Renders a right-aligned logo image below the chart.
 */
export function ChartWatermark() {
  return (
    <img
      src={RECHARTS_WATERMARK.src}
      alt=""
      style={{
        display: 'block',
        marginLeft: 'auto',
        width: RECHARTS_WATERMARK.width,
        opacity: RECHARTS_WATERMARK.opacity,
      }}
    />
  );
}
