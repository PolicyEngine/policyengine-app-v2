export interface MetadataApiPayload {
  status: string;
  message: string | null;
  result: {
    variables: Record<string, any>;
    parameters: Record<string, any>;
    entities: Record<string, any>;
    variableModules: Record<string, any>;
    economy_options: {
      region: Array<{ name: string; label: string }>;
      time_period: Array<{ name: number; label: string }>;
      datasets: Array<{ name: string; label: string; title: string; default: boolean }>;
    };
    current_law_id: number;
    basicInputs: string[];
    modelled_policies: {
      core: Record<string, any>;
      filtered: Record<string, any>;
    };
    version: string;
  };
}

export interface MetadataState {
  currentCountry: string | null;
  loading: boolean;
  error: string | null;

  variables: Record<string, any>;
  parameters: Record<string, any>;
  entities: Record<string, any>;
  variableModules: Record<string, any>;
  economyOptions: {
    region: Array<{ name: string; label: string }>;
    time_period: Array<{ name: number; label: string }>;
    datasets: Array<{ name: string; label: string; title: string; default: boolean }>;
  };
  currentLawId: number;
  basicInputs: string[];
  modelledPolicies: {
    core: Record<string, any>;
    filtered: Record<string, any>;
  };
  version: string | null;
}
