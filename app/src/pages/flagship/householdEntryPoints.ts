/**
 * v3's household features that work only on the Public API's v2 routes,
 * gathered in one place: the standalone household report and saved
 * households.
 *
 * Saved households live on the Public API's `/v2/households` and
 * `/v2/user-households`, and household reports will be saved through
 * `/v2/reports`. So until v3 moves to the v2 routes, no route or control
 * reaches anything exported here, and nothing routed imports this module
 * or the modules behind it (`householdEntryPoints.test.tsx` checks both).
 *
 * What the change that moves v3 to the v2 routes does to reach them:
 *
 * 1. Build's population picker (`components/flagship/reform/PopulationPicker.tsx`)
 *    lists "A household" as a disabled option marked "Soon". The change
 *    enables it: choosing it offers `SavedHouseholdPicker` or a new
 *    household, and Build's run opens `HouseholdReportPage` with that
 *    household, the draft reform, and the run bar's year and baseline.
 * 2. A report whose simulations are households shows `ReportNotSocietyWide`
 *    (`pages/flagship/Report.page.tsx`, its `householdReport` branch). The
 *    change renders `HouseholdReportPage` there for household reports saved
 *    through `/v2/reports` and `/v2/user-reports`.
 * 3. Saved households have no route. The change adds
 *    `calculator-app/src/app/[countryId]/(workspace)/households/page.tsx`
 *    rendering `SavedHouseholdsPage`, a "households" screen in
 *    `workspaceRoutes.ts` and `libs/flagship/shellRoutes.ts`, and a link in
 *    the workspace navigation.
 *
 * Before then, `HouseholdReportPage`'s calculations move from the Public
 * API's v1 household routes to `/v2/household-calculations`, and saving
 * changes to a saved household needs `PATCH /v2/user-households` to accept
 * `household_id`.
 */
export { default as HouseholdReportPage } from '@/pages/flagship/HouseholdReport.page';
export { default as SavedHouseholdsPage } from '@/pages/flagship/SavedHouseholds.page';
export { default as SavedHouseholdPicker } from '@/components/flagship/household/SavedHouseholdPicker';
export { default as SaveHouseholdForm } from '@/components/flagship/household/SaveHouseholdForm';
