import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test } from 'vitest';
import PopulationPicker from '@/components/flagship/reform/PopulationPicker';
import * as householdEntryPoints from '@/pages/flagship/householdEntryPoints';

/**
 * v3's standalone household report and saved households work only on API
 * v2, so until v3 moves to v2 (plan item 4A-1) nothing a user can reach
 * leads to them. These checks keep it so: the switch PR changes them on
 * purpose. (A report whose simulations are households still shows "This
 * report cannot open here": see ReportLoadStates.test.tsx.)
 */

/** app/src, whether the tests run from the app's directory or the repository's. */
const APP_SOURCE = existsSync(resolve(process.cwd(), 'src/pages/flagship'))
  ? resolve(process.cwd(), 'src')
  : resolve(process.cwd(), 'app/src');
const CALCULATOR_SOURCE = resolve(APP_SOURCE, '../../calculator-app/src');

/** The modules only the household features use, by the specifier the app imports them with. */
const UNROUTED_MODULES = [
  '@/pages/flagship/householdEntryPoints',
  '@/pages/flagship/HouseholdReport.page',
  '@/pages/flagship/SavedHouseholds.page',
  '@/components/flagship/household/SaveHouseholdForm',
  '@/components/flagship/household/SavedHouseholdPicker',
  '@/components/flagship/household/SavedHouseholdsList',
  '@/components/flagship/household/HouseholdBuilderPanel',
  '@/components/flagship/household/HouseholdNetIncomeResult',
  '@/hooks/useSavedHouseholds',
  '@/api/savedHouseholdStore',
];

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return entry.name === 'tests' || entry.name === 'node_modules' ? [] : sourceFiles(path);
    }
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

/** The app specifier a file under app/src is imported by: "@/api/savedHouseholdStore". */
function specifierOf(path: string): string | null {
  if (!path.startsWith(APP_SOURCE)) {
    return null;
  }
  return `@/${relative(APP_SOURCE, path).replace(/\.(ts|tsx)$/, '')}`;
}

describe('household entry points before the switch', () => {
  test('given Build\'s population picker then "A household" is listed, but cannot be chosen', async () => {
    const user = userEvent.setup();
    render(<PopulationPicker value="" onChange={() => {}} regions={[]} countryId="us" />);

    await user.click(screen.getByRole('button', { name: /Population/ }));

    expect(screen.getByRole('option', { name: /A household/ })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });

  test('given the app and calculator sources then only the household modules import one another', () => {
    const importers = [...sourceFiles(APP_SOURCE), ...sourceFiles(CALCULATOR_SOURCE)]
      .filter((path) => !UNROUTED_MODULES.includes(specifierOf(path) ?? ''))
      .filter((path) => {
        const source = readFileSync(path, 'utf8');
        return UNROUTED_MODULES.some(
          (specifier) => source.includes(`'${specifier}'`) || source.includes(`"${specifier}"`)
        );
      })
      .map((path) => relative(resolve(APP_SOURCE, '../..'), path));

    expect(importers).toEqual([]);
  });

  test('given the entry points then the report, the saved households page, the picker and the save form are gathered there', () => {
    expect(Object.keys(householdEntryPoints).sort()).toEqual([
      'HouseholdReportPage',
      'SaveHouseholdForm',
      'SavedHouseholdPicker',
      'SavedHouseholdsPage',
    ]);
  });
});
