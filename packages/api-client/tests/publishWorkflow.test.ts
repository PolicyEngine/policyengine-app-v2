import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { parse } from "yaml";

/** A job's or the workflow's `permissions`, in any form GitHub accepts. */
type Permissions = string | Record<string, string> | undefined;

interface Step {
  readonly name?: string;
  readonly uses?: string;
  readonly run?: string;
  readonly with?: Record<string, string | boolean | number>;
  readonly env?: Record<string, string>;
}

interface Job {
  readonly permissions?: Permissions;
  readonly environment?: string | { readonly name?: string };
  readonly steps?: readonly Step[];
}

interface Workflow {
  readonly on: Record<string, Record<string, unknown> | null>;
  readonly permissions?: Permissions;
  readonly concurrency?: {
    readonly group?: string;
    readonly "cancel-in-progress"?: boolean;
  };
  readonly jobs: Record<string, Job>;
}

const WORKFLOW_DIRECTORY = join(
  __dirname,
  "..",
  "..",
  "..",
  ".github",
  "workflows",
);

function readWorkflow(fileName: string): Workflow {
  return parse(
    readFileSync(join(WORKFLOW_DIRECTORY, fileName), "utf8"),
  ) as Workflow;
}

/**
 * The workflow that publishes this package to npm, parsed as YAML, so that
 * quoting, flow mappings, anchors and comments cannot hide what it says.
 */
const WORKFLOW = readWorkflow("publish-api-client.yaml");
const PR_WORKFLOW = readWorkflow("pr.yaml");

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

/** Everything a step hands to its action or its shell, as one string. */
function stepText(step: Step): string {
  return JSON.stringify(step);
}

function jobsUsingAppKey(): string[] {
  return Object.entries(WORKFLOW.jobs)
    .filter(([, job]) =>
      (job.steps ?? []).some((step) =>
        stepText(step).includes("secrets.APP_PRIVATE_KEY"),
      ),
    )
    .map(([jobName]) => jobName);
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

  test("given a push to main or a manual start then the workflow runs, with no path filter", () => {
    // Then
    expect(Object.keys(WORKFLOW.on).sort()).toEqual([
      "push",
      "workflow_dispatch",
    ]);
    expect(WORKFLOW.on.push).toEqual({ branches: ["main"] });
  });

  test("given two runs on one branch then the second waits for the first", () => {
    // Then
    expect(WORKFLOW.concurrency?.group).toContain("github.ref");
    expect(WORKFLOW.concurrency?.["cancel-in-progress"]).toBe(false);
  });

  test("given the publish job holds the OIDC permission then it checks out and installs nothing", () => {
    // Given
    const publishSteps = WORKFLOW.jobs.publish?.steps ?? [];

    // Then
    expect(publishSteps.length).toBeGreaterThan(0);
    for (const step of publishSteps) {
      expect(step.uses ?? "").not.toContain("actions/checkout");
      expect(step.uses ?? "").not.toContain("setup-bun");
      expect(step.run ?? "").not.toMatch(/\bbun(x| )|npm (ci|install)/);
    }
  });

  test("given the GitHub App's private key then only the release commit job uses it", () => {
    // Then
    expect(jobsUsingAppKey()).toEqual(["release-commit"]);
  });

  test("given the release commit job then it installs no dependencies and keeps no credentials in the checkout", () => {
    // Given
    const releaseSteps = WORKFLOW.jobs["release-commit"]?.steps ?? [];
    const checkoutStep = releaseSteps.find((step) =>
      step.uses?.startsWith("actions/checkout"),
    );

    // Then
    expect(checkoutStep?.with?.["persist-credentials"]).toBe(false);
    for (const step of releaseSteps) {
      expect(step.uses ?? "").not.toContain("setup-bun");
      expect(step.run ?? "").not.toMatch(/\bbun(x| )|npm (ci|install)/);
    }
  });

  test("given the release commit job then its App token is made last, for contents only, just before the push", () => {
    // Given
    const releaseSteps = WORKFLOW.jobs["release-commit"]?.steps ?? [];
    const tokenStepIndex = releaseSteps.findIndex((step) =>
      step.uses?.startsWith("actions/create-github-app-token"),
    );
    const stepsBeforeToken = releaseSteps.slice(0, tokenStepIndex);
    const stepsAfterToken = releaseSteps.slice(tokenStepIndex + 1);

    // Then
    expect(tokenStepIndex).toBeGreaterThan(0);
    expect(releaseSteps[tokenStepIndex]?.with?.["permission-contents"]).toBe(
      "write",
    );
    expect(stepsBeforeToken.map(stepText).join("\n")).toContain("towncrier");
    expect(stepsAfterToken).toHaveLength(1);
    expect(stepsAfterToken[0]?.run).toContain("git push");
  });

  test("given the workflow's own token then no job asks for more than reading contents", () => {
    // Then
    for (const [jobName, job] of Object.entries(WORKFLOW.jobs)) {
      if (typeof job.permissions === "object") {
        expect(job.permissions.contents ?? "read", jobName).toBe("read");
      } else {
        expect(job.permissions, jobName).toBeUndefined();
      }
    }
  });
});

describe("the changelog fragment check in the PR workflow", () => {
  test("given any pull request to main then the workflow runs, with no path filter", () => {
    // Then
    expect(PR_WORKFLOW.on.pull_request).not.toHaveProperty("paths");
    expect(PR_WORKFLOW.on.pull_request).not.toHaveProperty("paths-ignore");
  });

  test("given the check job then it can only read and compares the merge commit with its first parent", () => {
    // Given
    const checkJob = PR_WORKFLOW.jobs["api-client-changelog-fragment"];
    const checkSteps = checkJob?.steps ?? [];
    const checkoutStep = checkSteps.find((step) =>
      step.uses?.startsWith("actions/checkout"),
    );

    // Then
    expect(checkJob?.permissions).toEqual({ contents: "read" });
    expect(checkoutStep?.with?.["fetch-depth"]).toBe(2);
    expect(checkoutStep?.with?.["persist-credentials"]).toBe(false);
    expect(checkSteps.map(stepText).join("\n")).toContain(
      "check-changelog-fragment.mjs HEAD^1 HEAD",
    );
  });
});
