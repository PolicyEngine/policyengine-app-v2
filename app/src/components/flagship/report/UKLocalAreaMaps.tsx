import { useState } from 'react';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { SegmentedControl, Stack } from '@/components/ui';
import { spacing } from '@/designTokens';
import { ConstituencySubPage } from '@/pages/report-output/ConstituencySubPage';
import { LocalAuthoritySubPage } from '@/pages/report-output/LocalAuthoritySubPage';

type UKAreaKind = 'constituencies' | 'local-authorities';

const AREA_OPTIONS = [
  { label: 'Constituencies', value: 'constituencies' as UKAreaKind },
  { label: 'Local authorities', value: 'local-authorities' as UKAreaKind },
];

/**
 * A UK report's local areas: the constituency map or the local authority
 * map, one at a time, each with v2's absolute and relative views.
 */
export default function UKLocalAreaMaps({ output }: { output: SocietyWideReportOutput }) {
  const [areaKind, setAreaKind] = useState<UKAreaKind>('constituencies');
  return (
    <Stack style={{ gap: spacing.md }}>
      <div>
        <SegmentedControl
          animated
          value={areaKind}
          onValueChange={(value) => setAreaKind(value as UKAreaKind)}
          size="xs"
          options={AREA_OPTIONS}
        />
      </div>
      {/* A new map fades in rather than snapping. */}
      <div key={areaKind} className="tw:motion-safe:fade-in-soft">
        {areaKind === 'constituencies' ? (
          <ConstituencySubPage output={output} />
        ) : (
          <LocalAuthoritySubPage output={output} />
        )}
      </div>
    </Stack>
  );
}
