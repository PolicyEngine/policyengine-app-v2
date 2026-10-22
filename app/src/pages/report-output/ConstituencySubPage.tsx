import { useState } from 'react';
import { hasConstituencyImpacts } from '@/adapters/societyWideOutputNormalizer';
import {
  outputServesLocalAreaBreakdowns,
  type UKWithheldAreas,
} from '@/adapters/ukLocalAreaBreakdownAdapter';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { SidebarTabs, type SidebarTab } from '@/components/SidebarTabs';
import { Stack, Text } from '@/components/ui';
import { AbsoluteChangeByConstituency } from './constituency/AbsoluteChangeByConstituency';
import { RelativeChangeByConstituency } from './constituency/RelativeChangeByConstituency';
import { UKLocalAreaBreakdownView } from './UKLocalAreaBreakdownView';

interface ConstituencySubPageProps {
  output: SocietyWideReportOutput;
  /**
   * The report's policies, region and year. With them, a result without
   * constituency impacts offers to compute them (the constituency tab).
   */
  reformPolicyId?: string;
  baselinePolicyId?: string;
  region?: string;
  year?: string;
  /** For areas from a disclosure-controlled breakdown: the areas it left out. */
  withheld?: UKWithheldAreas;
}

const CONSTITUENCY_TABS: SidebarTab[] = [
  { value: 'average', label: 'Absolute change' },
  { value: 'relative', label: 'Relative change' },
];

function ConstituencyCharts({
  output,
  withheld,
}: {
  output: SocietyWideReportOutput;
  withheld?: UKWithheldAreas;
}) {
  const [activeTab, setActiveTab] = useState<string>('average');
  return (
    <SidebarTabs tabs={CONSTITUENCY_TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'average' && (
        <AbsoluteChangeByConstituency output={output} withheld={withheld} />
      )}
      {activeTab === 'relative' && (
        <RelativeChangeByConstituency output={output} withheld={withheld} />
      )}
    </SidebarTabs>
  );
}

/**
 * Constituency analysis subpage for society-wide reports
 *
 * Provides sidebar tabs to view:
 * - Absolute household income change by constituency
 * - Relative household income change by constituency
 *
 * A result that holds constituency impacts (an older saved UK report) shows
 * them. A national UK result from .py 6.10.0 on has none; given the report's
 * policies and year, the subpage offers to compute them with the report's
 * local-area breakdown.
 */
export function ConstituencySubPage({
  output,
  reformPolicyId,
  baselinePolicyId,
  region,
  year,
  withheld,
}: ConstituencySubPageProps) {
  if (hasConstituencyImpacts(output)) {
    return <ConstituencyCharts output={output} withheld={withheld} />;
  }

  // Offered only for a result from a release that serves breakdowns.
  if (reformPolicyId && baselinePolicyId && year && outputServesLocalAreaBreakdowns(output)) {
    return (
      <UKLocalAreaBreakdownView
        output={output}
        request={{ reformPolicyId, baselinePolicyId, region, year }}
      >
        {(areaOutput, breakdownWithheld) => (
          <ConstituencyCharts output={areaOutput} withheld={breakdownWithheld?.constituency} />
        )}
      </UKLocalAreaBreakdownView>
    );
  }

  return (
    <Stack align="center" justify="center" style={{ height: 400 }}>
      <Text c="dimmed">Constituency analysis not available for this region</Text>
    </Stack>
  );
}
