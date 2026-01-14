import { useState } from 'react';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { SidebarTabs, type SidebarTab } from '@/components/SidebarTabs';
import { AverageChangeByDistrict } from './congressional-district/AverageChangeByDistrict';
import { RelativeChangeByDistrict } from './congressional-district/RelativeChangeByDistrict';

interface CongressionalDistrictSubPageProps {
  output: SocietyWideReportOutput;
}

const DISTRICT_TABS: SidebarTab[] = [
  { value: 'average', label: 'Average change' },
  { value: 'relative', label: 'Relative change' },
];

/**
 * Congressional district analysis subpage for society-wide reports
 *
 * Provides sidebar tabs to view:
 * - Average household income change by congressional district
 * - Relative household income change by congressional district
 *
 * Only available for US reports with congressional district data.
 */
export function CongressionalDistrictSubPage({ output }: CongressionalDistrictSubPageProps) {
  const [activeTab, setActiveTab] = useState<string>('average');

  // TODO: Re-enable this guard after API integration is complete
  // Type guard: only US reports have congressional district data
  // if (!('congressional_district_impact' in output) || !output.congressional_district_impact) {
  //   return (
  //     <Stack align="center" justify="center" h={400}>
  //       <Text c="dimmed">Congressional district analysis not available for this region</Text>
  //     </Stack>
  //   );
  // }

  return (
    <SidebarTabs tabs={DISTRICT_TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'average' && <AverageChangeByDistrict output={output} />}
      {activeTab === 'relative' && <RelativeChangeByDistrict output={output} />}
    </SidebarTabs>
  );
}
