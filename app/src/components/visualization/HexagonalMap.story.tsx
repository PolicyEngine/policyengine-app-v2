import type { Meta, StoryObj } from '@storybook/react';
import type { HexMapDataPoint } from '@/types/visualization/HexMapDataPoint';
import { getColorScale } from '@/utils/visualization/colorScales';
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

const constituencies = [
  'Westminster North',
  'Holborn and St Pancras',
  'Islington South',
  'Hackney South',
  'Bethnal Green',
  'Poplar and Limehouse',
  'Bermondsey',
  'Camberwell',
  'Dulwich',
  'Lewisham East',
  'Greenwich',
  'Woolwich',
  'Erith',
  'Bexleyheath',
  'Bromley',
  'Croydon Central',
  'Mitcham',
  'Tooting',
  'Battersea',
  'Chelsea',
];

function generateDivergingData(count: number): HexMapDataPoint[] {
  const random = seededRandom(42);
  const points: HexMapDataPoint[] = [];
  const cols = 5;
  for (let i = 0; i < Math.min(count, constituencies.length); i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const xOffset = row % 2 === 1 ? 0.5 : 0;
    points.push({
      id: constituencies[i].toLowerCase().replace(/\s+/g, '-'),
      label: constituencies[i],
      value: (random() - 0.5) * 2000,
      x: col + xOffset,
      y: row,
    });
  }
  return points;
}

function generateAllPositiveData(count: number): HexMapDataPoint[] {
  const points = generateDivergingData(count);
  return points.map((p) => ({
    ...p,
    value: Math.abs(p.value) + 50,
  }));
}

export const UKConstituencies: Story = {
  args: {
    data: generateDivergingData(20),
    config: {
      height: 400,
    },
  },
};

export const AllPositive: Story = {
  args: {
    data: generateAllPositiveData(20),
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
