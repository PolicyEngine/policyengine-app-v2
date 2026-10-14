import { UNTRACKED_BILL_STATUS } from '@/api/billFeed';

/**
 * Where a tracked bill stands, in the three words the bill feed uses:
 * law, still a proposal, or stopped short of law.
 *
 * The tracker's statuses are a fixed list ("Introduced", "Passed One
 * Chamber", "Sent to Governor", "Signed into Law", "Vetoed",
 * "Dead/Withdrawn", ...); a few other common words for the same stages
 * read too. One function reads them all, so a card, a filter and a count
 * never disagree on a bill's stage.
 */
export type BillStage = 'enacted' | 'proposed' | 'failed';

export const BILL_STAGE_LABELS: Record<BillStage, string> = {
  enacted: 'Enacted',
  proposed: 'Proposed',
  failed: 'Failed',
};

/** "Veto overridden": law over the veto. Read before the veto itself. */
const OVERRIDDEN = /\bveto(es)? overridden\b|\boverride (passed|succeeded)\b/;
/** Vetoed, dead, died, withdrawn, failed or defeated: it did not become law. */
const FAILED = /\bvetoed\b|\bpocket veto\b|\bdead\b|\bdied\b|\bwithdrawn\b|\bfailed\b|\bdefeated\b/;
/** Signed, enacted or chaptered, or into law ("Signed into Law", "Became law", "Public Law 119-21"). */
const ENACTED = /\bsigned\b|\benacted\b|\bchaptered\b|\b(public|into|became) law\b/;

/**
 * A raw tracker status as a stage. Everything short of law that has not
 * stopped is proposed: introduced, in committee, passed one or both
 * chambers, sent to the governor or president.
 *
 * A bill the tracker follows no status for (empty, or the feed's
 * "Analyzed") has no stage: it may be law or not, so it shows no badge
 * and sits under no stage filter.
 */
export function billStage(status: string | null | undefined): BillStage | null {
  const text = (status ?? '').trim().toLowerCase();
  if (text === '' || text === UNTRACKED_BILL_STATUS.toLowerCase()) {
    return null;
  }
  if (OVERRIDDEN.test(text)) {
    return 'enacted';
  }
  if (FAILED.test(text)) {
    return 'failed';
  }
  return ENACTED.test(text) ? 'enacted' : 'proposed';
}
