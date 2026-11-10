import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

/** The workflow that publishes this package to npm. */
const WORKFLOW = readFileSync(
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
);

/** One job's text, from its key under `jobs:` to the next job's key. */
function jobText(jobName: string): string {
  const jobsSection = WORKFLOW.slice(WORKFLOW.indexOf("\njobs:\n"));
  const jobs = jobsSection.split(/\n(?= {2}[A-Za-z][\w-]*:\n)/);
  return jobs.find((text) => text.startsWith(`  ${jobName}:\n`)) ?? "";
}

describe("the publish workflow", () => {
  test("given the publish job holds the OIDC permission then it runs in the npm-publish environment, which only main may deploy to", () => {
    // Given
    const publishJob = jobText("publish");

    // Then
    expect(publishJob).toContain("id-token: write");
    expect(publishJob).toMatch(/\n {4}environment: npm-publish\n/);
  });

  test("given the build job runs repository code then it holds no OIDC permission and no environment", () => {
    // Given
    const buildJob = jobText("build");

    // Then
    expect(buildJob).not.toBe("");
    expect(buildJob).not.toContain("id-token");
    expect(buildJob).not.toContain("environment:");
  });
});
