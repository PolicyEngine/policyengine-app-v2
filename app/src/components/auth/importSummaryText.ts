import type { LocalImportSummary } from '@/libs/auth/localImport';
import { IMPORT_SKIP_REASONS } from '@/types/v2User';
import { getCountryLabel } from '@/utils/geographyUtils';

function items(count: number): string {
  return `${count} item${count === 1 ? '' : 's'}`;
}

/** Plain-language lines describing an import's outcome. */
export function importSummaryLines(summary: LocalImportSummary): string[] {
  const lines = [`Saved ${items(summary.imported)} to your account.`];
  const missing = summary.skipped.filter(
    (note) => note.reason === IMPORT_SKIP_REASONS.UNKNOWN_LEGACY_REFERENCE
  ).length;
  const notAccepted = summary.skipped.length - missing + summary.invalid.length;
  if (missing > 0) {
    lines.push(
      `${items(missing)} could not be saved because what ${
        missing === 1 ? 'it refers' : 'they refer'
      } to no longer exists.`
    );
  }
  if (notAccepted > 0) {
    lines.push(`${items(notAccepted)} could not be saved.`);
  }
  if (summary.unsupported.length > 0) {
    const countries = [
      ...new Set(summary.unsupported.map((note) => getCountryLabel(note.countryId))),
    ].join(', ');
    lines.push(
      `${items(summary.unsupported.length)} from ${countries} stay on this device: accounts store US and UK work only.`
    );
  }
  if (summary.failed.length > 0) {
    lines.push(`${items(summary.failed.length)} did not go through. You can try again later.`);
  }
  lines.push('Nothing was removed from this device.');
  return lines;
}
