import { useState } from 'react';
import { hasLocalAuthorityImpacts } from '@/adapters/societyWideOutputNormalizer';
import {
  outputServesLocalAreaBreakdowns,
  type UKWithheldAreas,
} from '@/adapters/ukLocalAreaBreakdownAdapter';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { SidebarTabs, type SidebarTab } from '@/components/SidebarTabs';
import { Stack, Text } from '@/components/ui';
import { AbsoluteChangeByLocalAuthority } from './local-authority/AbsoluteChangeByLocalAuthority';
import { RelativeChangeByLocalAuthority } from './local-authority/RelativeChangeByLocalAuthority';
import { UKLocalAreaBreakdownView } from './UKLocalAreaBreakdownView';

interface LocalAuthoritySubPageProps {
  output: SocietyWideReportOutput;
  /**
   * The report's policies, region and year. With them, a result without
   * local authority impacts offers to compute them (the local authority tab).
   */
  reformPolicyId?: string;
  baselinePolicyId?: string;
  region?: string;
  year?: string;
  /** For areas from a disclosure-controlled breakdown: the areas it left out. */
  withheld?: UKWithheldAreas;
}

const LOCAL_AUTHORITY_TABS: SidebarTab[] = [
  { value: 'average', label: 'Absolute change' },
  { value: 'relative', label: 'Relative change' },
];

function LocalAuthorityCharts({
  output,
  withheld,
}: {
  output: SocietyWideReportOutput;
  withheld?: UKWithheldAreas;
}) {
  const [activeTab, setActiveTab] = useState<string>('average');
  return (
    <SidebarTabs tabs={LOCAL_AUTHORITY_TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'average' && (
        <AbsoluteChangeByLocalAuthority output={output} withheld={withheld} />
      )}
      {activeTab === 'relative' && (
        <RelativeChangeByLocalAuthority output={output} withheld={withheld} />
      )}
    </SidebarTabs>
  );
}

/**
 * Local authority analysis subpage for society-wide reports
 *
 * Provides sidebar tabs to view:
 * - Absolute household income change by local authority
 * - Relative household income change by local authority
 *
 * A result that holds local authority impacts (an older saved UK report)
 * shows them. A national UK result from .py 6.10.0 on has none; given the
 * report's policies and year, the subpage offers to compute them with the
 * report's local-area breakdown.
 */
export function LocalAuthoritySubPage({
  output,
  reformPolicyId,
  baselinePolicyId,
  region,
  year,
  withheld,
}: LocalAuthoritySubPageProps) {
  if (hasLocalAuthorityImpacts(output)) {
    return <LocalAuthorityCharts output={output} withheld={withheld} />;
  }

  // Offered only for a result from a release that serves breakdowns.
  if (reformPolicyId && baselinePolicyId && year && outputServesLocalAreaBreakdowns(output)) {
    return (
      <UKLocalAreaBreakdownView
        output={output}
        request={{ reformPolicyId, baselinePolicyId, region, year }}
      >
        {(areaOutput, breakdownWithheld) => (
          <LocalAuthorityCharts output={areaOutput} withheld={breakdownWithheld?.local_authority} />
        )}
      </UKLocalAreaBreakdownView>
    );
  }

  return (
    <Stack align="center" justify="center" style={{ height: 400 }}>
      <Text c="dimmed">Local authority analysis not available for this region</Text>
    </Stack>
  );
}
