import { useState } from 'react';
import { Stack, Text } from '@mantine/core';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { SidebarTabs, type SidebarTab } from '@/components/SidebarTabs';
import { AverageChangeByLocalAuthority } from './local-authority/AverageChangeByLocalAuthority';
import { RelativeChangeByLocalAuthority } from './local-authority/RelativeChangeByLocalAuthority';

interface LocalAuthoritySubPageProps {
  output: SocietyWideReportOutput;
}

const LOCAL_AUTHORITY_TABS: SidebarTab[] = [
  { value: 'average', label: 'Average change' },
  { value: 'relative', label: 'Relative change' },
];

/**
 * Local authority analysis subpage for society-wide reports
 *
 * Provides sidebar tabs to view:
 * - Average household income change by local authority
 * - Relative household income change by local authority
 *
 * Only available for UK reports with local authority data.
 */
export function LocalAuthoritySubPage({ output }: LocalAuthoritySubPageProps) {
  const [activeTab, setActiveTab] = useState<string>('average');

  // Type guard: only UK reports have constituency data (proxy for UK report check)
  if (!('local_authority_impact' in output)) {
    return (
      <Stack align="center" justify="center" h={400}>
        <Text c="dimmed">Local authority analysis not available for this region</Text>
      </Stack>
    );
  }

  return (
    <SidebarTabs tabs={LOCAL_AUTHORITY_TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'average' && <AverageChangeByLocalAuthority output={output} />}
      {activeTab === 'relative' && <RelativeChangeByLocalAuthority output={output} />}
    </SidebarTabs>
  );
}
