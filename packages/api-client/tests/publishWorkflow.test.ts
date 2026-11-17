import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { parse } from "yaml";

/** A job's or the workflow's `permissions`, in any form GitHub accepts. */
type Permissions = string | Record<string, string> | undefined;

interface Job {
  readonly permissions?: Permissions;
  readonly environment?: string | { readonly name?: string };
}

/**
 * The workflow that publishes this package to npm, parsed as YAML, so that
 * quoting, flow mappings, anchors and comments cannot hide what it says.
 */
const WORKFLOW = parse(
  readFileSync(
    join(
      __dirname,
      "..",
      "..",
      "..",
      ".github",
      "workflows",
      "publish-api-client.yaml",
    ),
    "utf8",
  ),
) as { readonly permissions?: Permissions; readonly jobs: Record<string, Job> };

/** Whether permissions let a job request an OIDC token. */
function grantsOidc(permissions: Permissions): boolean {
  if (permissions === undefined) {
    return false;
  }
  if (typeof permissions === "string") {
    return permissions === "write-all";
  }
  return permissions["id-token"] === "write";
}

function environmentName(job: Job): string | undefined {
  return typeof job.environment === "string"
    ? job.environment
    : job.environment?.name;
}

describe("the publish workflow", () => {
  test("given the publish job holds the OIDC permission then it names the npm-publish environment", () => {
    // Given
    const publishJob = WORKFLOW.jobs.publish;

    // Then
    expect(grantsOidc(publishJob?.permissions)).toBe(true);
    expect(environmentName(publishJob ?? {})).toBe("npm-publish");
  });

  test("given the workflow's own permissions then they are only contents: read", () => {
    // Then
    expect(WORKFLOW.permissions).toEqual({ contents: "read" });
  });

  test("given every job but publish then none can request an OIDC token or names an environment", () => {
    // Given
    const otherJobs = Object.entries(WORKFLOW.jobs).filter(
      ([jobName]) => jobName !== "publish",
    );

    // Then
    expect(otherJobs.length).toBeGreaterThan(0);
    for (const [jobName, job] of otherJobs) {
      expect(grantsOidc(job.permissions), jobName).toBe(false);
      expect(job.environment, jobName).toBeUndefined();
    }
  });
});
