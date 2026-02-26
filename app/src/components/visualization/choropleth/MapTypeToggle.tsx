/**
 * Toggle component for switching between map visualization types
 */

import { SegmentedControl } from '@mantine/core';
import type { MapVisualizationType } from './types';

interface MapTypeToggleProps {
  /** Current map visualization type */
  value: MapVisualizationType;
  /** Callback when the visualization type changes */
  onChange: (value: MapVisualizationType) => void;
}

/**
 * Toggle component for switching between geographic and hex map views.
 *
 * @example
 * ```tsx
 * const [mapType, setMapType] = useState<MapVisualizationType>('geographic');
 *
 * <MapTypeToggle value={mapType} onChange={setMapType} />
 * <USDistrictChoroplethMap data={data} visualizationType={mapType} />
 * ```
 */
export function MapTypeToggle({ value, onChange }: MapTypeToggleProps) {
  return (
    <SegmentedControl
      value={value}
      onChange={(val) => onChange(val as MapVisualizationType)}
      data={[
        { label: 'Geographic', value: 'geographic' },
        { label: 'Hex grid', value: 'hex' },
      ]}
      size="xs"
    />
  );
}
