import { Policy } from '@/types/ingredients/Policy';

/**
 * Deep equality check for policies based on their parameters
 */
export function policiesAreEqual(
  policy1: Policy | undefined,
  policy2: Policy | undefined
): boolean {
  if (!policy1 || !policy2) return false;
  if (policy1.id === policy2.id) return true;

  // Compare parameters arrays
  const params1 = policy1.parameters || [];
  const params2 = policy2.parameters || [];

  if (params1.length !== params2.length) return false;

  // Sort by parameter name for comparison
  const sorted1 = [...params1].sort((a, b) => a.name.localeCompare(b.name));
  const sorted2 = [...params2].sort((a, b) => a.name.localeCompare(b.name));

  // Compare each parameter
  for (let i = 0; i < sorted1.length; i++) {
    const p1 = sorted1[i];
    const p2 = sorted2[i];

    if (p1.name !== p2.name) return false;

    // Compare values arrays
    if (p1.values.length !== p2.values.length) return false;

    for (let j = 0; j < p1.values.length; j++) {
      const v1 = p1.values[j];
      const v2 = p2.values[j];

      if (
        v1.startDate !== v2.startDate ||
        v1.endDate !== v2.endDate ||
        v1.value !== v2.value
      ) {
        return false;
      }
    }
  }

  return true;
}

export interface PolicyColumn {
  policies: Policy[];
  label: string;
  policyLabels: string[];
}

/**
 * Determine which columns to show based on policy equality
 * Merges columns when policies are identical
 */
export function determinePolicyColumns(
  currentLaw?: Policy,
  baseline?: Policy,
  reform?: Policy
): PolicyColumn[] {
  const columns: PolicyColumn[] = [];

  // All three policies exist
  if (currentLaw && baseline && reform) {
    const clEqualsBase = policiesAreEqual(currentLaw, baseline);
    const clEqualsRef = policiesAreEqual(currentLaw, reform);
    const baseEqualsRef = policiesAreEqual(baseline, reform);

    if (clEqualsBase && baseEqualsRef) {
      // All three are equal
      return [
        {
          policies: [currentLaw],
          label: 'Current Law / Baseline / Reform',
          policyLabels: [
            currentLaw.label || 'Current Law',
            baseline.label || 'Baseline',
            reform.label || 'Reform',
          ],
        },
      ];
    }

    if (clEqualsBase) {
      // Current Law === Baseline, Reform different
      return [
        {
          policies: [currentLaw],
          label: 'Current Law / Baseline',
          policyLabels: [currentLaw.label || 'Current Law', baseline.label || 'Baseline'],
        },
        {
          policies: [reform],
          label: 'Reform',
          policyLabels: [reform.label || 'Reform'],
        },
      ];
    }

    if (clEqualsRef) {
      // Current Law === Reform, Baseline different
      return [
        {
          policies: [currentLaw],
          label: 'Current Law / Reform',
          policyLabels: [currentLaw.label || 'Current Law', reform.label || 'Reform'],
        },
        {
          policies: [baseline],
          label: 'Baseline',
          policyLabels: [baseline.label || 'Baseline'],
        },
      ];
    }

    if (baseEqualsRef) {
      // Baseline === Reform, Current Law different
      return [
        {
          policies: [currentLaw],
          label: 'Current Law',
          policyLabels: [currentLaw.label || 'Current Law'],
        },
        {
          policies: [baseline],
          label: 'Baseline / Reform',
          policyLabels: [baseline.label || 'Baseline', reform.label || 'Reform'],
        },
      ];
    }

    // All three different
    return [
      {
        policies: [currentLaw],
        label: 'Current Law',
        policyLabels: [currentLaw.label || 'Current Law'],
      },
      {
        policies: [baseline],
        label: 'Baseline',
        policyLabels: [baseline.label || 'Baseline'],
      },
      {
        policies: [reform],
        label: 'Reform',
        policyLabels: [reform.label || 'Reform'],
      },
    ];
  }

  // Only baseline and reform (household reports)
  if (baseline && reform) {
    if (policiesAreEqual(baseline, reform)) {
      return [
        {
          policies: [baseline],
          label: 'Baseline / Reform',
          policyLabels: [baseline.label || 'Baseline', reform.label || 'Reform'],
        },
      ];
    }

    return [
      {
        policies: [baseline],
        label: 'Baseline',
        policyLabels: [baseline.label || 'Baseline'],
      },
      {
        policies: [reform],
        label: 'Reform',
        policyLabels: [reform.label || 'Reform'],
      },
    ];
  }

  // Fallback: show whatever policies we have
  if (currentLaw) {
    columns.push({
      policies: [currentLaw],
      label: 'Current Law',
      policyLabels: [currentLaw.label || 'Current Law'],
    });
  }
  if (baseline) {
    columns.push({
      policies: [baseline],
      label: 'Baseline',
      policyLabels: [baseline.label || 'Baseline'],
    });
  }
  if (reform) {
    columns.push({
      policies: [reform],
      label: 'Reform',
      policyLabels: [reform.label || 'Reform'],
    });
  }

  return columns;
}
