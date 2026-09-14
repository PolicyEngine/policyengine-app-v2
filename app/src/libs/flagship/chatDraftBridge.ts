import { convertDateRangeMapToValueIntervals } from '@/adapters/conversionHelpers';
import { createDraftProvision, DraftProvision } from '@/libs/draftReform';
import { ParameterSearchEntry } from '@/libs/parameterSearch';
import { getCurrentValue } from '@/utils/parameterValues';

/**
 * Bridge from a UK-chat reform to draft provisions.
 *
 * The chat service's simulation and validation tools take a flat
 * policyengine.py reform mapping — canonical parameter path to a scalar
 * or a date-range-to-value map. Those tool inputs stream to the client
 * verbatim, so when the model runs or validates a reform we can offer
 * the exact same provisions for the composer's draft rail.
 */

const REFORM_TOOLS = new Set([
  'run_society_simulation',
  'run_household_simulation',
  'validate_reform',
]);

/** Returns the reform mapping carried by a tool call, if any. */
export function reformFromToolInput(
  toolName: string,
  toolInput: Record<string, any> | undefined
): Record<string, any> | null {
  if (!REFORM_TOOLS.has(toolName)) {
    return null;
  }
  const reform = toolInput?.reform;
  if (!reform || typeof reform !== 'object' || Array.isArray(reform)) {
    return null;
  }
  return Object.keys(reform).length > 0 ? reform : null;
}

export interface ChatReformBridge {
  provisions: DraftProvision[];
  /** Reform paths the local parameter index doesn't know (version skew). */
  unknownPaths: string[];
}

export function provisionsFromChatReform(
  reform: Record<string, any>,
  entries: ParameterSearchEntry[],
  parameters: Record<string, { values?: Record<string, any> | null } | undefined> | undefined
): ChatReformBridge {
  const byPath = new Map(entries.map((entry) => [entry.path, entry]));
  const provisions: DraftProvision[] = [];
  const unknownPaths: string[] = [];

  for (const [path, raw] of Object.entries(reform)) {
    const entry = byPath.get(path);
    if (!entry || raw === undefined || Array.isArray(raw)) {
      unknownPaths.push(path);
      continue;
    }

    const details = {
      path,
      breadcrumb: entry.breadcrumb || entry.label,
      unit: entry.unit,
      baselineValue: getCurrentValue(parameters?.[path]?.values),
    };
    if (raw && typeof raw === 'object') {
      try {
        const values = convertDateRangeMapToValueIntervals(raw);
        if (values.length === 0) {
          unknownPaths.push(path);
          continue;
        }
        provisions.push({ ...details, values });
      } catch {
        unknownPaths.push(path);
      }
      continue;
    }

    provisions.push(createDraftProvision({ ...details, value: raw }));
  }

  return { provisions, unknownPaths };
}
