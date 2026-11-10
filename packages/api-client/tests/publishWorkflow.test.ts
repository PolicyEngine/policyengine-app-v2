import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

/**
 * The workflow that publishes this package to npm, without blank lines or
 * lines that hold only a comment, so that comments cannot affect a check.
 */
const WORKFLOW_LINES = readFileSync(
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
)
  .split("\n")
  .filter((text) => text.trim() !== "" && !text.trim().startsWith("#"));

const TOP_LEVEL_KEY = /^[A-Za-z][\w-]*:/;
const JOB_KEY = /^ {2}([A-Za-z][\w-]*):\s*$/;

/** The lines under one top-level key, such as `permissions:` or `jobs:`. */
function topLevelSection(key: string): string[] {
  const start = WORKFLOW_LINES.findIndex((text) =>
    new RegExp(`^${key}:\\s*$`).test(text),
  );
  if (start === -1) {
    return [];
  }
  const end = WORKFLOW_LINES.findIndex(
    (text, index) => index > start && TOP_LEVEL_KEY.test(text),
  );
  return WORKFLOW_LINES.slice(start + 1, end === -1 ? undefined : end);
}

/** Each job's lines, by job name, from its key under `jobs:`. */
function jobs(): Map<string, string[]> {
  const jobLines = new Map<string, string[]>();
  let currentJob: string | null = null;
  for (const text of topLevelSection("jobs")) {
    const jobKey = JOB_KEY.exec(text);
    if (jobKey) {
      currentJob = jobKey[1];
      jobLines.set(currentJob, []);
    } else if (currentJob !== null) {
      jobLines.get(currentJob)?.push(text);
    }
  }
  return jobLines;
}

const grantsOidc = (text: string) =>
  /\bid-token\s*:/.test(text) || /\bwrite-all\b/.test(text);

describe("the publish workflow", () => {
  test("given the publish job holds the OIDC permission then it names the npm-publish environment", () => {
    // Given
    const publishJob = (jobs().get("publish") ?? []).join("\n");

    // Then
    expect(publishJob).toMatch(/^ {6}id-token: write$/m);
    expect(publishJob).toMatch(
      /^ {4}environment: *["']?npm-publish["']?$|^ {4}environment:\n {6}name: *["']?npm-publish["']?$/m,
    );
  });

  test("given the workflow's own permissions then they are only contents: read", () => {
    // Then
    expect(topLevelSection("permissions")).toEqual(["  contents: read"]);
  });

  test("given every job but publish then none can request an OIDC token or names an environment", () => {
    // Given
    const otherJobs = [...jobs()].filter(([jobName]) => jobName !== "publish");

    // Then
    expect(otherJobs.map(([jobName]) => jobName)).toEqual(["build"]);
    for (const [jobName, jobLines] of otherJobs) {
      expect(jobLines.filter(grantsOidc), jobName).toEqual([]);
      expect(
        jobLines.filter((text) => /^ {4}environment:/.test(text)),
        jobName,
      ).toEqual([]);
    }
  });

  test("given the whole workflow then the only OIDC permission is the publish job's", () => {
    // Then
    expect(WORKFLOW_LINES.filter(grantsOidc)).toEqual([
      "      id-token: write",
    ]);
  });
});
