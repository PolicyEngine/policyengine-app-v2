/**
 * v3's household features that work only on the Public API's v2 routes,
 * gathered in one place: the standalone household report and saved
 * households (plan item 1D-2).
 *
 * Saved households live on the Public API's `/v2/households` and
 * `/v2/user-households`, and household reports will be saved through
 * `/v2/reports` (plan item 3B-2). So until v3 moves to v2 (plan item 4A-1)
 * no route or control reaches anything exported here, and nothing routed
 * imports this module (`householdEntryPoints.test.tsx` checks both).
 *
 * What 4A-1 changes to make them reachable:
 *
 * 1. Build's population picker (`components/flagship/reform/PopulationPicker.tsx`)
 *    lists "A household" as a disabled option marked "Soon". 4A-1 enables it:
 *    choosing it offers `SavedHouseholdPicker` or a new household, and Build's
 *    run opens `HouseholdReportPage` with that household, the draft reform,
 *    and the run bar's year and baseline.
 * 2. A report whose simulations are households shows `ReportNotSocietyWide`
 *    (`pages/flagship/Report.page.tsx`, its `householdReport` branch). 4A-1
 *    renders `HouseholdReportPage` there for household reports saved through
 *    `/v2/reports` and `/v2/user-reports` (3B-2).
 * 3. Saved households have no route. 4A-1 adds
 *    `calculator-app/src/app/[countryId]/(workspace)/households/page.tsx`
 *    rendering `SavedHouseholdsPage`, a "households" screen in
 *    `workspaceRoutes.ts` and `libs/flagship/shellRoutes.ts`, and a link in
 *    the workspace navigation.
 *
 * `HouseholdReportPage` calculates through the Public API's v1 household
 * routes, as the report section does; 3B-2 moves it to
 * `/v2/household-calculations` before 4A-1.
 */
export { default as HouseholdReportPage } from '@/pages/flagship/HouseholdReport.page';
export { default as SavedHouseholdsPage } from '@/pages/flagship/SavedHouseholds.page';
export { default as SavedHouseholdPicker } from '@/components/flagship/household/SavedHouseholdPicker';
export { default as SaveHouseholdForm } from '@/components/flagship/household/SaveHouseholdForm';
