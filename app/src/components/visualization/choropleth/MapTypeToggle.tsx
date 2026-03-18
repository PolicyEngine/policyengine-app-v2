/**
 * Toggle component for switching between map visualization types
 */

import { SegmentedControl } from '@/components/ui';
import type { MapVisualizationType } from './types';

interface MapTypeToggleProps {
  /** Current map visualization type */
  value: MapVisualizationType;
  /** Callback when the visualization type changes */
  onChange: (value: MapVisualizationType) => void;
}

const MAP_TYPE_OPTIONS = [
  { label: 'Geographic', value: 'geographic' as MapVisualizationType },
  { label: 'Hex grid', value: 'hex' as MapVisualizationType },
];

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
      onValueChange={(val) => onChange(val as MapVisualizationType)}
      size="xs"
      options={MAP_TYPE_OPTIONS}
    />
  );
}
