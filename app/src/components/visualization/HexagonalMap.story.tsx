import type { Meta, StoryObj } from '@storybook/react';
import type { HexMapDataPoint } from '@/types/visualization/HexMapDataPoint';
import { getColorScale } from '@/utils/visualization/colorScales';
import { placeOnUKHexLayout, UK_HEX_LAYOUTS } from './choropleth/ukHexLayout';
import { HexagonalMap } from './HexagonalMap';

const meta: Meta<typeof HexagonalMap> = {
  title: 'Report output/HexagonalMap',
  component: HexagonalMap,
};

export default meta;
type Story = StoryObj<typeof HexagonalMap>;

// Simple deterministic pseudo-random number generator (mulberry32)
function seededRandom(initialSeed: number): () => number {
  let s = initialSeed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Every constituency in the app's layout, labelled by its ONS code (the
 * layout holds no names), with seeded values from -1,000 to 1,000.
 */
function generateConstituencyData(): HexMapDataPoint[] {
  const random = seededRandom(42);
  return placeOnUKHexLayout(
    'constituency',
    Object.keys(UK_HEX_LAYOUTS.constituency).map((code) => ({
      id: code,
      label: code,
      value: (random() - 0.5) * 2000,
      code,
    }))
  );
}

function generateAllPositiveData(): HexMapDataPoint[] {
  return generateConstituencyData().map((point) => ({
    ...point,
    value: Math.abs(point.value) + 50,
  }));
}

export const UKConstituencies: Story = {
  args: {
    data: generateConstituencyData(),
    config: {
      height: 400,
    },
  },
};

export const AllPositive: Story = {
  args: {
    data: generateAllPositiveData(),
    config: {
      height: 400,
      colorScale: {
        colors: getColorScale('diverging-gray-teal'),
        tickFormat: '.2f',
        symmetric: false,
      },
    },
  },
};
