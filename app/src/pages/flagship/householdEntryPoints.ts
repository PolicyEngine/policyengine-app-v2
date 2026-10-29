/**
 * v3's household features that work only on the Public API's v2 routes,
 * gathered in one place: the standalone household report, saved
 * household reports and saved households.
 *
 * Saved households live on the Public API's `/v2/households` and
 * `/v2/user-households`, and household reports are saved as household
 * reports on `/v2/reports` through `/v2/user-reports`. So until v3 moves to
 * the v2 routes, no route or control reaches anything exported here, and
 * nothing routed imports this module or the modules behind it
 * (`householdEntryPoints.test.tsx` checks both).
 *
 * v3's household calculations themselves (the report section's households,
 * the household report's and the variation charts) already choose their
 * routes by V3_API_ROUTES: v1's household routes while it is 'v1', and
 * `/v2/household-calculations` once it is 'v2'.
 *
 * What the change that moves v3 to the v2 routes does to reach them:
 *
 * 1. Build's population picker (`components/flagship/reform/PopulationPicker.tsx`)
 *    lists "A household" as a disabled option marked "Soon". The change
 *    enables it: choosing it offers `SavedHouseholdPicker` or a new
 *    household, and Build's run opens `HouseholdReportPage` with that
 *    household, the draft reform as a `/v2/policies` policy, and the run
 *    bar's year and baseline. With saved work in the account, its result
 *    can then be saved as a household report (`SaveHouseholdReportForm`),
 *    whose link is `/{country}/report/{saved report ID}`.
 * 2. A report link names a saved report (`/v2/user-reports`, read without a
 *    credential through `/v2/shared-reports`). A report whose simulations
 *    are households shows `ReportNotSocietyWide`
 *    (`pages/flagship/Report.page.tsx`, its `householdReport` branch). The
 *    change renders `SavedHouseholdReportPage` there, with the link's ID,
 *    when the saved report names a household report
 *    (`GET /v2/reports/{report_id}` answers kind "household").
 * 3. Saved households have no route. The change adds
 *    `calculator-app/src/app/[countryId]/(workspace)/households/page.tsx`
 *    rendering `SavedHouseholdsPage`, a "households" screen in
 *    `workspaceRoutes.ts` and `libs/flagship/shellRoutes.ts`, and a link in
 *    the workspace navigation.
 *
 * Before then, saving changes to a saved household needs
 * `PATCH /v2/user-households` to accept `household_id`.
 */
export { default as HouseholdReportPage } from '@/pages/flagship/HouseholdReport.page';
export { default as SavedHouseholdReportPage } from '@/pages/flagship/SavedHouseholdReport.page';
export { default as SavedHouseholdsPage } from '@/pages/flagship/SavedHouseholds.page';
export { default as SavedHouseholdPicker } from '@/components/flagship/household/SavedHouseholdPicker';
export { default as SaveHouseholdForm } from '@/components/flagship/household/SaveHouseholdForm';
