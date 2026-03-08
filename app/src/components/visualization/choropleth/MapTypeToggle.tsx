/**
 * Toggle component for switching between map visualization types
 */

import { Tabs, TabsList, TabsTrigger } from '@/components/ui';
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
    <Tabs value={value} onValueChange={(val) => onChange(val as MapVisualizationType)}>
      <TabsList>
        <TabsTrigger value="geographic">Geographic</TabsTrigger>
        <TabsTrigger value="hex">Hex grid</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
