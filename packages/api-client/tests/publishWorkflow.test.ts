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

interface Concurrency {
  readonly group?: string;
  readonly "cancel-in-progress"?: boolean;
}

interface Job {
  readonly if?: string;
  readonly needs?: string | readonly string[];
  readonly permissions?: Permissions;
  readonly environment?: string | { readonly name?: string };
  readonly concurrency?: Concurrency;
  readonly steps?: readonly Step[];
}

interface Workflow {
  readonly on: Record<string, Record<string, unknown> | null>;
  readonly permissions?: Permissions;
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
const RELEASE_COMMIT_MESSAGE = "Update @policyengine/api-client";
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

  test("given the release commit then versioning skips it and the publishing jobs run on it", () => {
    // Then
    expect(WORKFLOW.jobs.versioning?.if).toContain(
      `github.event.head_commit.message != '${RELEASE_COMMIT_MESSAGE}'`,
    );
    for (const jobName of ["build", "publish"]) {
      expect(WORKFLOW.jobs[jobName]?.if, jobName).toContain(
        `github.event.head_commit.message == '${RELEASE_COMMIT_MESSAGE}'`,
      );
    }
  });

  test("given a manual start then the publishing jobs can retry a release", () => {
    // Then
    for (const jobName of ["build", "publish"]) {
      expect(WORKFLOW.jobs[jobName]?.if, jobName).toContain(
        "github.event_name == 'workflow_dispatch'",
      );
    }
  });

  test.each(["versioning", "publish"])(
    "given two runs reach the %s job then the second waits for the first",
    (jobName) => {
      // Then
      expect(WORKFLOW.jobs[jobName]?.concurrency?.group).toBeTruthy();
      expect(WORKFLOW.jobs[jobName]?.concurrency?.["cancel-in-progress"]).toBe(
        false,
      );
    },
  );

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

  test("given the GitHub App's private key then only the versioning job uses it", () => {
    // Then
    expect(jobsUsingAppKey()).toEqual(["versioning"]);
  });

  test("given the versioning job then it installs no dependencies and its checkout keeps no credentials", () => {
    // Given
    const versioningSteps = WORKFLOW.jobs.versioning?.steps ?? [];
    const checkoutStep = versioningSteps.find((step) =>
      step.uses?.startsWith("actions/checkout"),
    );

    // Then
    expect(checkoutStep?.with?.["persist-credentials"]).toBe(false);
    for (const step of versioningSteps) {
      expect(step.uses ?? "").not.toContain("setup-bun");
      expect(step.run ?? "").not.toMatch(/\bbun(x| )|npm (ci|install)/);
    }
  });

  test("given the versioning job then its App token is made after the changelog is built and limited to contents", () => {
    // Given
    const versioningSteps = WORKFLOW.jobs.versioning?.steps ?? [];
    const tokenStepIndex = versioningSteps.findIndex((step) =>
      step.uses?.startsWith("actions/create-github-app-token"),
    );
    const stepsBeforeToken = versioningSteps.slice(0, tokenStepIndex);

    // Then
    expect(tokenStepIndex).toBeGreaterThan(0);
    expect(versioningSteps[tokenStepIndex]?.with?.["permission-contents"]).toBe(
      "write",
    );
    expect(stepsBeforeToken.map(stepText).join("\n")).toContain(
      "towncrier build",
    );
  });

  test("given the release commit then it holds only the package's folder and carries the agreed message", () => {
    // Given
    const commitStep = WORKFLOW.jobs.versioning?.steps?.find((step) =>
      step.uses?.startsWith("EndBug/add-and-commit"),
    );

    // Then
    expect(commitStep?.with?.add).toBe("packages/api-client");
    expect(commitStep?.with?.message).toBe(RELEASE_COMMIT_MESSAGE);
    expect(commitStep?.with?.fetch).toBe(false);
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

  test("given the check job then it always runs, can only read and sees the merge commit's parent", () => {
    // Given
    const checkJob = PR_WORKFLOW.jobs["api-client-changelog-fragment"];
    const checkSteps = checkJob?.steps ?? [];
    const checkoutStep = checkSteps.find((step) =>
      step.uses?.startsWith("actions/checkout"),
    );

    // Then
    expect(checkJob?.if).toBeUndefined();
    expect(checkJob?.needs).toBeUndefined();
    expect(checkJob?.permissions).toEqual({ contents: "read" });
    expect(checkoutStep?.with?.["fetch-depth"]).toBe(2);
    expect(checkoutStep?.with?.["persist-credentials"]).toBe(false);
    expect(checkSteps.map(stepText).join("\n")).toContain(
      "packages/api-client/.github/check_pr_fragment.sh",
    );
  });
});
