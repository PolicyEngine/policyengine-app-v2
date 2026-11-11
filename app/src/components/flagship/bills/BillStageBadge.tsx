import { Badge } from '@/components/ui';
import { colors } from '@/designTokens';
import { BILL_STAGE_LABELS, billStage, type BillStage } from '@/libs/flagship/billStage';

/** Law reads in teal; a proposal and a stopped bill stay quiet, one filled and one outlined. */
const STAGE_COLORS: Record<BillStage, React.CSSProperties> = {
  enacted: { background: colors.primary[50], color: colors.primary[700] },
  proposed: { background: colors.gray[100], color: colors.text.secondary },
  failed: {
    background: colors.background.primary,
    color: colors.text.secondary,
    borderColor: colors.border.medium,
  },
};

/**
 * A bill's stage — Enacted, Proposed or Failed — as a small badge; none
 * when the tracker follows no status for the bill.
 */
export default function BillStageBadge({ status }: { status: string }) {
  const stage = billStage(status);
  if (!stage) {
    return null;
  }
  return (
    <Badge variant="secondary" style={STAGE_COLORS[stage]}>
      {BILL_STAGE_LABELS[stage]}
    </Badge>
  );
}
