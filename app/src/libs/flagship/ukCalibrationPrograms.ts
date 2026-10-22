/**
 * UK calibration targets by programme, and the parameters that change
 * each programme.
 *
 * The US joins a reform to its calibration targets through the traced
 * parameter → variable dependency map and the model variables each
 * target lists (`policyengine_variables`). Neither exists for the UK:
 * the map is traced from policyengine-us only, and the UK dashboard's
 * targets list no model variables. So the UK join is a committed table,
 * one entry per programme:
 *
 *   - `paths`: the parameter folders whose change is a change to the
 *     programme (gov.hmrc.income_tax.… is Income Tax).
 *   - `targets`: the dashboard target names that measure the programme
 *     itself, by name prefix (hmrc.itl.income_tax_by_… is Income Tax
 *     liabilities; hmrc.spi_region.total_income_by_… is the income the
 *     tax falls on, not the tax, so it is left out).
 *
 * The table is conservative on purpose: a programme with no entry, or a
 * parameter outside every entry, matches no target, and the Validation
 * tab says no target measures the change. A target that only measures
 * the income or population a programme acts on never matches.
 *
 * Shared by the calibration-targets route (server) and the validation
 * layer (client), so this module imports nothing.
 */

export interface UkCalibrationProgram {
  /** The join key: the UK model variable the programme's targets measure, where one exists. */
  program: string;
  /** The programme as a reader names it. */
  label: string;
  /** Parameter folders whose change is a change to this programme. */
  paths: string[];
  /** Dashboard target names (without the "@period" suffix) that measure it, by prefix. */
  targets: string[];
}

export const UK_CALIBRATION_PROGRAMS: UkCalibrationProgram[] = [
  {
    program: 'income_tax',
    label: 'Income Tax',
    // Pension contributions relief is an Income Tax relief.
    paths: ['gov.hmrc.income_tax', 'gov.hmrc.pensions'],
    targets: [
      'hmrc.itl.income_tax_by_',
      'hmrc.itl.taxpayers_by_',
      'hmrc.itl.higher_rate_taxpayers',
      'hmrc.itl.additional_rate_taxpayers',
      'hmrc.spi_region.income_tax_by_region',
      'hmrc.spi_region.taxpayers_by_region',
      'obr.income_tax',
    ],
  },
  {
    program: 'national_insurance',
    label: 'National Insurance',
    paths: ['gov.hmrc.national_insurance'],
    targets: ['obr.ni_employee', 'obr.ni_self_employed', 'hmrc.salary_sacrifice.nics_relief'],
  },
  {
    program: 'capital_gains_tax',
    label: 'Capital Gains Tax',
    paths: ['gov.hmrc.cgt'],
    targets: [
      'hmrc.cgt.liability',
      'hmrc.cgt.tax_by_',
      'hmrc.cgt.taxpayers_',
      'hmrc/cgt_taxpayers',
    ],
  },
  {
    program: 'stamp_duty_land_tax',
    label: 'Stamp Duty Land Tax',
    paths: ['gov.hmrc.stamp_duty'],
    targets: ['obr.sdlt'],
  },
  {
    program: 'child_benefit',
    label: 'Child Benefit',
    paths: ['gov.hmrc.child_benefit'],
    targets: ['obr.child_benefit'],
  },
  {
    program: 'tax_free_childcare',
    label: 'Tax-Free Childcare',
    paths: ['gov.hmrc.tax_free_childcare'],
    targets: ['hmrc.tfc.'],
  },
  {
    program: 'student_loan_repayment',
    label: 'Student loan repayments',
    paths: ['gov.hmrc.student_loans'],
    targets: ['slc.repayments.'],
  },
  {
    program: 'universal_credit',
    label: 'Universal Credit',
    paths: ['gov.dwp.universal_credit'],
    targets: ['dwp/uc_payment_dist/', 'dwp.uc.', 'obr.universal_credit'],
  },
  {
    program: 'benefit_cap',
    label: 'Benefit Cap',
    paths: ['gov.dwp.benefit_cap'],
    targets: ['dwp.benefit_cap.'],
  },
  {
    program: 'state_pension',
    label: 'State Pension',
    paths: ['gov.dwp.state_pension'],
    targets: ['dwp.state_pension.', 'dfc_ni.state_pension.'],
  },
  {
    program: 'pension_credit',
    label: 'Pension Credit',
    paths: ['gov.dwp.pension_credit'],
    targets: ['dwp.pension_credit.', 'dfc_ni.pension_credit.', 'obr.pension_credit'],
  },
  {
    program: 'carers_allowance',
    label: "Carer's Allowance",
    paths: ['gov.dwp.carers_allowance'],
    targets: ['obr.carers_allowance'],
  },
  {
    program: 'attendance_allowance',
    label: 'Attendance Allowance',
    paths: ['gov.dwp.attendance_allowance'],
    targets: ['dwp.attendance_allowance.', 'obr.attendance_allowance'],
  },
  {
    program: 'pip',
    label: 'Personal Independence Payment',
    paths: ['gov.dwp.pip'],
    targets: ['obr.pip'],
  },
  {
    program: 'esa',
    label: 'Employment and Support Allowance',
    paths: ['gov.dwp.ESA'],
    targets: ['dwp.esa_', 'obr.esa'],
  },
  {
    program: 'jsa',
    label: "Jobseeker's Allowance",
    paths: ['gov.dwp.JSA'],
    targets: ['obr.jobseekers_allowance'],
  },
  {
    program: 'housing_benefit',
    label: 'Housing Benefit',
    paths: ['gov.dwp.housing_benefit'],
    targets: ['dwp.hb.'],
  },
  {
    program: 'winter_fuel_allowance',
    label: 'Winter Fuel Payment',
    paths: ['gov.dwp.winter_fuel_payment'],
    targets: ['obr.winter_fuel_allowance'],
  },
  {
    program: 'scottish_child_payment',
    label: 'Scottish Child Payment',
    paths: ['gov.social_security_scotland.scottish_child_payment'],
    targets: ['scotgov.scottish_child_payment'],
  },
  {
    program: 'tv_licence',
    label: 'TV licence fee',
    paths: ['gov.dcms.bbc.tv_licence'],
    targets: ['obr.tv_licence_fee'],
  },
  {
    program: 'funded_childcare',
    label: 'Funded childcare',
    paths: [
      'gov.dfe.universal_childcare_entitlement',
      'gov.dfe.extended_childcare_entitlement',
      'gov.dfe.targeted_childcare_entitlement',
    ],
    targets: ['dfe.funded_childcare.'],
  },
];

function isPrefixPath(prefix: string, path: string): boolean {
  return path === prefix || path.startsWith(`${prefix}.`);
}

/** A parameter path without its bracket index: "…rates.uk[0].rate" is "…rates.uk". */
function folderOf(path: string): string {
  const cut = path.indexOf('[');
  return (cut === -1 ? path : path.slice(0, cut)).replace(/\.+$/, '');
}

/** The programmes a dashboard target measures, by its name; none for a context target. */
export function ukProgramsForTarget(name: string): string[] {
  const base = name.replace(/@[^@]*$/, '');
  return UK_CALIBRATION_PROGRAMS.filter((entry) =>
    entry.targets.some((prefix) => base.startsWith(prefix))
  ).map((entry) => entry.program);
}

/** A programme the reform changes, with the first changed path that reaches it. */
export interface UkReachedProgram {
  program: string;
  via: string;
}

/** The programmes a reform's parameter paths change, in table order. */
export function ukProgramsForPaths(paths: string[]): UkReachedProgram[] {
  return UK_CALIBRATION_PROGRAMS.flatMap((entry) => {
    const via = paths.find((path) =>
      entry.paths.some((folder) => isPrefixPath(folder, folderOf(path)))
    );
    return via === undefined ? [] : [{ program: entry.program, via }];
  });
}

/** A programme's name, or undefined when the table does not know it. */
export function ukCalibrationProgramLabel(program: string): string | undefined {
  return UK_CALIBRATION_PROGRAMS.find((entry) => entry.program === program)?.label;
}
