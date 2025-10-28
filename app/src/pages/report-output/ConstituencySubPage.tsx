import { useState } from 'react';
import { Tabs, Stack, Text } from '@mantine/core';
import { useSelector } from 'react-redux';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import type { RootState } from '@/store';
import { AverageChangeByConstituency } from './constituency/AverageChangeByConstituency';
import { RelativeChangeByConstituency } from './constituency/RelativeChangeByConstituency';

interface ConstituencySubPageProps {
  output: SocietyWideReportOutput;
}

/**
 * Constituency analysis subpage for society-wide reports
 *
 * Provides tabs to view:
 * - Average household income change by constituency
 * - Relative household income change by constituency
 *
 * Only available for UK reports with constituency data.
 */
export function ConstituencySubPage({ output }: ConstituencySubPageProps) {
  const [activeTab, setActiveTab] = useState<string>('average');

  // Get metadata from Redux store
  const metadata = useSelector((state: RootState) => state.metadata);

  // Type guard: only UK reports have constituency data
  if (!('constituency_impact' in output)) {
    return (
      <Stack align="center" justify="center" h={400}>
        <Text c="dimmed">Constituency analysis not available for this region</Text>
      </Stack>
    );
  }

  return (
    <Tabs value={activeTab} onChange={(val) => setActiveTab(val || 'average')}>
      <Tabs.List>
        <Tabs.Tab value="average">Average Change</Tabs.Tab>
        <Tabs.Tab value="relative">Relative Change</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="average" pt="md">
        <AverageChangeByConstituency output={output} metadata={metadata} />
      </Tabs.Panel>

      <Tabs.Panel value="relative" pt="md">
        <RelativeChangeByConstituency output={output} metadata={metadata} />
      </Tabs.Panel>
    </Tabs>
  );
}
