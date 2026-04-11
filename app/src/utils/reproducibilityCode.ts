/**
 * Utility functions for generating Python code that reproduces
 * PolicyEngine simulation results.
 *
 * Ported from policyengine-app v1:
 * https://github.com/PolicyEngine/policyengine-app/blob/main/src/data/reformDefinitionCode.js
 */

import { CURRENT_YEAR } from '@/constants';

// Default year fallback - use the app's current year constant
const DEFAULT_YEAR = parseInt(CURRENT_YEAR, 10);

// Maps region prefixes (from metadata) to HuggingFace subfolder names.
// Note: place/ is NOT included — places use the parent state's dataset + filtering.
const US_REGION_PREFIX_TO_FOLDER: Record<string, string> = {
  'state/': 'states',
  'congressional_district/': 'districts',
};

/**
 * Build a HuggingFace dataset URL for a US national-level dataset.
 * Dataset files follow the pattern: {name}_{year}.h5
 */
function getDatasetUrl(countryId: string, datasetName: string, year: number): string | null {
  if (datasetName.includes('://')) {
    return datasetName;
  }

  if (countryId === 'us') {
    return `hf://policyengine/policyengine-us-data/${datasetName}_${year}.h5`;
  }
  return null;
}

/**
 * Build a HuggingFace dataset URL for a US sub-national region.
 * Region values from metadata always use the pattern: "prefix/code"
 *   - "state/ca" → states/CA.h5
 *   - "congressional_district/CA-01" → districts/CA-01.h5
 * Note: place/ regions are handled separately via getPlaceStateDatasetUrl.
 */
function getSubnationalDatasetUrl(region: string): string | null {
  for (const [prefix, folder] of Object.entries(US_REGION_PREFIX_TO_FOLDER)) {
    if (region.startsWith(prefix)) {
      const code = region.slice(prefix.length);
      const filename = folder === 'states' ? code.toUpperCase() : code;
      return `hf://policyengine/policyengine-us-data/${folder}/${filename}.h5`;
    }
  }

  return null;
}

/**
 * For place/ regions, get the parent state's dataset URL.
 * "place/NJ-57000" → states/NJ.h5
 */
function getPlaceStateDatasetUrl(region: string): string | null {
  if (!region.startsWith('place/')) {
    return null;
  }
  const code = region.slice('place/'.length);
  const stateCode = code.split('-')[0];
  return `hf://policyengine/policyengine-us-data/states/${stateCode.toUpperCase()}.h5`;
}

/**
 * Extract the FIPS code from a place region string.
 * "place/NJ-57000" → "57000"
 */
function getPlaceFips(region: string): string | null {
  if (!region.startsWith('place/')) {
    return null;
  }
  const code = region.slice('place/'.length);
  const parts = code.split('-');
  return parts.length > 1 ? parts[1] : null;
}

/**
 * Utility function to sanitize a string and ensure that it's valid Python;
 * currently converts JS 'null', 'true', 'false', '"Infinity"', and '"-Infinity"' to Python
 */
export function sanitizeStringToPython(str: string): string {
  return str
    .replace(/true/g, 'True')
    .replace(/false/g, 'False')
    .replace(/null/g, 'None')
    .replace(/"Infinity"/g, 'np.inf')
    .replace(/"-Infinity"/g, '-np.inf');
}

/**
 * Given a standard "policy" object, get all individual values for both the baseline and reform policies
 */
function getAllPolicyValues(policy: { baseline: { data: any }; reform: { data: any } }): any[] {
  const { baseline, reform } = policy;
  let valueSettings: any[] = [];

  for (const p of [baseline, reform]) {
    const values = Object.values(p.data);
    valueSettings = valueSettings.concat(values);
  }

  const output = valueSettings.reduce((accu: any[], item: any) => {
    return accu.concat(...Object.values(item));
  }, []);

  return output;
}

/**
 * Generate header code with imports
 */
function getHeaderCode(
  type: 'household' | 'policy',
  countryId: string,
  policy: { baseline: { data: any }; reform: { data: any } },
  region: string
): string[] {
  const lines: string[] = [];
  const packageName = countryId === 'uk' ? 'policyengine_uk' : 'policyengine_us';

  // Add lines depending upon type of block
  if (type === 'household') {
    lines.push(`from ${packageName} import Simulation`);
  } else {
    lines.push(`from ${packageName} import Microsimulation`);
  }

  // If either baseline or reform is custom, add the following Python imports
  if (Object.keys(policy.reform.data).length > 0 || Object.keys(policy.baseline.data).length > 0) {
    lines.push('from policyengine_core.reforms import Reform');
  }

  // If either baseline or reform contains Infinity or -Infinity, add numpy import
  const allValues = getAllPolicyValues(policy);
  if (allValues.some((value) => value === Infinity || value === -Infinity)) {
    lines.push('import numpy as np');
  }

  // Place-level filtering requires pandas
  if (type === 'policy' && region.startsWith('place/')) {
    lines.push('import pandas as pd');
  }

  return lines;
}

/**
 * Generate baseline policy code
 */
function getBaselineCode(
  policy: { baseline: { data: any }; reform: { data: any } },
  countryId: string
): string[] {
  if (!policy?.baseline?.data || Object.keys(policy.baseline.data).length === 0) {
    return [];
  }
  let jsonStr = JSON.stringify(policy.baseline.data, null, 2);
  jsonStr = sanitizeStringToPython(jsonStr);
  const lines = [''].concat(jsonStr.split('\n'));
  lines[1] = `baseline = Reform.from_dict(${lines[1]}`;
  lines[lines.length - 1] = `${lines[lines.length - 1]}, country_id="${countryId}")`;
  return lines;
}

/**
 * Generate reform policy code
 */
function getReformCode(
  policy: { baseline: { data: any }; reform: { data: any } },
  countryId: string
): string[] {
  if (!policy?.baseline?.data || Object.keys(policy.reform.data).length === 0) {
    return [];
  }
  let jsonStr = JSON.stringify(policy.reform.data, null, 2);
  jsonStr = sanitizeStringToPython(jsonStr);
  const lines = [''].concat(jsonStr.split('\n'));
  lines[1] = `reform = Reform.from_dict(${lines[1]}`;
  lines[lines.length - 1] = `${lines[lines.length - 1]}, country_id="${countryId}")`;
  return lines;
}

/**
 * Generate situation code for household simulation
 */
function getSituationCode(
  type: 'household' | 'policy',
  policy: { baseline: { data: any }; reform: { data: any } },
  year: number,
  householdInput: any,
  earningVariation: boolean
): string[] {
  if (type !== 'household') {
    return [];
  }

  // Deep copy the household input
  const householdInputCopy = JSON.parse(JSON.stringify(householdInput));

  // Clean up null values and handle earning variation
  for (const entityPlural of Object.keys(householdInputCopy)) {
    for (const entity of Object.keys(householdInputCopy[entityPlural])) {
      for (const variable of Object.keys(householdInputCopy[entityPlural][entity])) {
        if (variable !== 'members') {
          if (householdInputCopy[entityPlural][entity][variable][year] === null) {
            delete householdInputCopy[entityPlural][entity][variable];
          }
        }
        if (earningVariation && variable === 'employment_income') {
          delete householdInputCopy[entityPlural][entity][variable];
        }
      }
    }
  }

  if (earningVariation) {
    householdInputCopy.axes = [[{ name: 'employment_income', count: 200, min: 0, max: 200_000 }]];
  }

  let householdJson = JSON.stringify(householdInputCopy, null, 2);
  householdJson = sanitizeStringToPython(householdJson);

  const lines: string[] = ['', '', `situation = ${householdJson}`, '', 'simulation = Simulation('];

  if (Object.keys(policy.reform.data).length) {
    lines.push('    reform=reform,');
  }

  lines.push(
    '    situation=situation,',
    ')',
    '',
    `output = simulation.calculate("household_net_income", ${year})`,
    'print(output)'
  );

  return lines;
}

/**
 * Generate implementation code for policy/microsimulation
 */
function getImplementationCode(
  type: 'household' | 'policy',
  region: string,
  countryId: string,
  timePeriod: number,
  policy: { baseline: { data: any }; reform: { data: any } },
  dataset: string | null,
  isDefaultDataset: boolean
): string[] {
  if (type !== 'policy') {
    return [];
  }

  const hasBaseline = Object.keys(policy?.baseline?.data || {}).length > 0;
  const hasReform = Object.keys(policy?.reform?.data || {}).length > 0;

  const isNational = region === countryId;
  const year = timePeriod || DEFAULT_YEAR;

  // Place regions use state dataset + place_fips filtering
  if (countryId === 'us' && region.startsWith('place/')) {
    return getPlaceImplementationCode(region, year, hasBaseline, hasReform);
  }

  let datasetText = '';

  if (countryId === 'us' && !isNational) {
    // US sub-national (state, congressional district): use region-specific dataset
    datasetText = getSubnationalDatasetUrl(region) || '';
  } else if (dataset && !isDefaultDataset) {
    // Non-default dataset explicitly selected: include the dataset URL
    datasetText = getDatasetUrl(countryId, dataset, year) || '';
  }
  // Default dataset or no dataset: omit dataset= (matches API behavior)

  const datasetSpecifier = datasetText ? `dataset="${datasetText}"` : '';

  const baselineSpecifier = hasBaseline ? 'reform=baseline' : '';
  const baselineComma = hasBaseline && datasetText ? ', ' : '';

  const reformSpecifier = hasReform ? 'reform=reform' : '';
  const reformComma = hasReform && datasetText ? ', ' : '';

  return [
    '',
    '',
    `baseline = Microsimulation(${baselineSpecifier}${baselineComma}${datasetSpecifier})`,
    `reformed = Microsimulation(${reformSpecifier}${reformComma}${datasetSpecifier})`,
    `baseline_income = baseline.calculate("household_net_income", period=${year})`,
    `reformed_income = reformed.calculate("household_net_income", period=${year})`,
    'difference_income = reformed_income - baseline_income',
  ];
}

/**
 * Generate place-level implementation code.
 * Places use the parent state's dataset and filter by place_fips,
 * matching the policyengine package's _filter_us_simulation_by_place().
 */
function getPlaceImplementationCode(
  region: string,
  year: number,
  hasBaseline: boolean,
  hasReform: boolean
): string[] {
  const stateDatasetUrl = getPlaceStateDatasetUrl(region) || '';
  const placeFips = getPlaceFips(region) || '';

  const baselineReformArg = hasBaseline ? ', reform=baseline' : '';
  const reformReformArg = hasReform ? ', reform=reform' : '';

  return [
    '',
    '',
    '# Load state-level dataset',
    `sim = Microsimulation(dataset="${stateDatasetUrl}")`,
    '',
    `# Filter to place (FIPS ${placeFips})`,
    'hh_place_fips = sim.calculate("place_fips").values',
    'hh_ids = sim.calculate("household_id").values',
    `matching_ids = set(hh_ids[(hh_place_fips == "${placeFips}") | (hh_place_fips == b"${placeFips}")])`,
    'person_hh_ids = sim.calculate("household_id", map_to="person").values',
    'person_mask = pd.Series(person_hh_ids).isin(matching_ids)',
    'subset_df = sim.to_input_dataframe().loc[person_mask]',
    '',
    '# Run simulations on filtered data',
    `baseline = Microsimulation(dataset=subset_df${baselineReformArg})`,
    `reformed = Microsimulation(dataset=subset_df${reformReformArg})`,
    `baseline_income = baseline.calculate("household_net_income", period=${year})`,
    `reformed_income = reformed.calculate("household_net_income", period=${year})`,
    'difference_income = reformed_income - baseline_income',
  ];
}

/**
 * Main function to generate the reproducibility code block
 * Ported directly from v1's getReproducibilityCodeBlock
 */
export function getReproducibilityCodeBlock(
  type: 'household' | 'policy',
  countryId: string,
  policy: { baseline: { data: any }; reform: { data: any } },
  region: string,
  year: number,
  dataset: string | null = null,
  householdInput: any = null,
  earningVariation: boolean = false,
  isDefaultDataset: boolean = true
): string[] {
  return [
    ...getHeaderCode(type, countryId, policy, region),
    ...getBaselineCode(policy, countryId),
    ...getReformCode(policy, countryId),
    ...getSituationCode(type, policy, year, householdInput, earningVariation),
    ...getImplementationCode(type, region, countryId, year, policy, dataset, isDefaultDataset),
  ];
}

/**
 * Convert v2 Policy[] to v1 policy format for reproducibility code
 * v1 format: { baseline: { data: {...} }, reform: { data: {...} } }
 */
export function convertPoliciesToV1Format(policies?: any[]): {
  baseline: { data: Record<string, any> };
  reform: { data: Record<string, any> };
} {
  const result = {
    baseline: { data: {} as Record<string, any> },
    reform: { data: {} as Record<string, any> },
  };

  if (!policies || policies.length === 0) {
    return result;
  }

  // First policy is baseline, second (if exists) is reform
  const baselinePolicy = policies[0];
  const reformPolicy = policies.length > 1 ? policies[1] : null;

  // Convert baseline parameters
  if (baselinePolicy?.parameters) {
    for (const param of baselinePolicy.parameters) {
      const paramData: Record<string, any> = {};
      for (const interval of param.values || []) {
        const key = `${interval.startDate}.${interval.endDate}`;
        paramData[key] = interval.value;
      }
      if (Object.keys(paramData).length > 0) {
        result.baseline.data[param.name] = paramData;
      }
    }
  }

  // Convert reform parameters
  if (reformPolicy?.parameters) {
    for (const param of reformPolicy.parameters) {
      const paramData: Record<string, any> = {};
      for (const interval of param.values || []) {
        const key = `${interval.startDate}.${interval.endDate}`;
        paramData[key] = interval.value;
      }
      if (Object.keys(paramData).length > 0) {
        result.reform.data[param.name] = paramData;
      }
    }
  }

  return result;
}

/**
 * Get Google Colab link for the country
 */
export function getColabLink(countryId: string): string | null {
  if (countryId === 'uk') {
    return 'https://colab.research.google.com/drive/16h6v-EAYk5n4qZ4krXbmFG4_oKAaflo9#scrollTo=TBTIupkjIThF';
  }
  if (countryId === 'us') {
    return 'https://colab.research.google.com/drive/1hqA9a2LrNj2leJ9YtXXC3xyaCXQ7mwUW?usp=sharing';
  }
  return null;
}
