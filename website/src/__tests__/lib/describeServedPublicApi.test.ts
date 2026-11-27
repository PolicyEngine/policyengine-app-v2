import { describe, expect, test } from "vitest";

import {
  API_ORIGIN,
  describeServedPublicApi,
  type DeploymentsResponse,
} from "@/lib/deployments";

const STAGING_WITH_BASE_PATH = "https://public-api-staging.example.test/v1";

function reportFromPublicApi(): DeploymentsResponse {
  const servedReport = {
    status: "unavailable" as const,
    py_version: null,
    model_version: null,
    data_build_id: null,
    data_basis: null,
    source_url: `${API_ORIGIN}/v2/tax-benefit-models/by-country/us`,
    detail: `Could not read the runtime report: 502 from ${API_ORIGIN}/v2/tax-benefit-models/by-country/us`,
    channels: [],
    live_since: null,
  };
  const row = {
    lock_url: null,
    py_version: null,
    core_version: null,
    model_version: null,
    data_build_id: null,
    certified_model_version: null,
    status: "unavailable" as const,
    detail: "",
    served: servedReport,
  };
  return {
    country: "us",
    model_package: "policyengine-us",
    checked_at: "2026-11-10T12:00:00Z",
    basis: "declared_default_branch_and_served",
    latest: null,
    latest_error: null,
    newest: {
      py_version: null,
      model_version: null,
      core_version: null,
      data_build_id: null,
    },
    rows: [
      {
        ...row,
        surface: {
          id: "api",
          label: "PolicyEngine API",
          serves: "api.policyengine.org",
          repository: "PolicyEngine/policyengine-api",
          branch: "master",
          served: { kind: "api_v2", origin: API_ORIGIN },
        },
      },
      {
        ...row,
        surface: {
          id: "app-v3",
          label: "App v3",
          serves: "app.policyengine.org",
          repository: "PolicyEngine/policyengine-app-v2",
          branch: "main",
          via: "api",
        },
      },
    ],
  };
}

describe("describeServedPublicApi", () => {
  test("given production's Public API then the report is returned unchanged", () => {
    // Given
    const report = reportFromPublicApi();

    // When
    const described = describeServedPublicApi(report, API_ORIGIN);

    // Then
    expect(described).toBe(report);
  });

  test("given a Public API with a base path then every row served by it names that address, and only the Public API's own row changes its host", () => {
    // When
    const described = describeServedPublicApi(
      reportFromPublicApi(),
      STAGING_WITH_BASE_PATH,
    );

    // Then
    const [publicApiRow, appRow] = described.rows;
    expect(publicApiRow.surface.serves).toBe("public-api-staging.example.test");
    expect(publicApiRow.surface.served?.origin).toBe(STAGING_WITH_BASE_PATH);
    expect(appRow.surface.serves).toBe("app.policyengine.org");
    for (const row of described.rows) {
      expect(row.served.source_url).toBe(
        `${STAGING_WITH_BASE_PATH}/v2/tax-benefit-models/by-country/us`,
      );
      expect(row.served.detail).not.toContain(API_ORIGIN);
    }
  });
});
