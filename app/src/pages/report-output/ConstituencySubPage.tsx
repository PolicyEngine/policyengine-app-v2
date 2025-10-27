import { useState } from 'react';
import { Stack, Text } from '@mantine/core';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { SidebarTabs, type SidebarTab } from '@/components/SidebarTabs';
import { AverageChangeByConstituency } from './constituency/AverageChangeByConstituency';
import { RelativeChangeByConstituency } from './constituency/RelativeChangeByConstituency';

interface ConstituencySubPageProps {
  output: SocietyWideReportOutput;
}

const CONSTITUENCY_TABS: SidebarTab[] = [
  { value: 'average', label: 'Average Change' },
  { value: 'relative', label: 'Relative Change' },
];

/**
 * Constituency analysis subpage for society-wide reports
 *
 * Provides sidebar tabs to view:
 * - Average household income change by constituency
 * - Relative household income change by constituency
 *
 * Only available for UK reports with constituency data.
 */
export function ConstituencySubPage({ output }: ConstituencySubPageProps) {
  const [activeTab, setActiveTab] = useState<string>('average');

  // Type guard: only UK reports have constituency data
  if (!('constituency_impact' in output)) {
    return (
      <Stack align="center" justify="center" h={400}>
        <Text c="dimmed">Constituency analysis not available for this region</Text>
      </Stack>
    );
  }

  return (
    <SidebarTabs tabs={CONSTITUENCY_TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'average' && <AverageChangeByConstituency output={output} />}
      {activeTab === 'relative' && <RelativeChangeByConstituency output={output} />}
    </SidebarTabs>
  );
}
