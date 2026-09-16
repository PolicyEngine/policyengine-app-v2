import { render, screen, userEvent, within } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import { HouseholdReportOutput } from '@/pages/report-output/HouseholdReportOutput';
import {
  REPRODUCTION_CONFIGS,
  REPRODUCTION_HOUSEHOLDS,
  REPRODUCTION_POLICIES,
  REPRODUCTION_REPORT,
  REPRODUCTION_RUNTIME_VERSIONS,
  REPRODUCTION_SIMULATIONS,
  REPRODUCTION_YEAR,
  reproductionSimulationsWithoutBundle,
  reproductionSimulationsWithOutput,
  reproductionSimulationsWithRuntimeVersions,
} from '@/tests/fixtures/pages/report-output/reproduce-in-python/householdSPMReproductionMocks';

vi.mock('@/hooks/household', () => ({
  useSimulationProgressDisplay: () => ({ displayProgress: 0, hasCalcStatus: false, message: null }),
}));
vi.mock('@/pages/report-output/useHouseholdCalculations', () => ({
  useHouseholdCalculations: () => ({ orchestrator: null }),
}));
vi.mock('@/hooks/useReportYear', () => ({ useReportYear: () => REPRODUCTION_YEAR }));

function renderReport(
  policies = REPRODUCTION_POLICIES,
  simulations = REPRODUCTION_SIMULATIONS,
  report = REPRODUCTION_REPORT
) {
  return render(
    <HouseholdReportOutput
      report={report}
      simulations={simulations}
      households={[...REPRODUCTION_HOUSEHOLDS].reverse()}
      policies={[...policies].reverse()}
      subpage="reproduce"
      isLoading={false}
      error={null}
    />
  );
}

function codeFor(role: 'Baseline' | 'Reform') {
  return within(screen.getByRole('region', { name: `${role} simulation` })).getByText(
    /from policyengine_us import Simulation/
  ).textContent!;
}

describe('Household report Python reproduction', () => {
  test.each([false, true])(
    'given canonical receipts without a bundle and wrapper installed %s then pins each recorded runtime independently',
    (wrapperInstalled) => {
      renderReport(REPRODUCTION_POLICIES, reproductionSimulationsWithoutBundle(wrapperInstalled));
      for (const [index, role] of (['Baseline', 'Reform'] as const).entries()) {
        const code = codeFor(role);
        const versions = REPRODUCTION_RUNTIME_VERSIONS[index];
        expect(code).toContain(`"policyengine-us==${versions['policyengine-us']}"`);
        expect(code).toContain(`"policyengine-core==${versions['policyengine-core']}"`);
        expect(code).toContain(`"spm-calculator==${versions['spm-calculator']}"`);
        expect(code).not.toContain(
          `"policyengine-core==${REPRODUCTION_RUNTIME_VERSIONS[1 - index]['policyengine-core']}"`
        );
        if (wrapperInstalled) {
          expect(code).toContain(`"policyengine[us]==${versions.policyengine}"`);
        } else {
          expect(code).not.toContain('policyengine[us]');
        }
        expect(code).toContain(`reform=${role.toLowerCase()},`);
        expect(code).toContain(REPRODUCTION_CONFIGS[index].forecast_content_sha256);
        expect(code).toContain('simulation.spm_provenance()');
      }
    }
  );

  test.each(['policyengine-core', 'spm-calculator'])(
    'given no recorded %s version then withholds exact code for that simulation',
    (packageName) => {
      renderReport(
        REPRODUCTION_POLICIES,
        reproductionSimulationsWithRuntimeVersions({ [packageName]: null })
      );
      const baseline = within(screen.getByRole('region', { name: 'Baseline simulation' }));
      expect(baseline.getByRole('status')).toHaveTextContent(
        `no recorded version for ${packageName}`
      );
      expect(
        baseline.queryByRole('button', { name: 'Copy code to clipboard' })
      ).not.toBeInTheDocument();
      expect(codeFor('Reform')).toContain('policyengine-core==7.2.0');
    }
  );

  test.each(['policyengine-us', 'policyengine'])(
    'given a conflicting recorded %s version then explains why exact reproduction is unavailable',
    (packageName) => {
      renderReport(
        REPRODUCTION_POLICIES,
        reproductionSimulationsWithRuntimeVersions({ [packageName]: '0.0.1' })
      );
      const baseline = within(screen.getByRole('region', { name: 'Baseline simulation' }));
      expect(baseline.getByRole('status')).toHaveTextContent('conflicting package versions');
      expect(
        baseline.queryByRole('button', { name: 'Copy code to clipboard' })
      ).not.toBeInTheDocument();
      expect(codeFor('Reform')).toContain('policyengine-core==7.2.0');
    }
  );

  test('given different saved inputs and receipts then each visible block reproduces its own simulation', () => {
    renderReport();
    const baseline = codeFor('Baseline');
    const reform = codeFor('Reform');
    expect(screen.getByText(/separate, fresh Python notebook/)).toBeInTheDocument();
    expect(baseline).toContain('"policyengine[us]==9.1.0" "policyengine-us==8.1.0"');
    expect(reform).toContain('"policyengine[us]==9.2.0" "policyengine-us==8.2.0"');
    expect(baseline).toContain('reform=baseline,');
    expect(baseline).toContain('2800');
    expect(baseline).not.toContain('3900');
    expect(reform).toContain('reform=reform,');
    expect(reform).toContain('3900');
    expect(reform).not.toContain('2800');
    expect(baseline).toContain('41000');
    expect(baseline).not.toContain('62000');
    expect(baseline).not.toContain('06037');
    expect(reform).toContain('62000');
    expect(reform).toContain('06037');
    expect(baseline).toContain('"geography_kind": "national"');
    expect(reform).toContain('"geography_kind": "county"');
    for (const [index, code] of [baseline, reform].entries()) {
      expect(code).toContain(REPRODUCTION_CONFIGS[index].forecast_content_sha256);
      expect(code).toContain(REPRODUCTION_CONFIGS[index].scenario);
      expect(code).toContain(REPRODUCTION_CONFIGS[index].as_of);
      expect(code).toContain('"spm_unit_spm_threshold"');
      expect(code).toContain('"spm_unit_net_income"');
      expect(code).toContain('"spm_unit_is_in_spm_poverty"');
      expect(code).toContain('simulation.spm_config');
      expect(code).toContain('simulation.spm_provenance()');
      expect(code.indexOf('simulation.spm_provenance()')).toBeGreaterThan(
        code.indexOf('print(variable, simulation.calculate(variable, 2026))')
      );
    }
  });

  test('given earning variation selected then both blocks retain their own settings and copy independently', async () => {
    const user = userEvent.setup();
    renderReport();
    await user.click(screen.getByRole('switch', { name: 'Include earning variation' }));
    expect(codeFor('Baseline')).toContain('# Baseline earning variation');
    expect(codeFor('Reform')).toContain('# Reform earning variation');
    expect(codeFor('Baseline')).toContain('"axes"');
    expect(codeFor('Reform')).toContain('"axes"');
    const clipboard = vi.spyOn(navigator.clipboard, 'writeText');
    await user.click(
      within(screen.getByRole('region', { name: 'Baseline simulation' })).getByRole('button', {
        name: 'Copy code to clipboard',
      })
    );
    expect(clipboard).toHaveBeenLastCalledWith(codeFor('Baseline'));
    await user.click(
      within(screen.getByRole('region', { name: 'Reform simulation' })).getByRole('button', {
        name: 'Copy code to clipboard',
      })
    );
    expect(clipboard).toHaveBeenLastCalledWith(codeFor('Reform'));
  });

  test('given a missing baseline policy then no code silently substitutes current law', () => {
    renderReport([REPRODUCTION_POLICIES[1]]);
    const baseline = within(screen.getByRole('region', { name: 'Baseline simulation' }));
    expect(baseline.getByRole('status')).toHaveTextContent(
      "Load this simulation's household and policy"
    );
    expect(
      baseline.queryByRole('button', { name: 'Copy code to clipboard' })
    ).not.toBeInTheDocument();
    expect(codeFor('Reform')).toContain('reform=reform,');
  });
  test.each([
    [
      'missing bundle and model versions',
      { policyengine_bundle: null },
      /no resolved model version/,
    ],
    [
      'wrapper without a resolved model version',
      { policyengine_bundle: { policyengine_version: '9.1.0' } },
      /no resolved model version/,
    ],
    [
      'missing resolved SPM settings',
      { spm_config: undefined },
      /no matching resolved SPM settings and receipt/,
    ],
    [
      'missing SPM receipt',
      { spm_provenance: undefined },
      /no matching resolved SPM settings and receipt/,
    ],
    [
      'mismatched artifact identity',
      { spm_config: REPRODUCTION_CONFIGS[1] },
      /no matching resolved SPM settings and receipt/,
    ],
  ] as const)(
    'given %s then withholds baseline code and preserves independent reform reproduction',
    (_case, output, message) => {
      renderReport(REPRODUCTION_POLICIES, reproductionSimulationsWithOutput(output));
      const baseline = within(screen.getByRole('region', { name: 'Baseline simulation' }));
      expect(baseline.getByRole('status')).toHaveTextContent(message);
      expect(
        baseline.queryByRole('button', { name: 'Copy code to clipboard' })
      ).not.toBeInTheDocument();
      expect(baseline.queryByText(/to reproduce the results/)).not.toBeInTheDocument();
      expect(codeFor('Reform')).toContain('policyengine-us==8.2.0');
    }
  );

  test('given no report year then withholds both blocks instead of using a fallback year', () => {
    renderReport(REPRODUCTION_POLICIES, REPRODUCTION_SIMULATIONS, {
      ...REPRODUCTION_REPORT,
      year: '',
    });
    expect(screen.getAllByRole('status')).toHaveLength(2);
    expect(screen.getAllByRole('status')[0]).toHaveTextContent('no saved calculation year');
    expect(
      screen.queryByRole('button', { name: 'Copy code to clipboard' })
    ).not.toBeInTheDocument();
  });
});
