import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import { ReportBuilderShell } from '@/pages/reportBuilder/components/ReportBuilderShell';
import { mixedPopulationReportState } from '@/tests/fixtures/pages/reportBuilder/useReportSubmissionMocks';
import { ownershipReportState } from '@/tests/fixtures/spm/reportBuilderOwnershipMocks';

vi.mock('@/pages/reportBuilder/hooks/useReportIngredientAvailability', () => ({
  useReportSPMSelectionError: () => null,
}));
vi.mock('@/components/common/BackBreadcrumb', () => ({ BackBreadcrumb: () => null }));
vi.mock('@/pages/reportBuilder/components/ReportMetaPanel', () => ({
  ReportMetaPanel: () => null,
}));
vi.mock('@/pages/reportBuilder/components/SimulationCanvas', () => ({
  SimulationCanvas: () => null,
}));

describe('ReportBuilderShell population correction', () => {
  test.each([true, false])(
    'given a hydrated mixed report with household baseline %s then explains how to correct either simulation',
    (householdFirst) => {
      const { rerender } = render(
        <ReportBuilderShell
          title="Modify report"
          actions={[]}
          setReportState={vi.fn()}
          reportState={mixedPopulationReportState(householdFirst)}
        />
      );

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Baseline and reform must use the same population type'
      );
      expect(screen.getByRole('alert')).toHaveTextContent('Swap population');

      rerender(
        <ReportBuilderShell
          title="Modify report"
          actions={[]}
          setReportState={vi.fn()}
          reportState={ownershipReportState()}
        />
      );
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    }
  );
});
