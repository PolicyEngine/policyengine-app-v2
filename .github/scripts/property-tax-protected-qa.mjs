/** Supplemental Linux QA. Never run this module with deployment credentials locally.
 * Protection semantics: https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation
 * No automatic auth across rewrites: https://vercel.com/changelog/deployment-protection-now-supports-protected-rewrites
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import {
  inspectTopShell,
  REQUIRED_NAV_LABELS,
} from "./audit-app-zone-shell.mjs";

export const CONFIG = Object.freeze({
  teamId: "team_xsyTmFLMLGbHH7Qxu70R5G4r",
  projects: {
    host: {
      id: "prj_akr348YnU4ccf5uo9BH3hocEr4lv",
      name: "policyengine-website",
    },
    child: {
      id: "prj_qUqoE05tPicB8fy1oCtvIZ9limeH",
      name: "property-tax-relief",
    },
  },
  childSha: "a2354c2d31ff8bcfb6a1f9a19edb8a54af2ca378",
  childAlias: "property-tax-relief.vercel.app",
  toolPath: "/us/rent-and-property-taxes/",
  assetPath: "/_zones/property-tax-relief/",
});
const OUTPUT = resolve("output/property-tax-protected-qa");
const CHILD = resolve("qa-child");
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
class QaError extends Error {}
// Only evidence created at validated transport/build guards can enter failure.json.
// Arbitrary error properties and messages must never become diagnostic payloads.
const mismatchDetails = new WeakMap();
const redirectDetails = new WeakMap();
const runtimeCaptures = new WeakMap();
const runtimeDiagnostic = Object.freeze({
  path: "/_zones/property-tax-relief/_next/static/chunks/turbopack-2ldtdtmjp3oyl.js",
  expectedSha256:
    "c2938fab495210b87d9f735375cb0ed03787e4072a770f349ba7bae0a28217bf",
  file: "mismatched-turbopack-runtime.js",
  maxBytes: 32 * 1024,
});
export function failureEvidence(error) {
  const trusted = error instanceof QaError;
  const mismatch = trusted ? mismatchDetails.get(error) : undefined;
  const redirect = trusted ? redirectDetails.get(error) : undefined;
  return {
    status: "BLOCKED",
    code: trusted ? error.message : "QA_FAILED",
    ...(mismatch ? { mismatch } : {}),
    ...(redirect ? { redirect } : {}),
  };
}
export function writeFailureEvidence(error, directory = OUTPUT) {
  const failure = failureEvidence(error);
  const runtime = runtimeCaptures.get(error);
  mkdirSync(directory, { recursive: true });
  if (runtime) {
    writeFileSync(resolve(directory, runtimeDiagnostic.file), runtime, {
      flag: "wx",
      mode: 0o600,
    });
    failure.runtimeArtifact = {
      file: runtimeDiagnostic.file,
      bytes: runtime.length,
      sha256: digest(runtime),
    };
  }
  writeFileSync(resolve(directory, "failure.json"), JSON.stringify(failure));
  return failure;
}

function containsEncodedKey(body, keys, extraSecrets = []) {
  const text = body.toString("utf8").toLowerCase();
  const secrets = [keys.hostKey, keys.childKey, ...extraSecrets].filter(
    Boolean,
  );
  return secrets.some((secret) => {
    const bytes = Buffer.from(secret);
    const hex = (byte) => byte.toString(16).padStart(2, "0");
    // Encoding checks only prevent diagnostic leaks; build hashes use raw bytes.
    const variants = [
      secret,
      encodeURIComponent(secret),
      [...bytes].map((byte) => `%${hex(byte)}`).join(""),
      bytes.toString("base64"),
      bytes.toString("base64").replace(/=+$/, ""),
      bytes.toString("base64url"),
      bytes.toString("hex"),
      [...secret]
        .map((char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`)
        .join(""),
      [...bytes].map((byte) => `\\x${hex(byte)}`).join(""),
      [...secret].map((char) => `&#${char.charCodeAt(0)};`).join(""),
      [...secret]
        .map((char) => `&#x${char.charCodeAt(0).toString(16)};`)
        .join(""),
    ];
    return variants.some((value) => text.includes(value.toLowerCase()));
  });
}

function retainKnownRuntime(error, file, path, expectedSha256, manifest, keys) {
  const text = file.body.toString("utf8");
  const mediaType = file.contentType.split(";", 1)[0];
  if (
    path === runtimeDiagnostic.path &&
    expectedSha256 === runtimeDiagnostic.expectedSha256 &&
    file.url === manifest.child.origin + runtimeDiagnostic.path &&
    file.status === 200 &&
    ["application/javascript", "text/javascript"].includes(mediaType) &&
    file.body.length >= 512 &&
    file.body.length <= runtimeDiagnostic.maxBytes &&
    Buffer.from(text, "utf8").equals(file.body) &&
    text.startsWith("(()=>{") &&
    ["globalThis.TURBOPACK", "TURBOPACK_ASSET_SUFFIX", "registerChunk"].every(
      (signature) => text.includes(signature),
    ) &&
    !/<(?:!doctype|html|head|body|form|title)\b|Authentication Required|Vercel Authentication|Log in to Vercel|Security Checkpoint/i.test(
      text,
    ) &&
    !containsEncodedKey(file.body, keys)
  ) {
    runtimeCaptures.set(error, Buffer.from(file.body));
  }
}
const requireQa = (condition, code) => {
  if (!condition) throw new QaError(code);
};
const shaPattern = /^[a-f0-9]{40}$/;
const deploymentPattern = /^dpl_[A-Za-z0-9]{10,80}$/;

export function validateBuildReceipt(
  receipt,
  deploymentId,
  sourceArchiveSha256,
) {
  requireQa(
    receipt?.version === 1 &&
      receipt.deploymentId === deploymentId &&
      receipt.sourceCommit === CONFIG.childSha &&
      receipt.sourceArchiveSha256 === sourceArchiveSha256 &&
      /^[a-f0-9]{64}$/.test(sourceArchiveSha256),
    "BUILD_RECEIPT_SOURCE_DIFFERS",
  );
  const entries = Object.entries(receipt.files ?? {});
  requireQa(entries.length > 5 && entries.length <= 200, "BAD_BUILD_MANIFEST");
  const mockManifest = {
    host: { origin: "https://host.vercel.app" },
    child: { origin: "https://child.vercel.app" },
  };
  for (const [path, hash] of entries) {
    assertAllowedUrl(mockManifest.child.origin + path, mockManifest);
    requireQa(/^[a-f0-9]{64}$/.test(hash), "BAD_BUILD_MANIFEST");
  }
  for (const path of [
    CONFIG.toolPath,
    CONFIG.toolPath + "report/",
    CONFIG.toolPath + "methods/",
    CONFIG.toolPath + "data/inventory.json",
    CONFIG.toolPath + "data/inventory.csv",
  ]) {
    requireQa(Object.hasOwn(receipt.files, path), "BUILD_FILE_MISSING");
  }
  requireQa(
    entries.some(([p]) => p.startsWith(CONFIG.assetPath)),
    "BUILD_ASSETS_MISSING",
  );
  return receipt;
}

export function validateDeployment(value, role, expectedSha, buildReceipt) {
  requireQa(
    CONFIG.projects[role] && shaPattern.test(expectedSha),
    "BAD_IDENTITY",
  );
  requireQa(deploymentPattern.test(value?.id ?? ""), "BAD_DEPLOYMENT_ID");
  requireQa(value.projectId === CONFIG.projects[role].id, "WRONG_PROJECT");
  requireQa(value.readyState === "READY", "DEPLOYMENT_NOT_READY");
  requireQa(role !== "host" || value.target === null, "HOST_NOT_PREVIEW");
  // Custom commit metadata alone is not source provenance. A manual child also
  // requires an operator-reviewed archive/build receipt and remote byte checks.
  const gitBound =
    value.gitSource?.type === "github" && value.gitSource.sha === expectedSha;
  const manualBound =
    role === "child" &&
    !value.gitSource &&
    value.meta?.sourceCommit === expectedSha &&
    buildReceipt?.deploymentId === value.id &&
    buildReceipt.sourceCommit === expectedSha &&
    value.meta.sourceArchiveSha256 === buildReceipt.sourceArchiveSha256;
  requireQa(gitBound || manualBound, "SOURCE_NOT_BOUND");
  requireQa(
    !value.meta?.githubCommitSha || value.meta.githubCommitSha === expectedSha,
    "CONFLICTING_SOURCE",
  );
  requireQa(!value.ownerId || value.ownerId === CONFIG.teamId, "WRONG_TEAM");
  requireQa(
    typeof value.url === "string" &&
      /^[a-z0-9][a-z0-9-]*\.vercel\.app$/.test(value.url) &&
      value.url !== CONFIG.childAlias,
    "BAD_DEPLOYMENT_ORIGIN",
  );
  return {
    id: value.id,
    projectId: value.projectId,
    sha: expectedSha,
    origin: `https://${value.url}`,
    sourceKind: manualBound ? "reviewed-manual-build" : "github",
    ...(manualBound ? { buildReceipt } : {}),
  };
}

export function validateAlias(alias, manifest) {
  requireQa(
    alias?.alias === CONFIG.childAlias &&
      alias.projectId === CONFIG.projects.child.id &&
      alias.deploymentId === manifest.child.id &&
      (!alias.deployment || alias.deployment.id === manifest.child.id),
    "ALIAS_NOT_BOUND",
  );
  return alias.deploymentId;
}

export function assertAllowedUrl(
  url,
  manifest,
  method = "GET",
  purpose = "tool",
) {
  requireQa(["GET", "HEAD"].includes(method), "METHOD_NOT_ALLOWED");
  requireQa(
    typeof url === "string" && !/[\\%\s]/.test(url) && !url.includes(".."),
    "BAD_URL",
  );
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new QaError("BAD_URL");
  }
  requireQa(
    parsed.protocol === "https:" &&
      !parsed.username &&
      !parsed.password &&
      !parsed.port &&
      !parsed.search &&
      !parsed.hash,
    "BAD_URL",
  );
  const surface = ["host", "child"].find(
    (r) => parsed.origin === manifest[r].origin,
  );
  requireQa(surface, "ORIGIN_NOT_ALLOWED");
  const hostOnly = ["bootstrap", "cookie-only"].includes(purpose);
  const toolBase = CONFIG.toolPath.slice(0, -1);
  requireQa(
    hostOnly
      ? surface === "host" && parsed.pathname === "/us"
      : purpose === "tool" &&
          (parsed.pathname === toolBase ||
            parsed.pathname.startsWith(CONFIG.toolPath) ||
            parsed.pathname.startsWith(CONFIG.assetPath)),
    "PATH_NOT_ALLOWED",
  );
  return { parsed, surface };
}

async function readBounded(response, limit = 12 * 1024 * 1024) {
  if (!response.body) return Buffer.alloc(0);
  const chunks = [];
  let length = 0;
  for await (const chunk of response.body) {
    length += chunk.length;
    if (length > limit) {
      throw new QaError("BODY_LIMIT");
    }
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export function assertApplicationPage(response, kind = "tool") {
  const text = response.body.toString("utf8");
  const plain = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
  requireQa(
    response.status === 200 &&
      response.contentType.includes("text/html") &&
      !/Authentication Required|Vercel Authentication|Log in to Vercel|Security Checkpoint/i.test(
        plain,
      ) &&
      plain.includes(
        kind === "host" ? "PolicyEngine" : "Rent and property taxes",
      ),
    "APPLICATION_NOT_REACHED",
  );
}

export async function assertApplicationShell(page) {
  const { hasBrand, navHits } = await inspectTopShell(page);
  requireQa(
    hasBrand && REQUIRED_NAV_LABELS.every((label) => navHits.includes(label)),
    "SHELL_MISSING",
  );
}

function evidence(response) {
  const url = new URL(response.url);
  // Only emit recognized titles, never arbitrary page/auth-wall contents.
  const title = response.body
    .toString("utf8")
    .match(/<title>([^<]*)<\/title>/i)?.[1];
  return {
    origin: url.origin,
    path: url.pathname,
    status: response.status,
    contentType: response.contentType,
    sha256: digest(response.body),
    title:
      ["Rent and property taxes", "Sources and methods", "PolicyEngine"].find(
        (label) => title?.startsWith(label),
      ) ?? "unrecognized",
  };
}

export function makeTransport(manifest, keys, fetcher = fetch) {
  requireQa(
    typeof keys?.hostKey === "string" &&
      keys.hostKey.length > 0 &&
      typeof keys?.childKey === "string" &&
      keys.childKey.length > 0,
    "MISSING_KEYS",
  );
  let hostCookie = "";
  let requests = 0;
  let bytes = 0;
  const records = [];
  async function request(url, purpose, redirects, context) {
    const { parsed, surface } = assertAllowedUrl(url, manifest, "GET", purpose);
    context.attempt =
      ["tool", "bootstrap", "cookie-only"].includes(purpose) &&
      Number.isInteger(redirects) &&
      redirects >= 0 &&
      redirects <= 4 &&
      requests < 401
        ? Object.freeze({
            surface,
            ...(!containsEncodedKey(Buffer.from(parsed.pathname), keys, [
              hostCookie,
              hostCookie.split("=")[1],
            ])
              ? { path: parsed.pathname }
              : {}),
            purpose,
            depth: redirects,
            requestCount: requests + 1,
          })
        : undefined;
    requireQa(++requests <= 400 && redirects <= 3, "REDIRECT_LIMIT");
    // Request-scoped automation setting: https://vercel.com/docs/vercel-toolbar/managing-toolbar
    const headers = new Headers({
      accept: "*/*",
      "x-vercel-skip-toolbar": "1",
    });
    if (surface === "host" && hostCookie) headers.set("cookie", hostCookie);
    if (purpose === "bootstrap") {
      headers.set("x-vercel-protection-bypass", keys.hostKey);
      headers.set("x-vercel-set-bypass-cookie", "true");
    } else if (purpose !== "cookie-only") {
      headers.set("x-vercel-protection-bypass", keys.childKey);
    }
    let raw;
    try {
      raw = await fetcher(parsed.href, {
        method: "GET",
        headers,
        redirect: "manual",
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      throw new QaError("REQUEST_FAILED");
    }
    const body = await readBounded(raw);
    bytes += body.length;
    requireQa(bytes <= 128 * 1024 * 1024, "TOTAL_BODY_LIMIT");
    requireQa(
      ![keys.hostKey, keys.childKey, hostCookie.split("=")[1]]
        .filter(Boolean)
        .some(
          (secret) =>
            body.includes(Buffer.from(secret)) ||
            [...raw.headers].some(
              ([name, value]) =>
                name !== "set-cookie" && value.includes(secret),
            ),
        ),
      "SECRET_REFLECTED",
    );
    const result = {
      url: parsed.href,
      status: raw.status,
      body,
      contentType: raw.headers.get("content-type") ?? "",
      headers: raw.headers,
    };
    records.push(evidence(result));
    if ([301, 302, 303, 307, 308].includes(raw.status)) {
      if (context.attempt) {
        if (context.chain.length === 4) context.chain.shift();
        context.chain.push(
          Object.freeze({ ...context.attempt, status: raw.status }),
        );
      }
      requireQa(raw.headers.has("location"), "BAD_REDIRECT");
      let next;
      try {
        next = new URL(raw.headers.get("location"), parsed).href;
      } catch {
        throw new QaError("BAD_REDIRECT");
      }
      assertAllowedUrl(
        next,
        manifest,
        "GET",
        purpose === "bootstrap" ? "cookie-only" : purpose,
      );
      requireQa(new URL(next).origin === parsed.origin, "REDIRECT_ORIGIN");
      if (purpose !== "bootstrap")
        return request(next, purpose, redirects + 1, context);
    }
    return result;
  }
  async function get(url, purpose = "tool", redirects = 0) {
    const context = { chain: [], attempt: undefined };
    try {
      return await request(url, purpose, redirects, context);
    } catch (error) {
      if (
        error instanceof QaError &&
        context.attempt &&
        [
          "REDIRECT_LIMIT",
          "BAD_REDIRECT",
          "REDIRECT_ORIGIN",
          "BAD_URL",
          "ORIGIN_NOT_ALLOWED",
          "PATH_NOT_ALLOWED",
        ].includes(error.message) &&
        (context.chain.length > 0 || error.message === "REDIRECT_LIMIT")
      ) {
        redirectDetails.set(
          error,
          Object.freeze({
            chain: Object.freeze([...context.chain]),
            attempt: context.attempt,
          }),
        );
      }
      throw error;
    }
  }
  function acceptHostCookie(response) {
    const lines = response.headers.getSetCookie();
    const candidates = lines.filter((line) => line.startsWith("_vercel_jwt="));
    requireQa(candidates.length === 1, "BAD_COOKIE");
    const cookie = candidates[0];
    const domain = cookie.match(/;\s*domain=([^;]+)/i)?.[1];
    requireQa(
      /;\s*secure(?:;|$)/i.test(cookie) &&
        /;\s*httponly(?:;|$)/i.test(cookie) &&
        /;\s*path=\/(?:;|$)/i.test(cookie) &&
        (!domain || domain === new URL(manifest.host.origin).hostname) &&
        /^_vercel_jwt=[A-Za-z0-9._~-]+;/.test(cookie),
      "BAD_COOKIE",
    );
    hostCookie = cookie.split(";")[0];
  }
  return { get, acceptHostCookie, records };
}

export async function runPreflight(manifest, keys, fetcher = fetch) {
  const transport = makeTransport(manifest, keys, fetcher);
  const child = await transport.get(manifest.child.origin + CONFIG.toolPath);
  assertApplicationPage(child);
  if (manifest.child.sourceKind === "reviewed-manual-build") {
    for (const [path, hash] of Object.entries(
      manifest.child.buildReceipt.files,
    )) {
      const file = await transport.get(manifest.child.origin + path);
      const actualSha256 = digest(file.body);
      if (file.status !== 200 || actualSha256 !== hash) {
        const error = new QaError("DEPLOYED_BUILD_DIFFERS");
        // The transport already validated this path and rejected reflected secrets.
        // Retain the MIME essence only, never arbitrary header parameters or bodies.
        const mediaType = file.contentType.match(
          /^([A-Za-z0-9!#$&^_.+-]+\/[A-Za-z0-9!#$&^_.+-]+)(?:;|$)/,
        )?.[1];
        mismatchDetails.set(
          error,
          Object.freeze({
            path,
            status: file.status,
            contentType: mediaType ?? "unrecognized",
            expectedSha256: hash,
            actualSha256,
          }),
        );
        retainKnownRuntime(error, file, path, hash, manifest, keys);
        throw error;
      }
    }
  }
  const bootstrap = await transport.get(
    manifest.host.origin + "/us",
    "bootstrap",
  );
  requireQa(
    [302, 303, 307, 308].includes(bootstrap.status),
    "BOOTSTRAP_FAILED",
  );
  transport.acceptHostCookie(bootstrap);
  const host = await transport.get(manifest.host.origin + "/us", "cookie-only");
  assertApplicationPage(host, "host");
  const proxied = await transport.get(manifest.host.origin + CONFIG.toolPath);
  assertApplicationPage(proxied);
  requireQa(
    digest(child.body) === digest(proxied.body),
    "PROXIED_BODY_DIFFERS",
  );
  return {
    transport,
    evidence: [child, bootstrap, host, proxied].map(evidence),
  };
}

export function validateInventory(actual, source) {
  let received, expected;
  try {
    received = JSON.parse(actual);
    expected = JSON.parse(source);
  } catch {
    throw new QaError("BAD_INVENTORY");
  }
  requireQa(
    Array.isArray(received) &&
      received.length === 51 &&
      received.reduce((sum, state) => sum + state.programs.length, 0) === 119 &&
      JSON.stringify(received) === JSON.stringify(expected),
    "INVENTORY_DIFFERS",
  );
  return true;
}

export function validateStaticCsv(actual, sourceInventory) {
  // The pinned report shares one 22-column static/browser export. Byte equality
  // against its source CSV remains mandatory at the browser call site.
  const text = actual.toString("utf8").replace(/^\uFEFF/, "");
  const rows = [];
  let row = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"' && quoted && text[i + 1] === '"') {
      cell += '"';
      i++;
    } else if (c === '"') quoted = !quoted;
    else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  requireQa(!quoted, "BAD_CSV");
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  let states;
  try {
    states = JSON.parse(sourceInventory);
  } catch {
    throw new QaError("BAD_CSV_SOURCE");
  }
  requireQa(
    Array.isArray(states) &&
      states.length === 51 &&
      states.every(
        (state) =>
          typeof state.code === "string" &&
          state.code.length > 0 &&
          state.taxYear === 2025 &&
          Array.isArray(state.programs) &&
          Array.isArray(state.sources) &&
          Array.isArray(state.researchNotes),
      ) &&
      new Set(states.map((state) => state.code)).size === 51,
    "BAD_CSV_SOURCE",
  );
  const programs = states.flatMap((state) => state.programs);
  requireQa(
    programs.length === 119 &&
      programs.every(
        (program) =>
          typeof program.id === "string" &&
          program.id.length > 0 &&
          Array.isArray(program.eligibilityNotes) &&
          Array.isArray(program.interactions),
      ) &&
      new Set(programs.map((program) => program.id)).size === 119,
    "BAD_CSV_SOURCE",
  );
  const expected = [
    [
      "state",
      "code",
      "tax_year",
      "program_id",
      "program",
      "category",
      "scope",
      "tenures",
      "refundable",
      "payment_mechanism",
      "age_rule",
      "income_definition",
      "income_limits",
      "maximum_benefit",
      "formula",
      "application",
      "eligibility_notes",
      "interactions",
      "program_year",
      "source_urls",
      "research_status",
      "state_research_notes",
    ],
  ];
  const refundabilityCell = (program) => {
    const mechanism = program.paymentMechanism ?? "not-established";
    const value =
      mechanism === "income-tax-credit" || mechanism === "not-established"
        ? program.refundable
        : null;
    return value === null ? "" : String(value);
  };
  for (const state of states) {
    for (const p of state.programs.length ? state.programs : [null]) {
      expected.push(
        p
          ? [
              state.name,
              state.code,
              state.taxYear,
              p.id,
              p.name,
              p.category,
              p.scope,
              p.tenures.join(" | "),
              refundabilityCell(p),
              p.paymentMechanism ?? "not-established",
              p.ageRule,
              p.incomeDefinition,
              p.incomeLimits,
              p.maximumBenefit,
              p.formulaSummary,
              p.application,
              p.eligibilityNotes.join(" | "),
              p.interactions.join(" | "),
              p.programYear,
              [
                ...new Set(
                  [...p.sources, ...state.sources].map((source) => source.url),
                ),
              ].join(" | "),
              state.inventoryStatus,
              state.researchNotes.join(" | "),
            ]
          : [
              state.name,
              state.code,
              state.taxYear,
              "",
              "No program recorded",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              [...new Set(state.sources.map((source) => source.url))].join(
                " | ",
              ),
              state.inventoryStatus,
              state.researchNotes.join(" | "),
            ],
      );
    }
  }
  const safeCell = (value) => {
    const text = String(value ?? "");
    return /^(?:\s*[=+@-]|[\t\r\n])/.test(text) ? `'${text}` : text;
  };
  requireQa(
    JSON.stringify(rows) ===
      JSON.stringify(expected.map((row) => row.map(safeCell))),
    "STATIC_CSV_DIFFERS",
  );
  return true;
}

async function apiJson(path, token) {
  requireQa(token, "MISSING_METADATA_TOKEN");
  const url = new URL(path, "https://api.vercel.com");
  requireQa(url.origin === "https://api.vercel.com", "BAD_METADATA_ORIGIN");
  url.searchParams.set("teamId", CONFIG.teamId);
  let response;
  try {
    response = await fetch(url, {
      headers: { authorization: `Bearer ${token}` },
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new QaError("METADATA_REQUEST_FAILED");
  }
  requireQa(response.ok, "METADATA_HTTP_FAILED");
  try {
    return JSON.parse(await readBounded(response, 2 * 1024 * 1024));
  } catch {
    throw new QaError("METADATA_BODY_FAILED");
  }
}

async function metadata(env) {
  const token = env.VERCEL_QA_METADATA_TOKEN;
  const result = { version: 1, createdAt: new Date().toISOString() };
  for (const role of ["host", "child"]) {
    const id = env[`QA_${role.toUpperCase()}_DEPLOYMENT_ID`];
    requireQa(deploymentPattern.test(id ?? ""), "BAD_DEPLOYMENT_ID");
    const raw = await apiJson(`/v13/deployments/${id}`, token);
    requireQa(raw.id === id, "DEPLOYMENT_ID_DIFFERS");
    let receipt;
    if (role === "child" && !raw.gitSource) {
      const bytes = Buffer.from(env.QA_CHILD_BUILD_RECEIPT ?? "");
      requireQa(
        digest(bytes) === env.QA_CHILD_BUILD_RECEIPT_SHA256,
        "BUILD_RECEIPT_HASH_DIFFERS",
      );
      const archive = execFileSync(
        "git",
        ["archive", "--format=tar", CONFIG.childSha],
        { cwd: CHILD, maxBuffer: 32 * 1024 * 1024 },
      );
      try {
        receipt = validateBuildReceipt(JSON.parse(bytes), id, digest(archive));
      } catch (error) {
        if (error instanceof QaError) throw error;
        throw new QaError("BAD_BUILD_RECEIPT");
      }
    }
    result[role] = validateDeployment(
      raw,
      role,
      role === "host" ? env.GITHUB_SHA : CONFIG.childSha,
      receipt,
    );
  }
  validateAlias(
    await apiJson(`/v4/aliases/${CONFIG.childAlias}`, token),
    result,
  );
  return result;
}

async function recheck(manifest, env) {
  const fresh = await metadata(env);
  requireQa(
    ["host", "child"].every(
      (r) => JSON.stringify(fresh[r]) === JSON.stringify(manifest[r]),
    ),
    "DEPLOYMENT_MOVED",
  );
}

function expectedAsset(pathname, manifest) {
  if (manifest.child.sourceKind === "reviewed-manual-build") {
    const expected = manifest.child.buildReceipt.files[pathname];
    requireQa(/^[a-f0-9]{64}$/.test(expected ?? ""), "ASSET_NOT_IN_RECEIPT");
    return expected;
  }
  const relative = pathname.startsWith(CONFIG.assetPath)
    ? pathname.slice(CONFIG.assetPath.length)
    : pathname.slice(CONFIG.toolPath.length);
  const root = resolve(CHILD, "out");
  const file = resolve(root, relative);
  requireQa(file.startsWith(root + sep), "BAD_ASSET_PATH");
  return digest(readFileSync(file));
}

async function browserQa(manifest, transport) {
  // This import and launch are unreachable during metadata/preflight modes.
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const counts = {};
  try {
    for (const surface of ["child", "host"]) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 900 },
        serviceWorkers: "block",
      });
      const failures = [];
      const resources = [];
      try {
        await context.route("**/*", async (route) => {
          try {
            requireQa(route.request().method() === "GET", "METHOD_NOT_ALLOWED");
            const url = route.request().url();
            const { parsed } = assertAllowedUrl(url, manifest);
            requireQa(
              parsed.origin === manifest[surface].origin,
              "SURFACE_ESCAPE",
            );
            const response = await transport.get(url);
            requireQa(response.status === 200, "RESOURCE_HTTP_FAILED");
            const type = route.request().resourceType();
            if (["script", "stylesheet", "font", "image"].includes(type)) {
              requireQa(
                digest(response.body) ===
                  expectedAsset(parsed.pathname, manifest),
                "ASSET_DIFFERS",
              );
              resources.push({ type, ...evidence(response) });
            }
            await route.fulfill({
              status: response.status,
              // fetch decodes compression; never replay content-encoding/length or Set-Cookie.
              headers: Object.fromEntries(
                [...response.headers].filter(([name]) =>
                  [
                    "content-type",
                    "content-security-policy",
                    "content-security-policy-report-only",
                    "x-frame-options",
                    "x-content-type-options",
                    "referrer-policy",
                    "permissions-policy",
                    "cross-origin-resource-policy",
                    "cross-origin-opener-policy",
                    "cross-origin-embedder-policy",
                  ].includes(name),
                ),
              ),
              body: response.body,
            });
          } catch {
            failures.push("NETWORK_CHECK_FAILED");
            await route.abort();
          }
        });
        const page = await context.newPage();
        page.on("pageerror", () => failures.push("PAGE_ERROR"));
        page.on("console", (message) => {
          if (message.type() === "error") failures.push("CONSOLE_ERROR");
        });
        await page.goto(manifest[surface].origin + CONFIG.toolPath, {
          waitUntil: "networkidle",
          timeout: 45_000,
        });
        requireQa(
          (await page.locator(".state-tile").count()) === 51,
          "PROFILE_COUNT",
        );
        await assertApplicationShell(page);
        const escapedLinks = await page.locator('a[href^="/"]').evaluateAll(
          (links, prefix) =>
            links.some((link) => {
              const href = link.getAttribute("href");
              return href !== prefix.slice(0, -1) && !href.startsWith(prefix);
            }),
          CONFIG.toolPath,
        );
        requireQa(!escapedLinks, "LINK_SCOPE_ESCAPE");
        await page
          .getByLabel("State or program", { exact: true })
          .fill("Wisconsin");
        await page
          .getByRole("heading", { name: "Wisconsin", exact: true })
          .waitFor();
        await page.screenshot({
          path: resolve(OUTPUT, `${surface}-desktop.png`),
          fullPage: true,
        });
        await page.setViewportSize({ width: 390, height: 844 });
        requireQa(
          !(await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          )),
          "MOBILE_OVERFLOW",
        );
        await page.screenshot({
          path: resolve(OUTPUT, `${surface}-mobile.png`),
          fullPage: true,
        });
        await page
          .getByRole("link", { name: "Read the report", exact: true })
          .click();
        requireQa(
          (await page.locator(".report-profile").count()) === 51,
          "REPORT_COUNT",
        );
        await page
          .getByRole("link", { name: "Data and methods", exact: true })
          .click();
        await page
          .getByRole("heading", { name: "Sources and methods.", exact: true })
          .waitFor();
        await page.goto(manifest[surface].origin + CONFIG.toolPath, {
          waitUntil: "networkidle",
        });
        const downloadEvent = page.waitForEvent("download");
        await page
          .getByRole("button", {
            name: "Download full inventory (CSV)",
            exact: true,
          })
          .click();
        const download = await downloadEvent;
        const downloadPath = await download.path();
        requireQa(downloadPath, "BROWSER_DOWNLOAD_FAILED");
        const browserCsv = readFileSync(downloadPath);
        const { inventoryCsv } = await import(
          pathToFileURL(resolve(CHILD, "lib/inventory.ts")).href
        );
        const sourceInventory = readFileSync(
          resolve(CHILD, "public/data/inventory.json"),
        );
        requireQa(
          browserCsv.toString("utf8").replace(/^\uFEFF/, "") ===
            inventoryCsv(JSON.parse(sourceInventory)),
          "BROWSER_CSV_DIFFERS",
        );
        writeFileSync(
          resolve(OUTPUT, `${surface}-browser-inventory.csv`),
          browserCsv,
        );
        for (const name of ["inventory.json", "inventory.csv"]) {
          const response = await transport.get(
            manifest[surface].origin + CONFIG.toolPath + `data/${name}`,
          );
          requireQa(response.status === 200, "DOWNLOAD_HTTP_FAILED");
          const expected = readFileSync(resolve(CHILD, "public/data", name));
          if (name.endsWith("json")) validateInventory(response.body, expected);
          else {
            requireQa(response.body.equals(expected), "CSV_DIFFERS");
            validateStaticCsv(response.body, sourceInventory);
          }
          // Only save bytes after matching the pinned public source export.
          writeFileSync(resolve(OUTPUT, `${surface}-${name}`), response.body);
        }
        requireQa(
          resources.some((r) => r.type === "script") &&
            resources.some((r) => r.type === "stylesheet"),
          "NO_RENDER_ASSETS",
        );
        requireQa(failures.length === 0, "BROWSER_CHECK_FAILED");
        counts[surface] = { jurisdictions: 51, programs: 119, resources };
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  return counts;
}

function checkCi(env) {
  requireQa(process.platform === "linux" && env.CI === "true", "LINUX_CI_ONLY");
  requireQa(
    env.GITHUB_REPOSITORY === "PolicyEngine/policyengine-app-v2" &&
      env.GITHUB_EVENT_NAME === "workflow_dispatch" &&
      env.GITHUB_REF === "refs/heads/codex/rent-property-tax-tool" &&
      shaPattern.test(env.GITHUB_SHA ?? ""),
    "UNTRUSTED_DISPATCH",
  );
  requireQa(
    execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim() ===
      env.GITHUB_SHA,
    "CHECKOUT_DIFFERS",
  );
  requireQa(
    execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: CHILD,
      encoding: "utf8",
    }).trim() === CONFIG.childSha,
    "CHILD_CHECKOUT_DIFFERS",
  );
  for (const cwd of [process.cwd(), CHILD]) {
    requireQa(
      execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], {
        cwd,
        encoding: "utf8",
      }).trim() === "",
      "TRACKED_SOURCE_DIRTY",
    );
  }
}

export async function main(phase, env = process.env) {
  checkCi(env);
  requireQa(
    ["metadata", "preflight", "browser", "recheck"].includes(phase),
    "BAD_PHASE",
  );
  mkdirSync(OUTPUT, { recursive: true });
  const manifestFile = resolve(OUTPUT, "manifest.json");
  if (phase === "metadata") {
    writeFileSync(manifestFile, JSON.stringify(await metadata(env), null, 2));
    return;
  }
  const manifestBytes = readFileSync(manifestFile);
  const manifest = JSON.parse(manifestBytes);
  requireQa(
    manifest.host.sha === env.GITHUB_SHA &&
      manifest.child.sha === CONFIG.childSha,
    "MANIFEST_SOURCE_DIFFERS",
  );
  requireQa(
    Date.now() - Date.parse(manifest.createdAt) < 30 * 60_000,
    "MANIFEST_EXPIRED",
  );
  if (phase === "recheck") {
    await recheck(manifest, env);
    writeFileSync(
      resolve(OUTPUT, "recheck.json"),
      JSON.stringify({ status: "PASS", manifestSha256: digest(manifestBytes) }),
    );
    return;
  }
  if (phase === "browser") {
    const prior = JSON.parse(readFileSync(resolve(OUTPUT, "preflight.json")));
    requireQa(
      prior.status === "PASS" && prior.manifestSha256 === digest(manifestBytes),
      "PREFLIGHT_REQUIRED",
    );
  }
  const { transport, evidence: preflight } = await runPreflight(manifest, {
    hostKey: env.PROPERTY_TAX_QA_HOST_BYPASS,
    childKey: env.PROPERTY_TAX_QA_CHILD_BYPASS,
  });
  const result = {
    status: "PASS",
    phase,
    manifestSha256: digest(manifestBytes),
    preflight,
  };
  if (phase === "browser")
    result.browser = await browserQa(manifest, transport);
  writeFileSync(
    resolve(OUTPUT, `${phase}.json`),
    JSON.stringify(result, null, 2),
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const phase = process.argv[2];
  main(phase)
    .then(() => console.log("Protected QA phase completed"))
    .catch((error) => {
      // Never log fetch/browser exceptions: they may contain auth headers or raw bodies.
      const failure = writeFailureEvidence(error);
      console.error(`Protected QA blocked: ${failure.code}`);
      process.exitCode = 1;
    });
}
