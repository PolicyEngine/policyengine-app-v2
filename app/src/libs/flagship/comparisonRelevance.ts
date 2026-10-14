/**
 * Which baseline comparisons describe a report: a comparison counts only
 * when it measures a program the reform changes, in the report's
 * jurisdiction.
 *
 * A program counts as changed when its name appears in a changed
 * parameter's path (gov.irs.credits.cdcc.… changes the CDCC) or in the
 * name of a variable that reads a changed parameter directly
 * (capped_count_cdcc_eligible; sc_cdcc_potential is South Carolina's
 * CDCC). Programs further down the dependency graph, such as a state
 * EITC that a federal credit reaches through the tax it reduces, are the
 * tax-benefit system echoing the change, not programs the reform changes.
 *
 * Jurisdiction, US only: a nationwide report keeps the national
 * comparisons of the federal programs the reform changes, and a state's
 * comparisons only when the reform changes that state's own rules. A
 * state report keeps that state's comparisons (its own programs, and
 * federal programs measured there) and the national comparisons of the
 * federal programs the reform changes. Other states never show.
 */
import { normalizeParameterPath } from './parameterDependencies';

/** What the relevance check needs to know about a comparison. */
export interface ComparisonScope {
  /** The program the comparison measures, as the scorecard names it: "cdcc", "md_eitc". */
  program?: string | null;
  /** "US" for a national comparison, else a state code. */
  geography?: string | null;
  /** "parameter": the comparison's receipt names a parameter the reform changes. */
  matchBasis?: string;
}

/** The reform behind a report, and where the report looks. */
export interface ReformScope {
  countryId: string;
  /** The reform's parameter paths. */
  paths: string[];
  /** The variables that read each path directly, from the traced dependency map. */
  readers: Record<string, string[]>;
  /** The report's region: "us", "state/md", "congressional_district/MD-05". */
  region?: string | null;
}

const NATIONAL = 'national';

const US_STATES = new Set(
  (
    'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH ' +
    'NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'
  ).split(' ')
);

/** Words that qualify a program, not name it: refundable_ctc and non_refundable_ctc are the CTC. */
const QUALIFIERS = new Set([
  'refundable',
  'nonrefundable',
  'non',
  'refund',
  'credit',
  'credits',
  'tax',
  'deduction',
]);

/** Scorecard program ids that are not model names, and the model names they stand for. */
const PROGRAM_ALIASES: Record<string, string[]> = {
  co_fac: ['co_family_affordability_credit'],
  housing: ['hud'],
  ma_cftc: ['ma_child_and_family_credit'],
  ny_escc: ['ny_ctc'],
  or_kids_credit: ['or_ctc'],
  va_eitc_cli: ['va_eitc', 'va_low_income_credit'],
  wa_wftc: ['wa_working_families_tax_credit'],
  wi_eic: ['wi_earned_income_credit'],
};

/** A program the reform changes: its name, whose program it is, and where the change applies. */
interface ProgramSignal {
  tokens: string[];
  /** National, a state code, or null for a local or territory program. */
  owner: string | null;
  /** National or a state code; null for a local or territory parameter. */
  applies: string | null;
}

function stateCode(code: string | null | undefined): string | null {
  const upper = code?.toUpperCase();
  return upper && US_STATES.has(upper) ? upper : null;
}

/** Whose parameter a path is: gov.states.md.… is Maryland's, gov.local.… no state's. */
function pathScope(segments: string[]): string | null {
  const rest = segments[1] === 'contrib' ? segments.slice(2) : segments.slice(1);
  if (rest[0] === 'states') {
    return stateCode(rest[1]);
  }
  if (rest[0] === 'local' || rest[0] === 'territories') {
    return null;
  }
  return NATIONAL;
}

function reformSignals(reform: ReformScope, us: boolean): ProgramSignal[] {
  return reform.paths.flatMap((path) => {
    const segments = normalizeParameterPath(path).split('.');
    const scope = pathScope(segments);
    // The last segment names a setting (max, rate, min_children_for_ss_taxes_minus_eitc).
    const own: ProgramSignal = {
      tokens: segments.slice(0, -1).flatMap((segment) => segment.split('_')),
      owner: scope,
      applies: scope,
    };
    const readers = (us ? (reform.readers[path] ?? []) : []).map((variable): ProgramSignal => {
      const [first, ...rest] = variable.split('_');
      const state = rest.length > 0 ? stateCode(first) : null;
      // An unprefixed variable reading a state's parameter is a federal
      // program the state runs, such as a SNAP option.
      return state
        ? { tokens: rest, owner: state, applies: scope }
        : { tokens: variable.split('_'), owner: scope === null ? null : NATIONAL, applies: scope };
    });
    return [own, ...readers];
  });
}

/** The program names a comparison measures, each with whose program it is. */
function comparisonPrograms(
  program: string,
  geography: string
): Array<{ owner: string; family: string[] }> {
  return program
    .split('+')
    .flatMap((id) => PROGRAM_ALIASES[id] ?? [id])
    .map((name) => {
      const tokens = name.split('_');
      // "md_eitc" measured in Maryland is Maryland's program; "eitc" there is the federal one.
      const statesOwn =
        geography !== NATIONAL && tokens.length > 1 && stateCode(tokens[0]) === geography;
      const named = statesOwn ? tokens.slice(1) : tokens;
      const family = named.filter((token) => !QUALIFIERS.has(token));
      return {
        owner: statesOwn ? geography : NATIONAL,
        family: family.length > 0 ? family : named,
      };
    });
}

function containsRun(tokens: string[], run: string[]): boolean {
  for (let start = 0; start + run.length <= tokens.length; start++) {
    if (run.every((token, offset) => tokens[start + offset] === token)) {
      return true;
    }
  }
  return false;
}

/** Whether a change that applies in `applies` belongs in a report on `report`, for a comparison in `geography`. */
function reaches(applies: string | null, geography: string, report: string): boolean {
  if (geography === NATIONAL) {
    return true;
  }
  // A nationwide report shows a state's comparison only when the reform
  // changes that state's own rules, not a federal rule the state reads.
  return report === NATIONAL
    ? applies === geography
    : applies === NATIONAL || applies === geography;
}

/**
 * The comparisons that describe this reform in this report's
 * jurisdiction, in their original order.
 */
export function relevantComparisons<T extends ComparisonScope>(
  comparisons: T[],
  reform: ReformScope
): T[] {
  const us = reform.countryId.toLowerCase() === 'us';
  const signals = reformSignals(reform, us);
  const reportState = us
    ? /^(?:state\/([a-z]{2})|congressional_district\/([a-z]{2})-\d+)$/i.exec(reform.region ?? '')
    : null;
  const report = (reportState && stateCode(reportState[1] ?? reportState[2])) || NATIONAL;
  return comparisons.filter((comparison) => {
    const geography = (us && stateCode(comparison.geography)) || NATIONAL;
    // Another state's comparison never describes a state report.
    if (report !== NATIONAL && geography !== NATIONAL && geography !== report) {
      return false;
    }
    // A receipt that names a changed parameter scores the program itself.
    if (comparison.matchBasis === 'parameter') {
      return signals.some((signal) => reaches(signal.applies, geography, report));
    }
    if (!comparison.program) {
      return false;
    }
    return comparisonPrograms(comparison.program, geography).some(({ owner, family }) =>
      signals.some(
        (signal) =>
          signal.owner === owner &&
          containsRun(signal.tokens, family) &&
          reaches(signal.applies, geography, report)
      )
    );
  });
}
