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
 * Names are compared without the words that only qualify a program
 * (refundable, enrolled, the tax_unit entity), so refundable_ctc is the
 * CTC and medicaid_enrolled is Medicaid. Baseline comparisons and
 * calibration targets use the same rule.
 *
 * Jurisdiction, US only: a nationwide report keeps the national
 * comparisons of the federal programs the reform changes, and a state's
 * comparisons only when the reform changes that state's own rules. A
 * state report keeps that state's comparisons (its own programs, and
 * federal programs measured there) and the national comparisons of the
 * federal programs the reform changes. Other states never show.
 *
 * Jurisdiction, UK: a report on one nation (country/wales) keeps only the
 * comparisons that cover that nation: the UK's, Great Britain's (not in
 * Northern Ireland), and the nation's own and its regions'. Another
 * nation's comparisons never show. A UK-wide report keeps them all.
 */
import { normalizeParameterPath } from './parameterDependencies';

/** What the relevance check needs to know about a comparison. */
export interface ComparisonScope {
  /** The program the comparison measures, as the scorecard names it: "cdcc", "md_eitc". */
  program?: string | null;
  /** "US" for a national comparison, else a state code; for the UK "UK", "GB" or a nation. */
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
  /** The report's region: "us", "state/md", "congressional_district/MD-05", "country/wales". */
  region?: string | null;
}

const NATIONAL = 'national';

const US_STATES = new Set(
  (
    'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH ' +
    'NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'
  ).split(' ')
);

/**
 * Words that qualify or state a program, not name it, left out of every
 * name before comparing: refundable_ctc and non_refundable_ctc are the
 * CTC, medicaid_enrolled and is_medicaid_eligible are Medicaid.
 */
const QUALIFIERS = new Set([
  'refundable',
  'nonrefundable',
  'non',
  'refund',
  'credit',
  'credits',
  'deduction',
  'enrolled',
  'eligible',
  'is',
  'has',
]);

/** The entity a model variable belongs to, which names no program: deductible_mortgage_interest_tax_unit. */
const ENTITY = /(?:^|_)(?:tax_unit|spm_unit)(?=_|$)/g;

/**
 * Program ids whose name is not the one their parameters and readers
 * use, and the names they stand for: scorecard abbreviations, and model
 * variables named for a quantity rather than the program.
 */
const PROGRAM_ALIASES: Record<string, string[]> = {
  assigned_aca_ptc: ['aca'],
  co_fac: ['co_family_affordability_credit'],
  education_tax_credits: ['education'],
  housing: ['hud'],
  ma_cftc: ['ma_child_and_family_credit'],
  ny_escc: ['ny_ctc'],
  or_kids_credit: ['or_ctc'],
  spm_unit_energy_subsidy: ['liheap'],
  va_eitc_cli: ['va_eitc', 'va_low_income_credit'],
  wa_wftc: ['wa_working_families_tax_credit'],
  wi_eic: ['wi_earned_income_credit'],
};

/**
 * Program ids that, measured in a state, are that state's own program,
 * and the path words its parameters sit under: income tax collections
 * measured in DC (state_income_tax) are DC's income tax, whose rules are
 * gov.states.dc.tax.income.…, so a change there is a change to the
 * program the target measures.
 */
const STATE_PROGRAM_PATHS: Record<string, string[]> = {
  state_income_tax: ['tax', 'income'],
};

/** A name's words, without its entity and qualifiers; all of them when nothing else is left. */
function nameTokens(name: string): string[] {
  const tokens = name.replace(ENTITY, '').split('_').filter(Boolean);
  const named = tokens.filter((token) => !QUALIFIERS.has(token));
  return named.length > 0 ? named : tokens;
}

/** A program the reform changes: its name, whose program it is, and where the change applies. */
interface ProgramSignal {
  tokens: string[];
  /** National, a state code, or null for a local or territory program. */
  owner: string | null;
  /** National or a state code; null for a local or territory parameter. */
  applies: string | null;
}

/** The UK's nations, by the region key the app gives a nation report. */
const UK_NATIONS = ['england', 'scotland', 'wales', 'northern_ireland'] as const;
type UkNation = (typeof UK_NATIONS)[number];

/** England's regions, as comparisons name them: each lies in England only. */
const ENGLISH_REGIONS = new Set([
  'london',
  'north east',
  'north west',
  'yorkshire and the humber',
  'east midlands',
  'west midlands',
  'east',
  'east of england',
  'south east',
  'south west',
]);

/** The nation a UK report covers: "country/wales" or "wales"; null for the whole UK. */
function ukReportNation(region: string | null | undefined): UkNation | null {
  const key = (region ?? '').toLowerCase().replace(/^country\//, '');
  return (UK_NATIONS as readonly string[]).includes(key) ? (key as UkNation) : null;
}

/**
 * The nations a UK comparison covers: "Scotland" is Scotland's, "GB"
 * every nation but Northern Ireland. Null when it names the whole UK or
 * an area the app does not know, which every report keeps.
 */
function ukComparisonNations(geography: string | null | undefined): UkNation[] | null {
  const name = (geography ?? '').trim().toLowerCase().replace(/_/g, ' ');
  if (name === 'gb' || name === 'great britain') {
    return ['england', 'scotland', 'wales'];
  }
  if (name === 'england and wales') {
    return ['england', 'wales'];
  }
  if (name === 'england' || ENGLISH_REGIONS.has(name)) {
    return ['england'];
  }
  if (name === 'scotland') {
    return ['scotland'];
  }
  if (name === 'wales') {
    return ['wales'];
  }
  if (name === 'northern ireland' || name === 'ni') {
    return ['northern_ireland'];
  }
  return null;
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
      tokens: segments.slice(0, -1).flatMap(nameTokens),
      owner: scope,
      applies: scope,
    };
    const readers = (us ? (reform.readers[path] ?? []) : []).map((variable): ProgramSignal => {
      const [first, ...rest] = variable.split('_');
      const state = rest.length > 0 ? stateCode(first) : null;
      // An unprefixed variable reading a state's parameter is a federal
      // program the state runs, such as a SNAP option.
      return state
        ? { tokens: nameTokens(rest.join('_')), owner: state, applies: scope }
        : { tokens: nameTokens(variable), owner: scope === null ? null : NATIONAL, applies: scope };
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
      const statePath = STATE_PROGRAM_PATHS[name];
      if (statePath && geography !== NATIONAL) {
        return { owner: geography, family: statePath };
      }
      const tokens = name.split('_');
      // "md_eitc" measured in Maryland is Maryland's program; "eitc" there is the federal one.
      const statesOwn =
        geography !== NATIONAL && tokens.length > 1 && stateCode(tokens[0]) === geography;
      return {
        owner: statesOwn ? geography : NATIONAL,
        family: nameTokens((statesOwn ? tokens.slice(1) : tokens).join('_')),
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
  const ukNation = reform.countryId.toLowerCase() === 'uk' ? ukReportNation(reform.region) : null;
  return comparisons.filter((comparison) => {
    // Another nation's comparison never describes a nation report.
    if (ukNation && !(ukComparisonNations(comparison.geography) ?? [ukNation]).includes(ukNation)) {
      return false;
    }
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
