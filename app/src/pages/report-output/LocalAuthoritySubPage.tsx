import { useState } from 'react';
import { Stack, Text } from '@mantine/core';
import type { EconomicImpactResponse } from '@/api/v2/economyAnalysis';
import { SidebarTabs, type SidebarTab } from '@/components/SidebarTabs';
import { AbsoluteChangeByLocalAuthority } from './local-authority/AbsoluteChangeByLocalAuthority';
import { RelativeChangeByLocalAuthority } from './local-authority/RelativeChangeByLocalAuthority';

interface LocalAuthoritySubPageProps {
  output: EconomicImpactResponse;
}

const LOCAL_AUTHORITY_TABS: SidebarTab[] = [
  { value: 'average', label: 'Absolute change' },
  { value: 'relative', label: 'Relative change' },
];

/**
 * Local authority analysis subpage for society-wide reports
 *
 * Provides sidebar tabs to view:
 * - Absolute household income change by local authority
 * - Relative household income change by local authority
 *
 * Only available for UK reports with local authority data.
 */
export function LocalAuthoritySubPage({ output }: LocalAuthoritySubPageProps) {
  const [activeTab, setActiveTab] = useState<string>('average');

  // Type guard: only UK reports have local authority data
  if (!output.local_authority_impact?.length) {
    return (
      <Stack align="center" justify="center" h={400}>
        <Text c="dimmed">Local authority analysis not available for this region</Text>
      </Stack>
    );
  }

  return (
    <SidebarTabs tabs={LOCAL_AUTHORITY_TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'average' && <AbsoluteChangeByLocalAuthority output={output} />}
      {activeTab === 'relative' && <RelativeChangeByLocalAuthority output={output} />}
    </SidebarTabs>
  );
}
