/** Public US SPM settings. The API validates the selected certified artifact. */
export type SPMSelection = {
  forecast_content_sha256?: string | null;
  scenario?: string | null;
  county_vintage?: '2020';
  as_of?: string | null;
} & (
  | { geography_kind: 'national' | 'county'; geography_id?: never }
  | { geography_kind: 'metro'; geography_id: string }
);

export interface SPMMetadata {
  available: boolean;
  defaults?: SPMSelection;
  settings_schema?: Record<string, unknown>;
}

export interface SPMProvenance {
  forecast_id: string;
  forecast_sha256: string;
  scenario: string;
  geography_kind: string;
  runtime_versions: Record<string, string | null>;
  years: Record<string, Record<string, unknown>>;
  geographies: Record<string, unknown>[];
  composition_method: string;
  storage_method: string;
}
