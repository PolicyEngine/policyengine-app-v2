import { useState } from 'react';
import { Stack, Text } from '@mantine/core';
import type { EconomicImpactResponse } from '@/api/v2/economyAnalysis';
import { SidebarTabs, type SidebarTab } from '@/components/SidebarTabs';
import { AbsoluteChangeByConstituency } from './constituency/AbsoluteChangeByConstituency';
import { RelativeChangeByConstituency } from './constituency/RelativeChangeByConstituency';

interface ConstituencySubPageProps {
  output: EconomicImpactResponse;
}

const CONSTITUENCY_TABS: SidebarTab[] = [
  { value: 'average', label: 'Absolute change' },
  { value: 'relative', label: 'Relative change' },
];

/**
 * Constituency analysis subpage for society-wide reports
 *
 * Provides sidebar tabs to view:
 * - Absolute household income change by constituency
 * - Relative household income change by constituency
 *
 * Only available for UK reports with constituency data.
 */
export function ConstituencySubPage({ output }: ConstituencySubPageProps) {
  const [activeTab, setActiveTab] = useState<string>('average');

  // Type guard: only UK reports have constituency data
  if (!output.constituency_impact?.length) {
    return (
      <Stack align="center" justify="center" h={400}>
        <Text c="dimmed">Constituency analysis not available for this region</Text>
      </Stack>
    );
  }

  return (
    <SidebarTabs tabs={CONSTITUENCY_TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'average' && <AbsoluteChangeByConstituency output={output} />}
      {activeTab === 'relative' && <RelativeChangeByConstituency output={output} />}
    </SidebarTabs>
  );
}
