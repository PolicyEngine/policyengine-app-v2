import type { LocalImportSummary } from '@/libs/auth/localImport';
import { IMPORT_SKIP_REASONS } from '@/types/v2User';
import { getCountryLabel } from '@/utils/geographyUtils';

function items(count: number): string {
  return `${count} item${count === 1 ? '' : 's'}`;
}

/** Plain-language lines describing an import's outcome. */
export function importSummaryLines(summary: LocalImportSummary): string[] {
  const lines = [`Saved ${items(summary.imported)} to your account.`];
  const skippedFor = (reason: string) =>
    summary.skipped.filter((note) => note.reason === reason).length;
  const missing = skippedFor(IMPORT_SKIP_REASONS.UNKNOWN_LEGACY_REFERENCE);
  const elsewhere = skippedFor(IMPORT_SKIP_REASONS.CLIENT_REF_CONFLICT);
  const notAccepted = summary.skipped.length - missing - elsewhere + summary.invalid.length;
  if (missing > 0) {
    lines.push(
      `${items(missing)} could not be saved because what ${
        missing === 1 ? 'it refers' : 'they refer'
      } to no longer exists.`
    );
  }
  if (elsewhere > 0) {
    lines.push(
      `${items(elsewhere)} could not be saved because your account already has ${
        elsewhere === 1 ? 'it' : 'them'
      } under another country.`
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
