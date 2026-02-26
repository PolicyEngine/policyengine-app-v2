import type { Meta, StoryObj } from '@storybook/react';
import type { ChoroplethDataPoint } from './choropleth';
import { USDistrictChoroplethMap } from './choropleth';

const meta: Meta<typeof USDistrictChoroplethMap> = {
  title: 'Report output/USDistrictChoroplethMap',
  component: USDistrictChoroplethMap,
};

export default meta;
type Story = StoryObj<typeof USDistrictChoroplethMap>;

// Simple deterministic pseudo-random number generator (mulberry32)
function seededRandom(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const states = [
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
];
const stateNames: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
};

function generateDistrictData(valueRange: [number, number], seed: number): ChoroplethDataPoint[] {
  const random = seededRandom(seed);
  const data: ChoroplethDataPoint[] = [];
  const [min, max] = valueRange;

  for (const state of states) {
    const districtCount =
      state === 'CA' ? 52 : state === 'FL' ? 28 : state === 'AK' || state === 'DE' ? 1 : 7;
    for (let d = 1; d <= districtCount; d++) {
      const districtId = `${state}-${String(d).padStart(2, '0')}`;
      data.push({
        geoId: districtId,
        label: `${stateNames[state]}'s ${ordinal(d)} congressional district`,
        value: min + random() * (max - min),
      });
    }
  }

  return data;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export const DivergingValues: Story = {
  args: {
    data: generateDistrictData([-500, 500], 123),
    config: {
      height: 450,
      colorScale: {
        symmetric: true,
      },
      formatValue: (val: number) =>
        val.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }),
    },
  },
};

export const AllNegative: Story = {
  args: {
    data: generateDistrictData([-1000, -50], 456),
    config: {
      height: 450,
      colorScale: {
        symmetric: false,
      },
      formatValue: (val: number) =>
        val.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }),
    },
  },
};
