import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test } from 'vitest';
import PopulationPicker from '@/components/flagship/reform/PopulationPicker';
import * as householdEntryPoints from '@/pages/flagship/householdEntryPoints';

/**
 * v3's standalone household report and saved households work only on the
 * Public API's v2 routes, so until v3 moves to them nothing a user can
 * reach leads there. These checks keep it so: the change that moves v3
 * changes them on purpose. (A report whose simulations are households
 * still shows "This report cannot open here": see ReportLoadStates.test.tsx.)
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
  '@/components/flagship/household/DeleteSavedHouseholdDialog',
  '@/components/flagship/household/savedHouseholdDisplay',
  '@/components/flagship/household/HouseholdNetIncomeResult',
  '@/hooks/useSavedHouseholds',
  '@/api/savedHouseholdStore',
  '@/models/household/v2DocumentCodec',
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

/** Every module a source file names: imports (static, dynamic, side effect), re-exports, requires. */
function importedSpecifiers(source: string): string[] {
  const specifierPattern =
    /(?:\bfrom\s+|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)(['"])([^'"]+)\1/g;
  return [...source.matchAll(specifierPattern)].map((match) => match[2]);
}

/**
 * The app specifier an import names, however it is written: "@/…" as is,
 * and a relative path ("./HouseholdReport.page") resolved from the
 * importing file. Package imports name no app module.
 */
function appSpecifierOf(importer: string, specifier: string): string | null {
  if (specifier.startsWith('@/')) {
    return specifier.replace(/\.(ts|tsx)$/, '');
  }
  if (specifier.startsWith('.')) {
    return specifierOf(resolve(dirname(importer), specifier));
  }
  return null;
}

/** Whether a source file names one of the household modules, by either specifier form. */
function importsAHouseholdModule(importer: string, source: string): boolean {
  return importedSpecifiers(source).some((specifier) =>
    UNROUTED_MODULES.includes(appSpecifierOf(importer, specifier) ?? '')
  );
}

describe('household entry points before v3 moves to the v2 routes', () => {
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
      .filter((path) => importsAHouseholdModule(path, readFileSync(path, 'utf8')))
      .map((path) => relative(resolve(APP_SOURCE, '../..'), path));

    expect(importers).toEqual([]);
  });

  test.each([
    ['an @/ specifier', "import HouseholdReportPage from '@/pages/flagship/HouseholdReport.page';"],
    ['a relative path', "import HouseholdReportPage from './HouseholdReport.page';"],
  ])('given a routed page importing the report by %s then the check finds it', (_form, source) => {
    const routedPage = resolve(APP_SOURCE, 'pages/flagship/Report.page.tsx');

    expect(importsAHouseholdModule(routedPage, source)).toBe(true);
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
