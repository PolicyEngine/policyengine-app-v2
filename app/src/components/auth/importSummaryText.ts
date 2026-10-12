import type { LocalImportSummary } from '@/libs/auth/localImport';
import { getCountryLabel } from '@/utils/geographyUtils';

function items(count: number): string {
  return `${count} item${count === 1 ? '' : 's'}`;
}

/** Plain-language lines describing an import's outcome. */
export function importSummaryLines(summary: LocalImportSummary): string[] {
  const lines = [`Saved ${items(summary.imported)} to your account.`];
  if (summary.skipped.length > 0) {
    lines.push(
      `${items(summary.skipped.length)} could not be saved because what they refer to no longer exists.`
    );
  }
  if (summary.invalid.length > 0) {
    lines.push(`${items(summary.invalid.length)} could not be saved.`);
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
