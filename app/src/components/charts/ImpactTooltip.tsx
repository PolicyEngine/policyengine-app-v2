import { TOOLTIP_STYLE } from './tooltipStyle';

interface ImpactTooltipEntry {
  name: string;
  hoverText: string;
}

interface ImpactTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ImpactTooltipEntry }>;
}

/**
 * Shared tooltip for impact bar charts (poverty, inequality, distributional).
 * Displays a bold name header and a pre-formatted hover text paragraph.
 */
export function ImpactTooltip({ active, payload }: ImpactTooltipProps) {
  if (!active || !payload?.[0]) {
    return null;
  }
  const data = payload[0].payload;
  return (
    <div style={{ ...TOOLTIP_STYLE, maxWidth: 300 }}>
      <p style={{ fontWeight: 600, margin: 0 }}>{data.name}</p>
      <p style={{ margin: '4px 0 0', fontSize: 13, whiteSpace: 'pre-wrap' }}>{data.hoverText}</p>
    </div>
  );
}
