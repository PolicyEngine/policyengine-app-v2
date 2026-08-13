import {
  createParameterSearchIndex,
  ParameterSearchEntry,
  ParameterSearchIndex,
  searchParameters,
} from '@/libs/parameterSearch';
import { formatValue, getCurrentValue } from '@/utils/parameterValues';

/**
 * The US ask agent's model-facing surface: system prompt, tool
 * definitions, and the deterministic tool executor. Mirrors the shape
 * of the UK chat service's discovery/validation tools so the same
 * client event contract (and the chat→draft bridge, which watches
 * validate_reform tool inputs) works for both countries. The Anthropic
 * streaming loop lives in the calculator-app route; everything here is
 * pure and unit-testable.
 */

export interface UsAskContext {
  index: ParameterSearchIndex;
  /** Raw metadata parameters keyed by path, for values lookups */
  parameters: Record<string, { values?: Record<string, any> | null; description?: string | null }>;
}

export function buildUsAskContext(
  entries: ParameterSearchEntry[],
  clusters: string[][],
  parameters: UsAskContext['parameters']
): UsAskContext {
  return { index: createParameterSearchIndex(entries, clusters), parameters };
}

export const US_ASK_SYSTEM_PROMPT = `You are PolicyEngine's US reform drafting assistant, embedded in the Ask page of policyengine.org.

You help users find US federal and state tax and benefit policy parameters and draft reforms against the live policyengine-us model. You do not compute policy impacts yourself — after the user adds provisions to their draft, the app runs a full society-wide microsimulation report with budgetary, poverty, and distributional results. Direct users there for numbers rather than estimating impacts from memory.

Rules:
- Use search_parameters to find canonical parameter paths. Never invent or guess a path — only cite paths returned by tools.
- Use get_parameter to check current-law values before proposing a change.
- When the user has described a concrete change, call validate_reform with the full reform mapping from parameter path to proposed value. This surfaces an "add to draft" card in the interface — the card exists only when you make this call, so never describe a proposed reform or tell the user to add it to their draft without having called validate_reform for it in the current turn. If the user's message itself fully specifies the change, validate it in your first response rather than asking permission. Dollar amounts are annual; rates are fractions (21% becomes 0.21).
- Be factually neutral. Never call tax or benefit policies good, bad, fair, unfair, generous, or similar.
- Keep responses brief, in sentence case, with markdown used sparingly. Lead with the answer.
- If a request is unrelated to US tax and benefit policy, say so briefly and point the user back to policy questions.`;

/** Plain JSON tool definitions (Anthropic Messages API shape). */
export const US_ASK_TOOLS = [
  {
    name: 'search_parameters',
    description:
      'Search the policyengine-us parameter index by keywords. Returns canonical parameter paths with human-readable breadcrumbs, units, and current-law values. Call this before naming any parameter; never invent paths.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Keywords, e.g. "child tax credit amount"' },
        limit: { type: 'integer', minimum: 1, maximum: 20, description: 'Max results, default 8' },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_parameter',
    description:
      'Look up one exact parameter path and return its breadcrumb, unit, description, current-law value, and recent historical values. Use before proposing a change to a parameter.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Exact dotted parameter path from search_parameters' },
      },
      required: ['path'],
      additionalProperties: false,
    },
  },
  {
    name: 'validate_reform',
    description:
      'Validate a fully specified draft reform. Takes a flat mapping from canonical parameter path to proposed new value (annual dollars, or fractions for rates). Calling this shows the user an "add to draft" card for the reform, so always call it once the reform is concrete. Returns per-provision validation with current-law baselines.',
    input_schema: {
      type: 'object',
      properties: {
        reform: {
          type: 'object',
          description:
            'Mapping from parameter path to proposed value, e.g. {"gov.irs.credits.ctc.amount.base[0].amount": 3600}',
          additionalProperties: true,
        },
      },
      required: ['reform'],
      additionalProperties: false,
    },
  },
] as const;

interface ToolOutcome {
  output: string;
  isError: boolean;
}

function searchTool(context: UsAskContext, input: any): ToolOutcome {
  const query = typeof input?.query === 'string' ? input.query : '';
  if (!query.trim()) {
    return { output: 'Error: query is required', isError: true };
  }
  const limit = Math.min(Math.max(Number(input?.limit) || 8, 1), 20);
  const results = searchParameters(context.index, query, limit, {
    includeContrib: false,
    stateScope: 'all',
  });
  if (results.length === 0) {
    return {
      output: JSON.stringify({ results: [], note: 'No matches — try different keywords.' }),
      isError: false,
    };
  }
  return {
    output: JSON.stringify({
      results: results.map((entry) => ({
        path: entry.path,
        breadcrumb: entry.breadcrumb,
        unit: entry.unit,
        current_value: formatValue(
          getCurrentValue(context.parameters[entry.path]?.values),
          entry.unit
        ),
      })),
    }),
    isError: false,
  };
}

function getParameterTool(context: UsAskContext, input: any): ToolOutcome {
  const path = typeof input?.path === 'string' ? input.path : '';
  const entry = context.index.entries.find((e) => e.path === path);
  if (!entry) {
    return {
      output: `Error: unknown parameter path "${path}" — use search_parameters`,
      isError: true,
    };
  }
  const values = context.parameters[path]?.values ?? {};
  const recent = Object.entries(values)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(-8)
    .map(([date, value]) => ({ from: date, value }));
  return {
    output: JSON.stringify({
      path,
      breadcrumb: entry.breadcrumb,
      unit: entry.unit,
      description: entry.description,
      current_value: getCurrentValue(values),
      recent_values: recent,
    }),
    isError: false,
  };
}

function validateReformTool(context: UsAskContext, input: any): ToolOutcome {
  const reform = input?.reform;
  if (!reform || typeof reform !== 'object' || Array.isArray(reform)) {
    return { output: 'Error: reform must be an object mapping paths to values', isError: true };
  }
  const paths = Object.keys(reform);
  if (paths.length === 0) {
    return { output: 'Error: reform is empty', isError: true };
  }
  const errors: string[] = [];
  const provisions = paths.map((path) => {
    const entry = context.index.entries.find((e) => e.path === path);
    const value = reform[path];
    if (!entry) {
      errors.push(`Unknown parameter path: ${path}`);
    }
    if (typeof value !== 'number' && typeof value !== 'boolean') {
      errors.push(`Value for ${path} must be a number or boolean, got ${typeof value}`);
    }
    return {
      path,
      breadcrumb: entry?.breadcrumb ?? null,
      current_value: getCurrentValue(context.parameters[path]?.values),
      proposed_value: value,
    };
  });
  return {
    output: JSON.stringify({ valid: errors.length === 0, errors, provisions }),
    isError: errors.length > 0,
  };
}

export function executeUsAskTool(context: UsAskContext, toolName: string, input: any): ToolOutcome {
  switch (toolName) {
    case 'search_parameters':
      return searchTool(context, input);
    case 'get_parameter':
      return getParameterTool(context, input);
    case 'validate_reform':
      return validateReformTool(context, input);
    default:
      return { output: `Error: unknown tool ${toolName}`, isError: true };
  }
}
