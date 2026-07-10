/**
 * Engine-neutral execution provenance returned by calculation APIs.
 *
 * Requested aliases record what the caller asked for. Resolved identities
 * record what actually ran, with certified release metadata kept separate
 * from installed package versions.
 */
export interface PolicyEngineBundle {
  model_version?: string | null;
  policyengine_version?: string | null;
  data_version?: string | null;
  dataset?: string | null;
}

export interface RequestedExecutionAliases {
  engine?: string | null;
  bundle?: string | null;
  model?: string | null;
  data?: string | null;
  ruleset?: string | null;
  population?: string | null;
  numeric_mode?: string | null;
}

export interface ArtifactIdentity {
  name: string;
  version?: string | null;
  uri?: string | null;
  revision?: string | null;
  sha256?: string | null;
  build_id?: string | null;
}

export interface RuntimeIdentity {
  name: string;
  version: string;
  git_sha?: string | null;
  artifact?: ArtifactIdentity | null;
}

export interface PackageVersion {
  name: string;
  version: string;
  sha256?: string | null;
  wheel_url?: string | null;
}

export interface DataPackageVersion extends PackageVersion {
  repo_id: string;
  repo_type: string;
  release_manifest_path: string;
  release_manifest_revision?: string | null;
}

export interface PackageResolution {
  actual: PackageVersion;
  certified?: PackageVersion | null;
}

export interface ArtifactPathReference {
  path: string;
  revision?: string | null;
  sha256?: string | null;
  metadata_sha256?: string | null;
  repo_id?: string | null;
  repo_type?: string | null;
}

export interface CertifiedDataArtifact {
  data_package?: PackageVersion | null;
  dataset: string;
  uri: string;
  sha256?: string | null;
  build_id?: string | null;
}

export interface DataCertification {
  compatibility_basis: string;
  certified_for_model_version: string;
  data_build_id?: string | null;
  built_with_model_version?: string | null;
  built_with_model_git_sha?: string | null;
  data_build_fingerprint?: string | null;
  certified_by?: string | null;
}

export interface CountryReleaseManifest {
  schema_version: number;
  bundle_id?: string | null;
  published_at?: string | null;
  country_id: string;
  policyengine_version: string;
  model_package: PackageVersion;
  data_package: DataPackageVersion;
  default_dataset: string;
  datasets: Record<string, ArtifactPathReference>;
  region_datasets: Record<string, { path_template: string }>;
  certified_data_artifact?: CertifiedDataArtifact | null;
  certification?: DataCertification | null;
}

export interface TraceReference {
  composition_fingerprint: string;
  sha256?: string | null;
  url?: string | null;
  name?: string | null;
}

export interface ResolvedExecutionBundle {
  runtime: RuntimeIdentity;
  numeric_mode: string;
  model?: PackageResolution | null;
  data?: PackageResolution | null;
  ruleset_artifact?: ArtifactIdentity | null;
  population_artifact?: ArtifactIdentity | null;
  certified_release?: CountryReleaseManifest | null;
  bundle_trace?: TraceReference | null;
}

export interface ExecutionReceipt {
  schema_version: 1;
  requested: RequestedExecutionAliases;
  resolved: ResolvedExecutionBundle;
  run_id?: string | null;
  created_at?: string | null;
  /** SHA-256 of RFC 8785 JCS canonical request bytes. */
  request_sha256?: string | null;
  /** SHA-256 of RFC 8785 JCS canonical result bytes. */
  result_sha256?: string | null;
}

export interface ExecutionProvenance {
  policyengine_bundle?: PolicyEngineBundle | null;
  execution_receipt?: ExecutionReceipt | null;
}
