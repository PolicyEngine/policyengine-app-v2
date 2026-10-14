/**
 * Where a tracked bill stands, in the three words the bill feed uses:
 * law, still a proposal, or stopped short of law.
 *
 * The tracker's statuses come from several sources ("Signed into Law",
 * "Passed One Chamber", "Sent to Governor", "Dead/Withdrawn", LegiScan
 * text), and the feed falls back to "Analyzed" for a bill the tracker
 * follows no status for. One function reads them all, so a card, a
 * filter and a count never disagree on a bill's stage.
 */
export type BillStage = 'enacted' | 'proposed' | 'failed';

export const BILL_STAGE_LABELS: Record<BillStage, string> = {
  enacted: 'Enacted',
  proposed: 'Proposed',
  failed: 'Failed',
};

/** "Veto overridden": law over the veto. Read before the veto itself. */
const OVERRIDDEN = /\boverrid/;
/** Vetoed, dead, died, withdrawn, failed or defeated: it did not become law. */
const FAILED = /\bveto|\bdead\b|\bdied\b|\bwithdrawn\b|\bfailed\b|\bdefeated\b/;
/** Signed, enacted, chaptered, or law ("Signed into Law", "Became law", "Public Law 119-21"). */
const ENACTED = /\bsigned\b|\benact|\bchaptered\b|\blaw\b/;

/**
 * A raw tracker status as a stage. Everything short of law that has not
 * stopped is proposed: introduced, in committee, passed one or both
 * chambers, sent to the governor or president. A status the tracker has
 * not set (empty, or the feed's "Analyzed") is proposed too: the tracker
 * marks a bill once it is law, so without that mark the feed never
 * calls it law.
 */
export function billStage(status: string | null | undefined): BillStage {
  const text = (status ?? '').trim().toLowerCase();
  if (OVERRIDDEN.test(text)) {
    return 'enacted';
  }
  if (FAILED.test(text)) {
    return 'failed';
  }
  return ENACTED.test(text) ? 'enacted' : 'proposed';
}
