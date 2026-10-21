/**
 * UK scorecard programmes, and the parameters that change each one.
 *
 * The US links a reform to scorecard claims through the traced parameter →
 * variable dependency map: a claim whose `program` is a variable the reform
 * reaches is related. That map is traced from policyengine-us only, so for
 * the UK this committed table names the programmes instead. Each key is a
 * `program` value the scorecard uses for UK claims (its AB2025 registry
 * names); each value lists the parameter folders whose change is a change
 * to that programme.
 *
 * The table is conservative: a parameter outside every folder links to no
 * programme, and only parameter-path matches can link its claims.
 */
export const UK_SCORECARD_PROGRAM_PATHS: Record<string, string[]> = {
  income_tax: ['gov.hmrc.income_tax'],
  national_insurance: ['gov.hmrc.national_insurance'],
  child_benefit: ['gov.hmrc.child_benefit'],
  capital_gains_tax: ['gov.hmrc.cgt'],
  council_tax: ['gov.hmrc.council_tax'],
  fuel_duty: ['gov.hmrc.fuel_duty'],
  vat: ['gov.hmrc.vat'],
  stamp_taxes: ['gov.hmrc.stamp_duty'],
  business_rates: ['gov.hmrc.business_rates'],
  student_loans: ['gov.hmrc.student_loans'],
  vehicle_excise_duty: ['gov.dft.vehicle_excise_duty'],
  rail_fares: ['gov.dft.rail'],
  universal_credit: ['gov.dwp.universal_credit'],
  universal_credit_child_element: ['gov.dwp.universal_credit.elements.child'],
  benefit_cap: ['gov.dwp.benefit_cap'],
  housing_benefit: ['gov.dwp.housing_benefit'],
  carers_allowance: ['gov.dwp.carers_allowance'],
  pip: ['gov.dwp.pip'],
  winter_fuel_payment: ['gov.dwp.winter_fuel_payment'],
};

/** A parameter path without its bracket index, e.g. "a.b[0].c" → "a.b". */
function folderOf(path: string): string {
  const cut = path.indexOf('[');
  return (cut === -1 ? path : path.slice(0, cut)).replace(/\.+$/, '');
}

/** The scorecard programmes that a UK reform's parameter paths change, sorted. */
export function ukScorecardPrograms(paths: string[]): string[] {
  const folders = paths.map(folderOf);
  return Object.entries(UK_SCORECARD_PROGRAM_PATHS)
    .filter(([, prefixes]) =>
      prefixes.some((prefix) =>
        folders.some((path) => path === prefix || path.startsWith(`${prefix}.`))
      )
    )
    .map(([program]) => program)
    .sort();
}
