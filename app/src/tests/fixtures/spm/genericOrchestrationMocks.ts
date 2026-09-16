import { ReportAdapter } from '@/adapters/ReportAdapter';
import { SimulationAdapter } from '@/adapters/SimulationAdapter';
import type { HouseholdCalculationResult } from '@/api/householdCalculation';
import type { ReportBuilderState } from '@/pages/reportBuilder/types';
import { mockUSReportOutput } from '@/tests/fixtures/api/societyWideMocks';
import {
  REPRODUCTION_HOUSEHOLDS,
  REPRODUCTION_POLICIES,
  REPRODUCTION_SIMULATIONS,
} from '@/tests/fixtures/pages/report-output/reproduce-in-python/householdSPMReproductionMocks';
import type { CalcStartConfig } from '@/types/calculation';
import type { ReportMetadata } from '@/types/metadata/reportMetadata';
import type { SimulationMetadata } from '@/types/metadata/simulationMetadata';
import type { ReportSetOutputPayload, SimulationSetOutputPayload } from '@/types/payloads';
import { initializeSimulationState } from '@/utils/pathwayState/initializeSimulationState';

export const GENERIC_REPORT_ID = '301';
export const GENERIC_SIMULATION_IDS = ['101', '102'];
export const GENERIC_HOUSEHOLD_IDS = ['201', '202'];
export const GENERIC_POLICY_IDS = ['11', '12'];
export const GENERIC_USER_REPORT_ID = 'sur-generic-existing';
export const GENERIC_HOUSEHOLDS = REPRODUCTION_HOUSEHOLDS.map((household, index) =>
  household.withId(GENERIC_HOUSEHOLD_IDS[index])
);
export const GENERIC_POLICIES = REPRODUCTION_POLICIES.map((policy, index) => ({
  ...policy,
  id: GENERIC_POLICY_IDS[index],
}));
export const GENERIC_ENVELOPES: HouseholdCalculationResult[] = REPRODUCTION_SIMULATIONS.map(
  (simulation, index) => ({
    ...(simulation.output as HouseholdCalculationResult),
    result: {
      people: {
        you: { age: { '2026': 40 }, employment_income: { '2026': index === 0 ? 41000 : 62000 } },
      },
      households: {
        household: {
          members: ['you'],
          household_net_income: { '2026': index === 0 ? 38000 : 54000 },
        },
      },
    },
  })
);
export const GENERIC_SPM_ERROR = {
  code: 'SPM_GEOGRAPHY_UNAVAILABLE',
  message: 'County 06037 is unavailable in the selected SPM artifact. Choose another geography.',
};
export const GENERIC_OTHER_ERROR = 'The household calculation service is temporarily unavailable.';
export const GENERIC_ECONOMY_OUTPUT = mockUSReportOutput;
export const GENERIC_REPORT_STATE: ReportBuilderState = {
  label: 'Canonical integration report',
  year: '2026',
  simulations: GENERIC_HOUSEHOLDS.map((household, index) => {
    const simulation = initializeSimulationState();
    simulation.label = index === 0 ? 'Baseline' : 'Reform';
    simulation.policy.id = GENERIC_POLICY_IDS[index];
    simulation.population.household = household;
    return simulation;
  }),
};

function json(result: unknown, status = 200) {
  return new Response(JSON.stringify({ status: 'ok', result }), { status });
}
export class GenericOrchestrationHTTP {
  readonly simulations = new Map<string, SimulationMetadata>();
  readonly simulationPatches: SimulationSetOutputPayload[] = [];
  readonly reportPatches: ReportSetOutputPayload[] = [];
  readonly calculationRequests: string[] = [];
  readonly economyRequests: string[] = [];
  private additionalReports = new Map<string, ReportMetadata>();
  private deferredEconomy?: (response: Response) => void;
  deferEconomy = false;
  report: ReportMetadata = {
    id: Number(GENERIC_REPORT_ID),
    country_id: 'us',
    simulation_1_id: '101',
    simulation_2_id: '102',
    year: '2026',
    api_version: 'synthetic',
    status: 'pending',
    output: null,
  };
  failure: { index: number; code?: string; message: string } | null = null;
  deferCalculations = false;
  readonly deferSimulationIds = new Set<string>();
  private deferredSimulationWrites = new Map<string, () => void>();
  private deferred = new Map<number, ((response: Response) => void)[]>();
  private nextSimulation = 0;

  seed() {
    GENERIC_SIMULATION_IDS.forEach((id, index) =>
      this.simulations.set(id, {
        id: Number(id),
        country_id: 'us',
        api_version: 'synthetic',
        population_id: GENERIC_HOUSEHOLD_IDS[index],
        population_type: 'household',
        policy_id: GENERIC_POLICY_IDS[index],
        output: null,
        status: 'pending',
      })
    );
  }
  resolveCalculation(index: number) {
    const callbacks = this.deferred.get(index) ?? [];
    this.deferred.delete(index);
    callbacks.forEach((resolve) => resolve(this.calculationResponse(index)));
  }
  resolveAll() {
    [0, 1].forEach((index) => this.resolveCalculation(index));
    [...this.deferredSimulationWrites.keys()].forEach((id) => this.resolveSimulationWrite(id));
    this.resolveEconomy();
  }
  resolveEconomy() {
    this.deferredEconomy?.(json(GENERIC_ECONOMY_OUTPUT));
    this.deferredEconomy = undefined;
  }
  resolveSimulationWrite(id: string) {
    this.deferredSimulationWrites.get(id)?.();
    this.deferredSimulationWrites.delete(id);
  }
  private calculationResponse(index: number) {
    if (this.failure?.index === index) {
      return new Response(
        JSON.stringify(
          this.failure.code
            ? { errors: [{ code: this.failure.code, message: this.failure.message }] }
            : { message: this.failure.message }
        ),
        { status: this.failure.code ? 400 : 503 }
      );
    }
    return new Response(JSON.stringify({ status: 'ok', ...GENERIC_ENVELOPES[index] }));
  }
  fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const pathname = new URL(String(input)).pathname;
    const method = init?.method ?? 'GET';
    const payload = init?.body ? JSON.parse(String(init.body)) : undefined;
    if (pathname === '/us/economy/12/over/11') {
      this.economyRequests.push(String(input));
      return this.deferEconomy
        ? new Promise((resolve) => {
            this.deferredEconomy = resolve;
          })
        : json(GENERIC_ECONOMY_OUTPUT);
    }
    const calculation = /^\/us\/household\/(\d+)\/policy\/(\d+)$/.exec(pathname);
    if (calculation) {
      this.calculationRequests.push(pathname);
      const index = GENERIC_POLICY_IDS.indexOf(calculation[2]);
      if (index < 0) {
        throw new Error(`Unexpected policy: ${pathname}`);
      }
      if (this.deferCalculations) {
        return new Promise((resolve) => {
          this.deferred.set(index, [...(this.deferred.get(index) ?? []), resolve]);
        });
      }
      return this.calculationResponse(index);
    }
    if (pathname === '/us/simulation' && method === 'POST') {
      const id = GENERIC_SIMULATION_IDS[this.nextSimulation++];
      const metadata: SimulationMetadata = {
        id: Number(id),
        country_id: 'us',
        api_version: 'synthetic',
        ...payload,
        policy_id: String(payload.policy_id),
        status: 'pending',
        output: null,
      };
      this.simulations.set(id, metadata);
      return json(metadata);
    }
    if (pathname === '/us/simulation' && method === 'PATCH') {
      this.simulationPatches.push(payload);
      if (this.deferSimulationIds.has(String(payload.id))) {
        await new Promise<void>((resolve) => {
          this.deferredSimulationWrites.set(String(payload.id), resolve);
        });
      }
      const metadata = { ...this.simulations.get(String(payload.id))!, ...payload };
      this.simulations.set(String(payload.id), metadata);
      return json(metadata);
    }
    if (pathname.startsWith('/us/simulation/') && method === 'GET') {
      return json(this.simulations.get(pathname.split('/').at(-1)!));
    }
    if (pathname === '/us/report' && method === 'POST') {
      this.report = {
        ...this.report,
        ...payload,
        simulation_1_id: String(payload.simulation_1_id),
        simulation_2_id: payload.simulation_2_id ? String(payload.simulation_2_id) : null,
      };
      return json(this.report);
    }
    if (pathname === '/us/report' && method === 'PATCH') {
      this.reportPatches.push(payload);
      if (String(payload.id) !== GENERIC_REPORT_ID) {
        const report = { ...this.report, ...payload };
        this.additionalReports.set(String(payload.id), report);
        return json(report);
      }
      this.report = { ...this.report, ...payload };
      return json(this.report);
    }
    if (pathname === `/us/report/${GENERIC_REPORT_ID}` && method === 'GET') {
      return json(this.report);
    }
    if (pathname.startsWith('/us/report/') && method === 'GET') {
      return json(this.additionalReports.get(pathname.split('/').at(-1)!));
    }
    throw new Error(`Unexpected request: ${method} ${pathname}`);
  };

  get domainReport() {
    return ReportAdapter.fromMetadata(this.report);
  }
  get domainSimulations() {
    return GENERIC_SIMULATION_IDS.map((id) =>
      SimulationAdapter.fromMetadata(this.simulations.get(id)!)
    );
  }
  get genericConfigs(): CalcStartConfig[] {
    return this.domainSimulations.map((simulation, index) => ({
      calcId: simulation.id!,
      targetType: 'simulation',
      reportId: GENERIC_REPORT_ID,
      countryId: 'us',
      year: '2026',
      simulations: { simulation1: simulation, simulation2: null },
      populations: {
        household1: GENERIC_HOUSEHOLDS[index],
        household2: null,
        geography1: null,
        geography2: null,
      },
    }));
  }
  get dedicatedConfig() {
    return {
      reportId: GENERIC_REPORT_ID,
      countryId: 'us',
      report: this.domainReport,
      simulationConfigs: this.domainSimulations.map((simulation) => ({
        simulationId: simulation.id!,
        populationId: simulation.populationId!,
        policyId: simulation.policyId!,
      })),
    };
  }
}
