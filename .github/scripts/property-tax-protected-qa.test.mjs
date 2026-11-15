// @vitest-environment node
import { describe, expect, test, vi } from "vitest";
import fc from "fast-check";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import { REQUIRED_NAV_LABELS } from "./audit-app-zone-shell.mjs";
import {
  CONFIG,
  assertAllowedUrl,
  assertApplicationPage,
  assertApplicationShell,
  failureEvidence,
  makeTransport,
  runPreflight,
  validateAlias,
  validateBuildReceipt,
  validateDeployment,
  validateInventory,
  validateStaticCsv,
  writeFailureEvidence,
} from "./property-tax-protected-qa.mjs";

vi.mock("playwright", () => {
  throw new Error("Preflight must not import or launch a browser");
});

const HOST_SHA = "a".repeat(40);
const deployment = (role) => ({
  id: `dpl_${role}12345678901234567890`,
  projectId: CONFIG.projects[role].id,
  readyState: "READY",
  target: role === "host" ? null : "production",
  url: `${role}-123456-policy-engine.vercel.app`,
  gitSource: {
    type: "github",
    sha: role === "host" ? HOST_SHA : CONFIG.childSha,
  },
});
const manifest = () => ({
  version: 1,
  host: validateDeployment(deployment("host"), "host", HOST_SHA),
  child: validateDeployment(deployment("child"), "child", CONFIG.childSha),
});
const html = (text = "Rent and property taxes across states. PolicyEngine") =>
  new Response(`<html><title>Rent and property taxes</title>${text}</html>`, {
    headers: { "content-type": "text/html" },
  });
const keys = { hostKey: "FAKE_HOST_KEY", childKey: "FAKE_CHILD_KEY" };

const RUNTIME_PATH =
  "/_zones/property-tax-relief/_next/static/chunks/turbopack-2ldtdtmjp3oyl.js";
const EXPECTED_RUNTIME_SHA =
  "c2938fab495210b87d9f735375cb0ed03787e4072a770f349ba7bae0a28217bf";
const RUNTIME_ARTIFACT = "mismatched-turbopack-runtime.js";
const runtime = (extra = "") =>
  `(()=>{var r=globalThis.TURBOPACK;var s=self.TURBOPACK_ASSET_SUFFIX;function registerChunk(){};${"/* public generated runtime */".repeat(20)}${extra}})();`;

async function runtimeMismatch({
  path = RUNTIME_PATH,
  hash = EXPECTED_RUNTIME_SHA,
  status = 200,
  contentType = "application/javascript; charset=utf-8",
  body = runtime(),
  redirect = false,
  credentials = keys,
} = {}) {
  const m = manifest();
  m.child.sourceKind = "reviewed-manual-build";
  m.child.buildReceipt = { files: { [path]: hash } };
  const fetcher = vi.fn(async () => {
    if (fetcher.mock.calls.length === 1) return html();
    if (redirect && fetcher.mock.calls.length === 2)
      return new Response(null, {
        status: 307,
        headers: { location: CONFIG.assetPath + "_next/static/other.js" },
      });
    return new Response(body, {
      status,
      headers: {
        "content-type": contentType,
        "set-cookie": "PRIVATE_COOKIE=value",
        "x-private-debug": "PRIVATE_HEADER",
      },
    });
  });
  try {
    await runPreflight(m, credentials, fetcher);
  } catch (error) {
    return { error, fetcher };
  }
  throw new Error("Expected blocking runtime mismatch");
}

function withFailureArtifact(error, check) {
  const directory = mkdtempSync(join(tmpdir(), "protected-qa-fake-"));
  try {
    const evidence = writeFailureEvidence(error, directory);
    check({ evidence, directory, files: readdirSync(directory) });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

describe("fixed public runtime diagnostic", () => {
  test("given the exact mismatched public runtime then retain bytes while QA stays blocked before host auth", async () => {
    const body = runtime();
    const { error, fetcher } = await runtimeMismatch({ body });
    withFailureArtifact(error, ({ evidence, directory, files }) => {
      expect(files.sort()).toEqual(["failure.json", RUNTIME_ARTIFACT].sort());
      expect(readFileSync(join(directory, RUNTIME_ARTIFACT))).toEqual(
        Buffer.from(body),
      );
      expect(evidence).toMatchObject({
        status: "BLOCKED",
        code: "DEPLOYED_BUILD_DIFFERS",
        runtimeArtifact: {
          file: RUNTIME_ARTIFACT,
          bytes: Buffer.byteLength(body),
          sha256: createHash("sha256").update(body).digest("hex"),
        },
      });
      const receipt = readFileSync(join(directory, "failure.json"), "utf8");
      expect(JSON.parse(receipt)).toEqual(evidence);
      for (const value of [
        body,
        "PRIVATE_HEADER",
        "PRIVATE_COOKIE",
        ...Object.values(keys),
      ])
        expect(receipt).not.toContain(value);
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(
      fetcher.mock.calls.every(
        ([, options]) =>
          options.headers.get("x-vercel-protection-bypass") === keys.childKey &&
          !options.headers.has("x-vercel-set-bypass-cookie"),
      ),
    ).toBe(true);
  });

  test.each([
    ["another asset", { path: CONFIG.assetPath + "_next/static/other.js" }],
    ["another expected build", { hash: "0".repeat(64) }],
    ["redirected asset", { redirect: true }],
    ["non200", { status: 404 }],
    ["HTML MIME", { contentType: "text/html" }],
    ["generic MIME", { contentType: "application/octet-stream" }],
    [
      "missing runtime signature",
      { body: "(()=>{/* other JavaScript */})();" },
    ],
    [
      "too small",
      {
        body: "(()=>{globalThis.TURBOPACK;self.TURBOPACK_ASSET_SUFFIX;registerChunk})();",
      },
    ],
    ["too large", { body: runtime("x".repeat(32 * 1024)) }],
    [
      "HTML auth body with runtime markers",
      { body: runtime("<html><title>Authentication Required</title></html>") },
    ],
  ])("given %s then never retain response bytes", async (_name, options) => {
    const { error } = await runtimeMismatch(options);
    withFailureArtifact(error, ({ evidence, files }) => {
      expect(files).toEqual(["failure.json"]);
      expect(evidence.status).toBe("BLOCKED");
      expect(evidence).not.toHaveProperty("runtimeArtifact");
    });
  });

  const encodings = {
    raw: (value) => value,
    url: (value) => encodeURIComponent(value),
    percentBytes: (value) =>
      [...Buffer.from(value)]
        .map((byte) => `%${byte.toString(16).padStart(2, "0")}`)
        .join(""),
    base64: (value) => Buffer.from(value).toString("base64"),
    base64Unpadded: (value) =>
      Buffer.from(value).toString("base64").replace(/=+$/, ""),
    base64url: (value) => Buffer.from(value).toString("base64url"),
    hex: (value) => Buffer.from(value).toString("hex"),
    unicode: (value) =>
      [...value]
        .map((char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`)
        .join(""),
    jsHex: (value) =>
      [...Buffer.from(value)]
        .map((byte) => `\\x${byte.toString(16).padStart(2, "0")}`)
        .join(""),
    htmlDecimal: (value) =>
      [...value].map((char) => `&#${char.charCodeAt(0)};`).join(""),
    htmlHex: (value) =>
      [...value]
        .map((char) => `&#x${char.charCodeAt(0).toString(16)};`)
        .join(""),
  };
  test.each(Object.entries(encodings))(
    "given a %s encoded key reflection in otherwise valid runtime then retain no bytes",
    async (_encoding, encode) => {
      const credentials = {
        hostKey: "FAKE_HOST+/=KEY",
        childKey: "FAKE_CHILD+/=KEY",
      };
      for (const secret of Object.values(credentials)) {
        const { error } = await runtimeMismatch({
          credentials,
          body: runtime(`/*${encode(secret)}*/`),
        });
        withFailureArtifact(error, ({ evidence, files }) => {
          expect(files).toEqual(["failure.json"]);
          expect(evidence.status).toBe("BLOCKED");
          expect(evidence).not.toHaveProperty("runtimeArtifact");
          expect(JSON.stringify(evidence)).not.toContain(secret);
        });
      }
    },
  );

  test("given generated encoded credentials then no public runtime artifact is retained", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^[A-Za-z][A-Za-z0-9]{15,31}$/),
        fc.constantFrom(...Object.keys(encodings)),
        async (secret, encoding) => {
          const { error } = await runtimeMismatch({
            credentials: { hostKey: secret, childKey: "OTHER_FAKE_KEY" },
            body: runtime(`/*${encodings[encoding](secret)}*/`),
          });
          withFailureArtifact(error, ({ evidence, files }) => {
            expect(files).toEqual(["failure.json"]);
            expect(evidence).not.toHaveProperty("runtimeArtifact");
          });
        },
      ),
      { numRuns: 100, seed: 20261119 },
    );
  });

  test("given a forged capture on an arbitrary error then retain only the sanitized failure receipt", () => {
    const error = new Error(keys.childKey);
    error.runtimeArtifact = { body: runtime(keys.hostKey) };
    withFailureArtifact(error, ({ evidence, files }) => {
      expect(files).toEqual(["failure.json"]);
      expect(evidence).toEqual({ status: "BLOCKED", code: "QA_FAILED" });
    });
  });
});

describe("generated credential invariants", () => {
  const label = fc.stringMatching(/^[a-z][a-z0-9]{0,15}$/);
  const options = { numRuns: 100, seed: 20261115 };

  test("given any generated foreign origin then no credential request reaches fetch", async () => {
    await fc.assert(
      fc.asyncProperty(
        label,
        fc.integer({ min: 0, max: 4 }),
        async (name, variant) => {
          const m = manifest();
          const hostname = new URL(m.host.origin).hostname;
          const origins = [
            `https://${name}.invalid`,
            `https://${hostname}.${name}.invalid`,
            `https://${name}.${hostname}`,
            `http://${hostname}`,
            `https://${hostname}:9443`,
          ];
          const fetcher = vi.fn(async () => html());
          await expect(
            makeTransport(m, keys, fetcher).get(
              origins[variant] + CONFIG.toolPath,
            ),
          ).rejects.toThrow();
          expect(fetcher).not.toHaveBeenCalled();
        },
      ),
      options,
    );
  });

  test("given any generated path escape then no credential request reaches fetch", async () => {
    await fc.assert(
      fc.asyncProperty(
        label,
        fc.integer({ min: 0, max: 6 }),
        async (name, variant) => {
          const m = manifest();
          const paths = [
            CONFIG.toolPath.slice(0, -1) + `-${name}/`,
            CONFIG.assetPath.slice(0, -1) + `-${name}/chunk.js`,
            `/us/${name}/`,
            CONFIG.toolPath + `../${name}/`,
            CONFIG.toolPath + `%2e%2e/${name}/`,
            `/_zones/${name}/chunk.js`,
            CONFIG.toolPath + `?target=${name}`,
          ];
          const fetcher = vi.fn(async () => html());
          await expect(
            makeTransport(m, keys, fetcher).get(m.host.origin + paths[variant]),
          ).rejects.toThrow();
          expect(fetcher).not.toHaveBeenCalled();
        },
      ),
      { ...options, seed: options.seed + 1 },
    );
  });

  test("given any generated disallowed method then the guard prevents fake fetch", async () => {
    // Methods are data fed to the same decision function used before browser fetch.
    // No write-shaped command or actual HTTP mutation is executed.
    const methods = fc
      .stringMatching(/^[A-Za-z]{1,12}$/)
      .filter((method) => !["GET", "HEAD"].includes(method));
    await fc.assert(
      fc.asyncProperty(methods, async (method) => {
        const m = manifest();
        const fetcher = vi.fn();
        const guardedRequest = async () => {
          const { parsed } = assertAllowedUrl(
            m.host.origin + CONFIG.toolPath,
            m,
            method,
          );
          return fetcher(parsed.href, { method });
        };
        await expect(guardedRequest()).rejects.toThrow("METHOD_NOT_ALLOWED");
        expect(fetcher).not.toHaveBeenCalled();
      }),
      { ...options, seed: options.seed + 2 },
    );
  });

  test("given any generated allowed request then headers isolate host key, child key and cookie exactly", async () => {
    await fc.assert(
      fc.asyncProperty(
        label,
        fc.constantFrom("host", "child"),
        fc.boolean(),
        async (name, surface, cookieOnly) => {
          const m = manifest();
          const generatedKeys = {
            hostKey: `HOST_${name}`,
            childKey: `CHILD_${name}`,
          };
          const cookie = `_vercel_jwt=COOKIE_${name}`;
          const fetcher = vi.fn(async (_url, requestOptions) =>
            requestOptions.headers.has("x-vercel-set-bypass-cookie")
              ? new Response(null, {
                  status: 307,
                  headers: {
                    location: "/us",
                    "set-cookie": `${cookie}; Path=/; Secure; HttpOnly; SameSite=Lax`,
                  },
                })
              : html(),
          );
          const transport = makeTransport(m, generatedKeys, fetcher);
          transport.acceptHostCookie(
            await transport.get(m.host.origin + "/us", "bootstrap"),
          );
          expect(Object.fromEntries(fetcher.mock.calls[0][1].headers)).toEqual({
            accept: "*/*",
            "x-vercel-protection-bypass": generatedKeys.hostKey,
            "x-vercel-set-bypass-cookie": "true",
            "x-vercel-skip-toolbar": "1",
          });
          const purpose =
            surface === "host" && cookieOnly ? "cookie-only" : "tool";
          const path =
            purpose === "cookie-only"
              ? "/us"
              : CONFIG.assetPath + `_next/static/${name}.js`;
          await transport.get(m[surface].origin + path, purpose);
          expect(Object.fromEntries(fetcher.mock.calls[1][1].headers)).toEqual({
            accept: "*/*",
            "x-vercel-skip-toolbar": "1",
            ...(surface === "host" ? { cookie } : {}),
            ...(purpose === "tool"
              ? { "x-vercel-protection-bypass": generatedKeys.childKey }
              : {}),
          });
          expect(fetcher.mock.calls).toHaveLength(2);
          expect(
            fetcher.mock.calls.every(
              ([, requestOptions]) => requestOptions.redirect === "manual",
            ),
          ).toBe(true);
        },
      ),
      { ...options, seed: options.seed + 3 },
    );
  });
});

describe("protected QA provenance", () => {
  test("given a manual build receipt then require source archive and complete byte manifest", () => {
    const m = manifest();
    const files = Object.fromEntries(
      [
        CONFIG.toolPath,
        CONFIG.toolPath + "report/",
        CONFIG.toolPath + "methods/",
        CONFIG.toolPath + "data/inventory.json",
        CONFIG.toolPath + "data/inventory.csv",
        CONFIG.assetPath + "_next/static/chunk.js",
      ].map((p) => [p, "c".repeat(64)]),
    );
    const receipt = {
      version: 1,
      deploymentId: m.child.id,
      sourceCommit: CONFIG.childSha,
      sourceArchiveSha256: "d".repeat(64),
      files,
    };
    expect(validateBuildReceipt(receipt, m.child.id, "d".repeat(64))).toBe(
      receipt,
    );
    expect(() =>
      validateBuildReceipt(receipt, m.child.id, "e".repeat(64)),
    ).toThrow();
    expect(() =>
      validateBuildReceipt(
        { ...receipt, files: { ...files, "/admin": "c".repeat(64) } },
        m.child.id,
        "d".repeat(64),
      ),
    ).toThrow();
    const manual = {
      ...deployment("child"),
      gitSource: null,
      meta: {
        sourceCommit: CONFIG.childSha,
        sourceArchiveSha256: "d".repeat(64),
      },
    };
    expect(() => validateDeployment(manual, "child", CONFIG.childSha)).toThrow(
      "SOURCE_NOT_BOUND",
    );
    expect(
      validateDeployment(manual, "child", CONFIG.childSha, receipt).sourceKind,
    ).toBe("reviewed-manual-build");
    expect(() =>
      validateDeployment(
        {
          ...manual,
          meta: {
            sourceCommit: CONFIG.childSha,
            sourceArchiveSha256: "e".repeat(64),
          },
        },
        "child",
        CONFIG.childSha,
        receipt,
      ),
    ).toThrow("SOURCE_NOT_BOUND");
  });
  test("given a wrong project, source, readiness or production host then reject", () => {
    for (const change of [
      { projectId: CONFIG.projects.child.id },
      { readyState: "BUILDING" },
      { target: "production" },
      { gitSource: { type: "github", sha: "b".repeat(40) } },
      { gitSource: undefined, meta: { githubCommitSha: HOST_SHA } },
      { url: "property-tax-relief.vercel.app" },
      { url: "host.vercel.app.attacker.example" },
    ]) {
      expect(() =>
        validateDeployment(
          { ...deployment("host"), ...change },
          "host",
          HOST_SHA,
        ),
      ).toThrow();
    }
  });

  test("given conflicting supplied source metadata then reject", () => {
    expect(() =>
      validateDeployment(
        { ...deployment("host"), meta: { githubCommitSha: "b".repeat(40) } },
        "host",
        HOST_SHA,
      ),
    ).toThrow();
  });

  test("given child alias movement or conflicting IDs then reject", () => {
    const m = manifest();
    const good = {
      alias: CONFIG.childAlias,
      projectId: CONFIG.projects.child.id,
      deploymentId: m.child.id,
      deployment: { id: m.child.id },
    };
    expect(validateAlias(good, m)).toBe(m.child.id);
    expect(() =>
      validateAlias({ ...good, deploymentId: "other" }, m),
    ).toThrow();
    expect(() =>
      validateAlias({ ...good, projectId: CONFIG.projects.host.id }, m),
    ).toThrow();
  });
});

describe("credential request boundaries", () => {
  test.each([
    "https://attacker.example/us/rent-and-property-taxes/",
    "https://api.vercel.com/v13/deployments/dpl_nonexistent1234567890",
    "https://host-123456-policy-engine.vercel.app.attacker.example/us/rent-and-property-taxes/",
    "http://host-123456-policy-engine.vercel.app/us/rent-and-property-taxes/",
    "https://user@host-123456-policy-engine.vercel.app/us/rent-and-property-taxes/",
    "https://host-123456-policy-engine.vercel.app/us/rent-and-property-taxes-evil/",
    "https://host-123456-policy-engine.vercel.app/us/rent-and-property-taxes/%2e%2e/admin",
    "https://host-123456-policy-engine.vercel.app/us/rent-and-property-taxes/../admin",
    "https://host-123456-policy-engine.vercel.app/us/rent-and-property-taxes/?target=https://attacker.example",
    "https://host-123456-policy-engine.vercel.app/_zones/property-tax-relief-evil/a.js",
  ])("given disallowed URL %s then reject before a request", async (url) => {
    const fetcher = vi.fn();
    await expect(
      makeTransport(manifest(), keys, fetcher).get(url),
    ).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });

  test("given non-read methods or bootstrap on child then reject", () => {
    const m = manifest();
    expect(() =>
      assertAllowedUrl(m.host.origin + CONFIG.toolPath, m, "POST"),
    ).toThrow();
    expect(() =>
      assertAllowedUrl(m.child.origin + "/us", m, "GET", "bootstrap"),
    ).toThrow();
  });

  test("given tool requests then isolate the child key and include the nonsecret automation header", async () => {
    const fetcher = vi.fn(async () => html());
    const m = manifest();
    await makeTransport(m, keys, fetcher).get(m.host.origin + CONFIG.toolPath);
    const options = fetcher.mock.calls[0][1];
    expect(options.redirect).toBe("manual");
    expect(options.headers.get("x-vercel-protection-bypass")).toBe(
      keys.childKey,
    );
    expect(options.headers.has("authorization")).toBe(false);
    expect(options.headers.has("cookie")).toBe(false);
    expect(options.headers.get("x-vercel-skip-toolbar")).toBe("1");
  });

  test("given an off-origin redirect then do not forward any credentials", async () => {
    const fetcher = vi.fn(
      async () =>
        new Response(null, {
          status: 302,
          headers: { location: "https://attacker.example/" },
        }),
    );
    await expect(
      makeTransport(manifest(), keys, fetcher).get(
        manifest().host.origin + CONFIG.toolPath,
      ),
    ).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  test("given a redirect loop then bound requests", async () => {
    const m = manifest();
    const fetcher = vi.fn(
      async () =>
        new Response(null, {
          status: 307,
          headers: { location: CONFIG.toolPath },
        }),
    );
    await expect(
      makeTransport(m, keys, fetcher).get(m.host.origin + CONFIG.toolPath),
    ).rejects.toThrow("REDIRECT_LIMIT");
    expect(fetcher.mock.calls.length).toBeLessThanOrEqual(4);
  });

  test("given missing keys or reflected keys then fail without exposing values", async () => {
    expect(() => makeTransport(manifest(), { hostKey: "" })).toThrow(
      "MISSING_KEYS",
    );
    const fetcher = vi.fn(async () => html(keys.childKey));
    await expect(
      makeTransport(manifest(), keys, fetcher).get(
        manifest().child.origin + CONFIG.toolPath,
      ),
    ).rejects.toThrow("SECRET_REFLECTED");
  });

  test("given a secret reflected in response headers then reject before browser replay", async () => {
    const fetcher = vi.fn(
      async () =>
        new Response("report", {
          headers: {
            "content-security-policy": `report-uri https://example.gov/${keys.childKey}`,
          },
        }),
    );
    await expect(
      makeTransport(manifest(), keys, fetcher).get(
        manifest().child.origin + CONFIG.toolPath,
      ),
    ).rejects.toThrow("SECRET_REFLECTED");
  });

  test("given an oversized response then stop instead of retaining it", async () => {
    const fetcher = vi.fn(
      async () => new Response(Buffer.alloc(12 * 1024 * 1024 + 1)),
    );
    await expect(
      makeTransport(manifest(), keys, fetcher).get(
        manifest().child.origin + CONFIG.toolPath,
      ),
    ).rejects.toThrow("BODY_LIMIT");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe("bounded preflight", () => {
  test.each([true, false])(
    "given a fake toolbar server honoring skip header=%s then preserve exact build-byte validation",
    async (honorsSkipHeader) => {
      const m = manifest();
      const buildRuntime = runtime();
      m.child.sourceKind = "reviewed-manual-build";
      m.child.buildReceipt = {
        files: {
          [RUNTIME_PATH]: createHash("sha256")
            .update(buildRuntime)
            .digest("hex"),
        },
      };
      const fetcher = vi.fn(async (url, options) => {
        if (url === m.child.origin + RUNTIME_PATH) {
          const suppressed =
            honorsSkipHeader &&
            options.headers.get("x-vercel-skip-toolbar") === "1";
          return new Response(
            buildRuntime + (suppressed ? "" : ";/* MOCK_TOOLBAR_APPEND */"),
            { headers: { "content-type": "application/javascript" } },
          );
        }
        if (options.headers.has("x-vercel-set-bypass-cookie"))
          return new Response(null, {
            status: 307,
            headers: {
              location: "/us",
              "set-cookie": "_vercel_jwt=FAKE_COOKIE; Path=/; Secure; HttpOnly",
            },
          });
        return html();
      });
      if (honorsSkipHeader) {
        const result = await runPreflight(m, keys, fetcher);
        expect(result.evidence).toHaveLength(4);
        expect(fetcher).toHaveBeenCalledTimes(5);
      } else {
        await expect(runPreflight(m, keys, fetcher)).rejects.toThrow(
          "DEPLOYED_BUILD_DIFFERS",
        );
        expect(fetcher).toHaveBeenCalledTimes(2);
      }
      expect(
        fetcher.mock.calls.every(
          ([, options]) => options.headers.get("x-vercel-skip-toolbar") === "1",
        ),
      ).toBe(true);
    },
  );

  test("given success then bootstrap only host and never serialize the cookie", async () => {
    const m = manifest();
    const fetcher = vi.fn(async (url, options) => {
      if (options.headers.has("x-vercel-set-bypass-cookie")) {
        expect(url).toBe(m.host.origin + "/us");
        expect(options.headers.get("x-vercel-protection-bypass")).toBe(
          keys.hostKey,
        );
        return new Response(null, {
          status: 307,
          headers: {
            location: "/us",
            "set-cookie":
              "_vercel_jwt=FAKE_COOKIE; Path=/; Secure; HttpOnly; SameSite=Lax",
          },
        });
      }
      if (url === m.host.origin + "/us") {
        expect(options.headers.has("x-vercel-protection-bypass")).toBe(false);
        expect(options.headers.get("cookie")).toBe("_vercel_jwt=FAKE_COOKIE");
        return html("PolicyEngine research");
      }
      return html();
    });
    const result = await runPreflight(m, keys, fetcher);
    expect(result.evidence).toHaveLength(4);
    expect(JSON.stringify(result.evidence)).not.toContain("FAKE_COOKIE");
    expect(JSON.stringify(result.evidence)).not.toContain(keys.childKey);
    await result.transport.get(m.child.origin + CONFIG.assetPath + "chunk.js");
    expect(fetcher.mock.calls.at(-1)[1].headers.has("cookie")).toBe(false);
  });

  test.each([200, 404])(
    "given a manual deployed-byte mismatch with status%s then emit only sanitized evidence before host auth",
    async (status) => {
      const m = manifest();
      m.child.sourceKind = "reviewed-manual-build";
      m.child.buildReceipt = {
        files: { [CONFIG.toolPath + "data/inventory.csv"]: "0".repeat(64) },
      };
      const body = "PRIVATE_RAW_RESPONSE_MUST_NOT_BE_RECORDED";
      const fetcher = vi.fn(async () =>
        fetcher.mock.calls.length === 1
          ? html()
          : new Response(body, {
              status,
              headers: {
                "content-type":
                  "application/octet-stream; debug=PRIVATE_HEADER",
                "set-cookie": "PRIVATE_COOKIE=value",
              },
            }),
      );
      let failure;
      try {
        await runPreflight(m, keys, fetcher);
      } catch (error) {
        failure = failureEvidence(error);
      }
      expect(failure).toEqual({
        status: "BLOCKED",
        code: "DEPLOYED_BUILD_DIFFERS",
        mismatch: {
          path: CONFIG.toolPath + "data/inventory.csv",
          status,
          contentType: "application/octet-stream",
          expectedSha256: "0".repeat(64),
          actualSha256: createHash("sha256").update(body).digest("hex"),
        },
      });
      const serialized = JSON.stringify(failure);
      for (const value of [
        body,
        "PRIVATE_HEADER",
        "PRIVATE_COOKIE",
        keys.hostKey,
        keys.childKey,
        m.child.origin,
      ])
        expect(serialized).not.toContain(value);
      expect(fetcher.mock.calls).toHaveLength(2);
      expect(
        fetcher.mock.calls.every(
          ([, options]) =>
            options.headers.get("x-vercel-protection-bypass") === keys.childKey,
        ),
      ).toBe(true);
    },
  );

  test("given a reflected key then do not attach deployed-byte mismatch evidence", async () => {
    const m = manifest();
    m.child.sourceKind = "reviewed-manual-build";
    m.child.buildReceipt = {
      files: { [CONFIG.toolPath + "data/inventory.csv"]: "0".repeat(64) },
    };
    const fetcher = vi.fn(async () =>
      fetcher.mock.calls.length === 1 ? html() : new Response(keys.childKey),
    );
    let failure;
    try {
      await runPreflight(m, keys, fetcher);
    } catch (error) {
      failure = failureEvidence(error);
    }
    expect(failure).toEqual({ status: "BLOCKED", code: "SECRET_REFLECTED" });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  test("given arbitrary error strings or forged evidence then keep only a constant failure code", () => {
    const error = new Error(`https://example.invalid/?key=${keys.hostKey}`);
    error.mismatch = { path: keys.childKey, body: "PRIVATE_BODY" };
    expect(failureEvidence(error)).toEqual({
      status: "BLOCKED",
      code: "QA_FAILED",
    });
  });

  test("given broad-domain cookie or failed auth then stop before later stages", async () => {
    for (const cookie of [
      "_vercel_jwt=FAKE; Domain=.vercel.app; Path=/; Secure; HttpOnly",
      "_vercel_jwt=FAKE; Path=/; HttpOnly",
    ]) {
      const fetcher = vi.fn(async (url, options) =>
        options.headers.has("x-vercel-set-bypass-cookie")
          ? new Response(null, {
              status: 307,
              headers: { location: "/us", "set-cookie": cookie },
            })
          : html(),
      );
      await expect(runPreflight(manifest(), keys, fetcher)).rejects.toThrow();
      expect(fetcher).toHaveBeenCalledTimes(2);
    }
  });

  test("given a login page with200 then never treat it as the report", () => {
    expect(() =>
      assertApplicationPage({
        status: 200,
        contentType: "text/html",
        body: Buffer.from("<title>Authentication Required</title>PolicyEngine"),
      }),
    ).toThrow();
  });

  test("given a changed field despite matching counts then reject served inventory", () => {
    const states = Array.from({ length: 51 }, (_, i) => ({
      code: String(i),
      programs: Array.from({ length: i === 0 ? 69 : 1 }, () => ({ value: 1 })),
    }));
    const source = Buffer.from(JSON.stringify(states));
    expect(validateInventory(source, source)).toBe(true);
    states[0].programs[0].value = 2;
    expect(() =>
      validateInventory(Buffer.from(JSON.stringify(states)), source),
    ).toThrow();
  });

  test("given the static CSV then compare its own schema including quoted fields to inventory", () => {
    const states = [
      {
        name: "Example state",
        code: "EX",
        programs: [
          {
            name: 'Tax, "program"',
            category: "deduction",
            scope: "statewide",
            tenures: ["renter"],
            refundable: null,
            incomeLimits: "First line\nsecond line",
            maximumBenefit: "$50",
            programYear: "2025",
            sources: [{ url: "https://example.gov" }],
          },
        ],
      },
    ];
    const csv =
      'state,code,reference_year,program,category,scope,tenures,refundable,income_limits,maximum_benefit,program_year,sources\nExample state,EX,2025,"Tax, ""program""",deduction,statewide,renter,,"First line\nsecond line",$50,2025,https://example.gov\n';
    expect(validateStaticCsv(Buffer.from(csv), JSON.stringify(states))).toBe(
      true,
    );
    expect(() =>
      validateStaticCsv(
        Buffer.from(csv.replace("$50", "$51")),
        JSON.stringify(states),
      ),
    ).toThrow("STATIC_CSV_DIFFERS");
  });
});

describe("sanitized redirect diagnostics", () => {
  async function loopFailure({
    surface = "child",
    purpose = "tool",
    path = CONFIG.toolPath + "report/",
    credentials = keys,
    cookie = "",
    priorRequest = false,
  } = {}) {
    const m = manifest();
    const loopPath = purpose === "cookie-only" ? "/us" : CONFIG.toolPath;
    const fetcher = vi.fn(async () =>
      priorRequest && fetcher.mock.calls.length === 1
        ? html()
        : new Response(null, { status: 307, headers: { location: loopPath } }),
    );
    const transport = makeTransport(m, credentials, fetcher);
    if (cookie)
      transport.acceptHostCookie(
        new Response(null, {
          headers: {
            "set-cookie": `_vercel_jwt=${cookie}; Path=/; Secure; HttpOnly`,
          },
        }),
      );
    if (priorRequest) await transport.get(m.child.origin + CONFIG.toolPath);
    try {
      await transport.get(m[surface].origin + path, purpose);
    } catch (error) {
      return { error, fetcher };
    }
    throw new Error("Expected redirect guard to block");
  }

  test("given a real loop after an earlier request then report four actual responses and terminal guard context", async () => {
    const { error, fetcher } = await loopFailure({ priorRequest: true });
    expect(failureEvidence(error)).toEqual({
      status: "BLOCKED",
      code: "REDIRECT_LIMIT",
      redirect: {
        chain: Array.from({ length: 4 }, (_, depth) => ({
          surface: "child",
          path: depth === 0 ? CONFIG.toolPath + "report/" : CONFIG.toolPath,
          purpose: "tool",
          status: 307,
          depth,
          requestCount: depth + 2,
        })),
        attempt: {
          surface: "child",
          path: CONFIG.toolPath,
          purpose: "tool",
          depth: 4,
          requestCount: 6,
        },
      },
    });
    expect(fetcher).toHaveBeenCalledTimes(5);
  });

  test("given the total request budget then report a terminal attempt without an invented response", async () => {
    const m = manifest();
    const fetcher = vi.fn(async () => html());
    const transport = makeTransport(m, keys, fetcher);
    for (let count = 0; count < 400; count++)
      await transport.get(m.child.origin + CONFIG.toolPath);
    let failure;
    try {
      await transport.get(m.child.origin + CONFIG.toolPath);
    } catch (error) {
      failure = failureEvidence(error);
    }
    expect(failure.redirect).toEqual({
      chain: [],
      attempt: {
        surface: "child",
        path: CONFIG.toolPath,
        purpose: "tool",
        depth: 0,
        requestCount: 401,
      },
    });
    expect(fetcher).toHaveBeenCalledTimes(400);
  });

  test.each(["tool", "cookie-only"])(
    "given a host %s loop then identify the auth case without retaining its cookie",
    async (purpose) => {
      const cookie = "FAKE_COOKIE_SECRET";
      const { error } = await loopFailure({
        surface: "host",
        purpose,
        path: purpose === "cookie-only" ? "/us" : CONFIG.toolPath,
        cookie,
      });
      const failure = failureEvidence(error);
      expect(failure.redirect.chain).toHaveLength(4);
      expect(failure.redirect.attempt).toMatchObject({
        surface: "host",
        purpose,
        depth: 4,
      });
      expect(JSON.stringify(failure)).not.toContain(cookie);
      expect(JSON.stringify(failure)).not.toContain("_vercel_jwt");
    },
  );

  test.each([
    ["foreign target", "https://attacker.invalid/", "ORIGIN_NOT_ALLOWED"],
    ["query target", CONFIG.toolPath + "?private=PRIVATE_QUERY", "BAD_URL"],
  ])(
    "given a %s then retain only the trusted source frame before rejection",
    async (_name, location, code) => {
      const m = manifest();
      const fetcher = vi.fn(
        async () => new Response(null, { status: 302, headers: { location } }),
      );
      let failure;
      try {
        await makeTransport(m, keys, fetcher).get(
          m.child.origin + CONFIG.toolPath,
        );
      } catch (error) {
        failure = failureEvidence(error);
      }
      expect(failure.code).toBe(code);
      expect(failure.redirect.chain).toEqual([
        {
          surface: "child",
          path: CONFIG.toolPath,
          purpose: "tool",
          status: 302,
          depth: 0,
          requestCount: 1,
        },
      ]);
      expect(JSON.stringify(failure)).not.toContain("PRIVATE_QUERY");
      expect(JSON.stringify(failure)).not.toContain("attacker.invalid");
      expect(fetcher).toHaveBeenCalledTimes(1);
    },
  );

  test("given a bootstrap redirect guard failure then identify bootstrap without following its target", async () => {
    const m = manifest();
    const fetcher = vi.fn(
      async () =>
        new Response(null, {
          status: 307,
          headers: { location: "https://attacker.invalid/" },
        }),
    );
    let failure;
    try {
      await makeTransport(m, keys, fetcher).get(
        m.host.origin + "/us",
        "bootstrap",
      );
    } catch (error) {
      failure = failureEvidence(error);
    }
    expect(failure.redirect.chain).toEqual([
      {
        surface: "host",
        path: "/us",
        purpose: "bootstrap",
        status: 307,
        depth: 0,
        requestCount: 1,
      },
    ]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  test.each([
    ["raw", (value) => value],
    ["URL", (value) => encodeURIComponent(value)],
    ["base64", (value) => Buffer.from(value).toString("base64")],
    ["base64url", (value) => Buffer.from(value).toString("base64url")],
    ["hex", (value) => Buffer.from(value).toString("hex")],
  ])(
    "given a %s credential pathname then omit it from diagnostic evidence",
    async (_name, encode) => {
      const secret = "FAKE_HOST+/=SECRET";
      const encoded = encode(secret);
      const { error } = await loopFailure({
        path: CONFIG.toolPath + encoded,
        credentials: { hostKey: secret, childKey: "OTHER_FAKE_KEY" },
      });
      const failure = failureEvidence(error);
      if (failure.redirect)
        expect(failure.redirect.chain[0]).not.toHaveProperty("path");
      expect(JSON.stringify(failure)).not.toContain(secret);
      expect(JSON.stringify(failure)).not.toContain(encoded);
    },
  );

  test("given an encoded host-cookie pathname then omit it without changing request guards", async () => {
    const cookie = "PRIVATE_COOKIE_VALUE";
    const encoded = Buffer.from(cookie).toString("base64url");
    const { error } = await loopFailure({
      surface: "host",
      cookie,
      path: CONFIG.toolPath + encoded,
    });
    const failure = failureEvidence(error);
    expect(failure.redirect.chain[0]).not.toHaveProperty("path");
    expect(JSON.stringify(failure)).not.toContain(encoded);
    expect(JSON.stringify(failure)).not.toContain(cookie);
  });

  test("given generated raw or encoded secret paths then bounded diagnostics never contain those paths", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^[A-Za-z][A-Za-z0-9]{15,31}$/),
        fc.constantFrom("raw", "base64url", "hex"),
        async (secret, encoding) => {
          const encoded =
            encoding === "raw"
              ? secret
              : Buffer.from(secret).toString(encoding);
          const { error } = await loopFailure({
            credentials: { hostKey: secret, childKey: "OTHER_FAKE_KEY" },
            path: CONFIG.toolPath + encoded,
          });
          const failure = failureEvidence(error);
          expect(failure.redirect.chain).toHaveLength(4);
          expect(failure.redirect.chain[0]).not.toHaveProperty("path");
          expect(JSON.stringify(failure)).not.toContain(secret);
          expect(JSON.stringify(failure)).not.toContain(encoded);
        },
      ),
      { numRuns: 100, seed: 20261120 },
    );
  });

  test("given a forged redirect on an arbitrary error then expose only the constant failure code", () => {
    const error = new Error(keys.hostKey);
    error.redirect = { chain: [{ path: keys.childKey }] };
    expect(failureEvidence(error)).toEqual({
      status: "BLOCKED",
      code: "QA_FAILED",
    });
  });
});

describe("shared visible top-shell assertion", () => {
  // Fake DOM fixtures only: JSDOM has no layout. Rectangles below are explicitly
  // synthetic, while selection, attributes, text and inline styles use real DOM APIs.
  function fakeShellPage({ brand = true, missing, variant = "visible" } = {}) {
    const position = variant === "above" ? -100 : variant === "below" ? 600 : 8;
    const size =
      variant === "zero-width"
        ? 'data-width="0"'
        : variant === "zero-height"
          ? 'data-height="0"'
          : "";
    const style = ["display:none", "visibility:hidden", "opacity:0"].includes(
      variant,
    )
      ? variant
      : "";
    const content = `<img alt="${brand ? "PolicyEngine" : "Other brand"}" style="${style}">${REQUIRED_NAV_LABELS.filter(
      (label) => label !== missing,
    )
      .map(
        (label) =>
          `<a href="/us/${label.toLowerCase()}" style="${style}">${label}</a>`,
      )
      .join("")}`;
    const footer =
      '<footer data-top="600"><img alt="PolicyEngine"><a>Research</a><a>Model</a><a>API</a><a>Donate</a></footer>';
    const fixture = `${variant === "footer-only" ? "" : `<div data-top="${position}" ${size} style="position:sticky;top:0">${content}</div>`}<nav><a>Read the report</a><a>Data and methods</a></nav>${footer}`;
    return {
      evaluate: vi.fn(async (callback, selector) => {
        const dom = new JSDOM(fixture);
        expect(dom.window.document.querySelector("header")).toBeNull();
        for (const element of dom.window.document.querySelectorAll("*")) {
          element.getBoundingClientRect = () => {
            const top = Number(
              element.closest("[data-top]")?.getAttribute("data-top") ?? 8,
            );
            const width = Number(
              element.closest("[data-width]")?.getAttribute("data-width") ??
                120,
            );
            const height = Number(
              element.closest("[data-height]")?.getAttribute("data-height") ??
                40,
            );
            return { width, height, top, bottom: top + height };
          };
        }
        vi.stubGlobal("document", dom.window.document);
        vi.stubGlobal("window", dom.window);
        try {
          return callback(selector);
        } finally {
          vi.unstubAllGlobals();
          dom.window.close();
        }
      }),
    };
  }

  test("given a visible div shell with logo and four anchors then pass without a header tag", async () => {
    const page = fakeShellPage();
    await expect(assertApplicationShell(page)).resolves.toBeUndefined();
    expect(page.evaluate).toHaveBeenCalledTimes(1);
  });

  test("given navigation without the top brand then reject despite branded footer", async () => {
    await expect(
      assertApplicationShell(fakeShellPage({ brand: false })),
    ).rejects.toThrow("SHELL_MISSING");
  });

  test.each(REQUIRED_NAV_LABELS)(
    "given missing visible %s then reject despite footer navigation",
    async (missing) => {
      await expect(
        assertApplicationShell(fakeShellPage({ missing })),
      ).rejects.toThrow("SHELL_MISSING");
    },
  );

  test.each([
    "display:none",
    "visibility:hidden",
    "opacity:0",
    "zero-width",
    "zero-height",
    "above",
    "below",
    "footer-only",
  ])(
    "given a %s shell fixture then reject its invisible or misplaced brand/navigation",
    async (variant) => {
      await expect(
        assertApplicationShell(fakeShellPage({ variant })),
      ).rejects.toThrow("SHELL_MISSING");
    },
  );

  test("given generated brand/nav/visibility fixtures then retain the complete visible-shell guard", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        fc.option(fc.constantFrom(...REQUIRED_NAV_LABELS), { nil: undefined }),
        fc.constantFrom(
          "visible",
          "display:none",
          "visibility:hidden",
          "opacity:0",
          "zero-width",
          "zero-height",
          "above",
          "below",
          "footer-only",
        ),
        async (brand, missing, variant) => {
          const assertion = assertApplicationShell(
            fakeShellPage({ brand, missing, variant }),
          );
          if (brand && missing === undefined && variant === "visible")
            await expect(assertion).resolves.toBeUndefined();
          else await expect(assertion).rejects.toThrow("SHELL_MISSING");
        },
      ),
      { numRuns: 100, seed: 20261124 },
    );
  });

  test("given the shared audit is imported then never run main or perform a request", async () => {
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("NO_NETWORK_IN_FIXTURE"));
    const output = vi.spyOn(console, "log").mockImplementation(() => {});
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const originalExitCode = process.exitCode;
    try {
      const audit =
        await import("./audit-app-zone-shell.mjs?protected-qa-import-fixture");
      expect(audit.inspectTopShell).toBeTypeOf("function");
      expect(fetcher).not.toHaveBeenCalled();
      expect(output).not.toHaveBeenCalled();
      expect(errors).not.toHaveBeenCalled();
      expect(process.exitCode).toBe(originalExitCode);
    } finally {
      fetcher.mockRestore();
      output.mockRestore();
      errors.mockRestore();
    }
  });
});
