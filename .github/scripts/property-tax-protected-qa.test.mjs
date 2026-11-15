// @vitest-environment node
import { describe, expect, test, vi } from "vitest";
import fc from "fast-check";
import {
  CONFIG,
  assertAllowedUrl,
  assertApplicationPage,
  makeTransport,
  runPreflight,
  validateAlias,
  validateBuildReceipt,
  validateDeployment,
  validateInventory,
  validateStaticCsv,
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

  test("given tool requests then only the child key is sent without ambient headers", async () => {
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

  test("given a manual deployed-byte mismatch then never send the host key", async () => {
    const m = manifest();
    m.child.sourceKind = "reviewed-manual-build";
    m.child.buildReceipt = {
      files: { [CONFIG.toolPath + "data/inventory.csv"]: "0".repeat(64) },
    };
    const fetcher = vi.fn(async () => html());
    await expect(runPreflight(m, keys, fetcher)).rejects.toThrow(
      "DEPLOYED_BUILD_DIFFERS",
    );
    expect(fetcher.mock.calls).toHaveLength(2);
    expect(
      fetcher.mock.calls.every(
        ([, options]) =>
          options.headers.get("x-vercel-protection-bypass") === keys.childKey,
      ),
    ).toBe(true);
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
