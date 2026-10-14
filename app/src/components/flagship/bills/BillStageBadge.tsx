import { Badge } from '@/components/ui';
import { colors } from '@/designTokens';
import { BILL_STAGE_LABELS, billStage, type BillStage } from '@/libs/flagship/billStage';

/** Law reads in teal; a proposal and a stopped bill stay quiet. */
const STAGE_COLORS: Record<BillStage, { background: string; color: string }> = {
  enacted: { background: colors.primary[50], color: colors.primary[700] },
  proposed: { background: colors.gray[100], color: colors.text.secondary },
  failed: { background: colors.gray[50], color: colors.text.tertiary },
};

/** A bill's stage — Enacted, Proposed or Failed — as a small badge. */
export default function BillStageBadge({ status }: { status: string }) {
  const stage = billStage(status);
  return (
    <Badge variant="secondary" style={STAGE_COLORS[stage]}>
      {BILL_STAGE_LABELS[stage]}
    </Badge>
  );
}
