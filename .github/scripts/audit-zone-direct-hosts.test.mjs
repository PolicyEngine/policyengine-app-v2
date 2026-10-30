import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";

import {
  canonicalUrls,
  compileSource,
  DIRECT_HOST_REDIRECTS,
  findIframedHosts,
  isProductionVercelHost,
  isUnreachableStatus,
  loadRewrites,
  main,
  PROBE_PARAM,
  probeDirectHost,
  probeUrls,
  proxiedUrl,
  PUBLIC_ORIGIN,
  redirectKeepsPage,
  summarizeRoute,
  USER_AGENT,
  zoneRoutes,
} from "./audit-zone-direct-hosts.mjs";

// The website's model differential test (website/src/__tests__/config/
// zone-direct-host-model.test.ts) checks proxiedUrl against Next's own
// routing; these check the audit's logic on fixed and generated cases.

/** appZoneRewrites' shapes: a zone and its deep rewrite, a root-served zone, a rename, a shared host, and the year in review's asset route. */
function withDeep(source, destination, deepDestination) {
  return [
    { source, destination },
    {
      source: `${source}/:path*`,
      destination:
        deepDestination ?? `${destination.replace(/\/$/, "")}/:path*`,
    },
  ];
}
const REWRITES = [
  {
    source: "/us/2025-year-in-review",
    destination:
      "https://policyengine-2025-year-in-review.vercel.app/2025-year-in-review/us",
  },
  ...withDeep(
    "/us/ballot-measures-2026",
    "https://ballot-measures-2026.vercel.app/us/ballot-measures-2026",
  ),
  ...withDeep(
    "/us/cliffwatch",
    "https://cliff-watch.vercel.app/",
    "https://cliff-watch.vercel.app/:path*",
  ),
  ...withDeep(
    "/us/pe84",
    "https://april-fools-2026-two.vercel.app/us/pe84/calculator",
    "https://april-fools-2026-two.vercel.app/us/pe84/:path*",
  ),
  ...withDeep(
    "/us/marriage",
    "https://marriage-zeta-beryl.vercel.app/us/marriage",
  ),
  ...withDeep(
    "/uk/marriage",
    "https://marriage-zeta-beryl.vercel.app/us/marriage?country=uk",
    "https://marriage-zeta-beryl.vercel.app/us/marriage/:path*?country=uk",
  ),
  ...withDeep(
    "/us/encode-policy-multi-agent-ai",
    "/assets/posts/encode-policy-multi-agent-ai/index.html",
    "/assets/posts/encode-policy-multi-agent-ai/:path*",
  ),
  {
    source: "/2025-year-in-review/:path*",
    destination:
      "https://policyengine-2025-year-in-review.vercel.app/2025-year-in-review/:path*",
  },
];
const ZONES = Object.fromEntries(
  zoneRoutes(REWRITES).map((zone) => [zone.source, zone]),
);
const BALLOT = ZONES["/us/ballot-measures-2026"];
const BALLOT_HOST = "https://ballot-measures-2026.vercel.app";

/**
 * A fetch that answers from a table of `url -> response`; anything else 404s.
 * A response is `{ status, location, body }`, `{ throws }`, or a list of these
 * answered in turn (the last repeats).
 */
function fakeFetch(table) {
  const calls = [];
  const seen = {};
  const impl = async (url, init) => {
    calls.push(url);
    assert.equal(init.redirect, "manual");
    assert.ok(init.signal instanceof AbortSignal, "no timeout signal");
    assert.equal(init.headers["user-agent"], USER_AGENT);
    let entry = table[url] ?? { status: 404 };
    if (Array.isArray(entry)) {
      seen[url] = (seen[url] ?? 0) + 1;
      entry = entry[Math.min(seen[url], entry.length) - 1];
    }
    if (entry.throws) throw new TypeError(entry.throws);
    return {
      status: entry.status,
      headers: { get: (name) => (name === "location" ? entry.location : null) },
      text: async () => entry.body ?? "",
    };
  };
  return Object.assign(impl, { calls });
}

const permanent = (location) => ({ status: 308, location });
const page = { status: 200, body: "<html><head></head></html>" };
const noWait = { retryDelays: [0, 0], sleep: async () => {} };

describe("isProductionVercelHost", () => {
  test("accepts vercel.app hosts only", () => {
    assert.equal(isProductionVercelHost(BALLOT.destination), true);
    assert.equal(isProductionVercelHost("https://example.modal.run/x"), false);
    assert.equal(
      isProductionVercelHost("https://vercel.app.example.com/x"),
      false,
    );
    assert.equal(isProductionVercelHost("/assets/posts/x/index.html"), false);
  });
});

describe("zoneRoutes", () => {
  test("keeps plain sources on Vercel hosts, the year in review included", () => {
    assert.deepEqual(Object.keys(ZONES), [
      "/us/2025-year-in-review",
      "/us/ballot-measures-2026",
      "/us/cliffwatch",
      "/us/pe84",
      "/us/marriage",
      "/uk/marriage",
    ]);
  });
});

describe("compileSource", () => {
  test("matches literal segments, :name and :name*, with an optional trailing slash", () => {
    const deep = compileSource("/us/a/:path*");
    assert.deepEqual(deep("/us/a"), { path: "" });
    assert.deepEqual(deep("/us/a/"), { path: "" });
    assert.deepEqual(deep("/us/a/b/c"), { path: "b/c" });
    assert.equal(deep("/us/ab"), null);
    assert.equal(deep("/US/a"), null);
    assert.deepEqual(compileSource("/:countryId/x")("/uk/x"), {
      countryId: "uk",
    });
    assert.equal(compileSource("/:countryId/x")("/uk/y/x"), null);
    assert.deepEqual(compileSource("/us/a.b")("/us/a.b"), {});
    assert.equal(compileSource("/us/a.b")("/us/axb"), null);
  });
});

describe("proxiedUrl", () => {
  const proxy = (path) => proxiedUrl(REWRITES, `${PUBLIC_ORIGIN}${path}`)?.url;

  test("fills the deep rewrite's path and keeps the query", () => {
    assert.equal(
      proxy("/us/ballot-measures-2026/ca-prop-40?a=1&a=2"),
      `${BALLOT_HOST}/us/ballot-measures-2026/ca-prop-40?a=1&a=2`,
    );
    assert.equal(
      proxy("/us/cliffwatch/x/y"),
      "https://cliff-watch.vercel.app/x/y",
    );
  });

  test("lets the destination's query keys replace the visitor's", () => {
    assert.equal(
      proxy("/uk/marriage/x?country=us&country=uk&b=1"),
      "https://marriage-zeta-beryl.vercel.app/us/marriage/x?b=1&country=uk",
    );
  });

  test("serves the year in review's pages only through its asset route", () => {
    assert.equal(
      proxy("/2025-year-in-review/us/x"),
      "https://policyengine-2025-year-in-review.vercel.app/2025-year-in-review/us/x",
    );
    assert.equal(proxy("/us/2025-year-in-review/x"), undefined);
    // An empty :path* drops its slash, as Next's does.
    assert.equal(
      proxy("/2025-year-in-review"),
      "https://policyengine-2025-year-in-review.vercel.app/2025-year-in-review",
    );
  });

  test("uses the first rewrite that matches", () => {
    const rewrites = [
      { source: "/us/a/:path*", destination: "https://a.vercel.app/:path*" },
      { source: "/us/a/b", destination: "https://b.vercel.app/b" },
    ];
    assert.equal(
      proxiedUrl(rewrites, `${PUBLIC_ORIGIN}/us/a/b`).url,
      "https://a.vercel.app/b",
    );
  });

  test("resolves a relative destination on the website", () => {
    assert.equal(
      proxy("/us/encode-policy-multi-agent-ai/figure.png"),
      `${PUBLIC_ORIGIN}/assets/posts/encode-policy-multi-agent-ai/figure.png`,
    );
  });
});

describe("probeUrls", () => {
  test("probes a zone's root and a path under it, with the rewrite's query", () => {
    assert.deepEqual(
      probeUrls(ZONES["/uk/marriage"]).map(({ url }) => url),
      [
        `https://marriage-zeta-beryl.vercel.app/us/marriage?country=uk&${PROBE_PARAM}=1`,
        `https://marriage-zeta-beryl.vercel.app/us/marriage/direct-host-audit?country=uk&${PROBE_PARAM}=1`,
      ],
    );
    assert.deepEqual(
      probeUrls(ZONES["/us/cliffwatch"]).map(({ requirePage, url }) => [
        url,
        requirePage,
      ]),
      [
        [`https://cliff-watch.vercel.app/?${PROBE_PARAM}=1`, true],
        [
          `https://cliff-watch.vercel.app/direct-host-audit?${PROBE_PARAM}=1`,
          false,
        ],
      ],
    );
  });
});

describe("redirectKeepsPage", () => {
  const keeps = (fromUrl, location) =>
    redirectKeepsPage(REWRITES, fromUrl, location);

  test("accepts the same path and query on www or the apex", () => {
    assert.deepEqual(
      keeps(
        `${BALLOT_HOST}/us/ballot-measures-2026/ca-prop-40?a=1&a=2`,
        `${PUBLIC_ORIGIN}/us/ballot-measures-2026/ca-prop-40?a=2&a=1`,
      ),
      { ok: true },
    );
    assert.equal(
      keeps(
        `${BALLOT_HOST}/us/ballot-measures-2026`,
        "https://policyengine.org/us/ballot-measures-2026",
      ).ok,
      true,
    );
  });

  test("rejects http, another port, another site or a look-alike host", () => {
    for (const location of [
      "http://www.policyengine.org/us/ballot-measures-2026",
      "https://www.policyengine.org:8443/us/ballot-measures-2026",
      "https://example.com/us/ballot-measures-2026",
      "https://policyengine.org.evil.example/us/ballot-measures-2026",
      "https://notpolicyengine.org/us/ballot-measures-2026",
      `${BALLOT_HOST}/us/ballot-measures-2026`,
    ]) {
      assert.match(
        keeps(`${BALLOT_HOST}/us/ballot-measures-2026`, location).reason,
        /redirects off/,
        location,
      );
    }
  });

  test("rejects a dropped query, a changed value, or another path", () => {
    const from = `${BALLOT_HOST}/us/ballot-measures-2026/ca-prop-40?state=ca`;
    for (const location of [
      `${PUBLIC_ORIGIN}/us/ballot-measures-2026/ca-prop-40`,
      `${PUBLIC_ORIGIN}/us/ballot-measures-2026/ca-prop-40?state=ny`,
      `${PUBLIC_ORIGIN}/us/ballot-measures-2026?state=ca`,
      `${PUBLIC_ORIGIN}/?state=ca`,
    ]) {
      assert.equal(keeps(from, location).ok, false, location);
    }
  });

  test("maps root-served and renamed zones back through their rewrites", () => {
    const cliffwatch = "https://cliff-watch.vercel.app";
    assert.equal(
      keeps(`${cliffwatch}/?s=CA`, `${PUBLIC_ORIGIN}/us/cliffwatch?s=CA`).ok,
      true,
    );
    assert.equal(
      keeps(`${cliffwatch}/x`, `${PUBLIC_ORIGIN}/us/cliffwatch/x`).ok,
      true,
    );
    assert.match(
      keeps(`${cliffwatch}/`, `${PUBLIC_ORIGIN}/`).reason,
      /doesn't proxy \/ to a zone/,
    );
    // pe84's root rewrites to /us/pe84/calculator, so both public URLs serve it.
    const pe84 = "https://april-fools-2026-two.vercel.app/us/pe84/calculator";
    assert.equal(keeps(pe84, `${PUBLIC_ORIGIN}/us/pe84`).ok, true);
    assert.equal(keeps(pe84, `${PUBLIC_ORIGIN}/us/pe84/calculator`).ok, true);
  });

  test("follows the year in review's routes, which have no deep rewrite", () => {
    const zone =
      "https://policyengine-2025-year-in-review.vercel.app/2025-year-in-review/us";
    assert.equal(
      keeps(zone, `${PUBLIC_ORIGIN}/us/2025-year-in-review`).ok,
      true,
    );
    assert.equal(
      keeps(`${zone}/x`, `${PUBLIC_ORIGIN}/2025-year-in-review/us/x`).ok,
      true,
    );
    assert.match(
      keeps(`${zone}/x`, `${PUBLIC_ORIGIN}/us/2025-year-in-review/x`).reason,
      /doesn't proxy/,
    );
  });

  test("keeps a host shared between countries on the right country", () => {
    const uk = "https://marriage-zeta-beryl.vercel.app/us/marriage?country=uk";
    assert.deepEqual(keeps(uk, `${PUBLIC_ORIGIN}/uk/marriage`), { ok: true });
    assert.deepEqual(keeps(uk, `${PUBLIC_ORIGIN}/uk/marriage?country=uk`), {
      ok: true,
    });
    // The US route serves the same page, but /uk/marriage serves it by name.
    assert.deepEqual(keeps(uk, `${PUBLIC_ORIGIN}/us/marriage?country=uk`), {
      ok: true,
      betterSource: "/uk/marriage",
    });
    // Only a route whose destination contains the page counts.
    const rewrites = [
      ...withDeep("/us/m", "https://h.vercel.app/us/m"),
      ...withDeep("/us/mx", "https://h.vercel.app/us/mx"),
      ...withDeep("/uk/m", "https://h.vercel.app/us/m?country=uk"),
    ];
    assert.deepEqual(
      redirectKeepsPage(
        rewrites,
        "https://h.vercel.app/us/mx?country=uk",
        `${PUBLIC_ORIGIN}/us/mx?country=uk`,
      ),
      { ok: true },
    );
    // Dropping ?country=uk turns a UK reader's page into the US one.
    assert.equal(keeps(uk, `${PUBLIC_ORIGIN}/us/marriage`).ok, false);
    assert.equal(
      keeps(
        "https://marriage-zeta-beryl.vercel.app/us/marriage",
        `${PUBLIC_ORIGIN}/uk/marriage`,
      ).ok,
      false,
    );
  });
});

describe("canonicalUrls", () => {
  test("reads canonical links and og:url in any attribute order", () => {
    assert.deepEqual(
      canonicalUrls(
        `<link href="https://a.vercel.app/x" rel="canonical"><LINK rel='alternate canonical' href='/y'>
         <meta content="https://b.vercel.app/" property="og:url"><meta property="og:image" content="https://c.vercel.app/i.png">
         <link rel="stylesheet" href="https://d.vercel.app/s.css">`,
      ),
      [
        { kind: "canonical", url: "https://a.vercel.app/x" },
        { kind: "canonical", url: "/y" },
        { kind: "og:url", url: "https://b.vercel.app/" },
      ],
    );
  });
});

// Seeded so a failure reproduces; the message names the seed and the case.
function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomSuffixAndQuery(random) {
  const pick = (chars, length) =>
    Array.from(
      { length },
      () => chars[Math.floor(random() * chars.length)],
    ).join("");
  const segments = Array.from({ length: Math.floor(random() * 4) }, () =>
    pick(
      "abcdefghijklmnopqrstuvwxyz0123456789-_",
      1 + Math.floor(random() * 10),
    ),
  );
  const pairs = Array.from(
    { length: Math.floor(random() * 4) },
    () =>
      `q${pick("abcdefghij", 1 + Math.floor(random() * 4))}=${pick("abc123", Math.floor(random() * 5))}`,
  );
  return {
    suffix: segments.map((segment) => `/${segment}`).join(""),
    search: pairs.length ? `?${pairs.join("&")}` : "",
  };
}

describe("redirectKeepsPage over every zone in appZoneRoutes.ts", async () => {
  const rewrites = await loadRewrites();
  const zones = zoneRoutes(rewrites);
  const SEED = 20261029;
  const CASES_PER_ZONE = 50;

  test("finds the zones", () => {
    assert.ok(zones.length > 40, `only ${zones.length} zones`);
  });

  test("a redirect to the public URL that proxies a zone URL keeps that page", () => {
    const random = mulberry32(SEED);
    for (const zone of zones) {
      for (let i = 0; i < CASES_PER_ZONE; i += 1) {
        const { suffix, search } = randomSuffixAndQuery(random);
        const publicUrl = `${PUBLIC_ORIGIN}${zone.source}${suffix}${search}`;
        const proxied = proxiedUrl(rewrites, publicUrl);
        const label = `seed ${SEED} ${zone.source} case ${i}: ${publicUrl}`;
        // Every zone but the year in review has a deep rewrite.
        if (!proxied) {
          assert.match(zone.source, /year-in-review/, label);
          continue;
        }
        const result = redirectKeepsPage(rewrites, proxied.url, publicUrl);
        assert.equal(result.ok, true, `${label}: ${result.reason}`);
      }
    }
  });

  test("a redirect that drops the query or the path, or goes to the home page, never passes", () => {
    const random = mulberry32(SEED + 1);
    for (const zone of zones) {
      for (let i = 0; i < CASES_PER_ZONE; i += 1) {
        const { suffix, search } = randomSuffixAndQuery(random);
        const label = `seed ${SEED + 1} ${zone.source} case ${i}`;
        const query = search || "?qa=1";
        const proxied = proxiedUrl(
          rewrites,
          `${PUBLIC_ORIGIN}${zone.source}${suffix || "/x"}${query}`,
        );
        if (!proxied) continue;
        for (const location of [
          `${PUBLIC_ORIGIN}${zone.source}${suffix || "/x"}`,
          `${PUBLIC_ORIGIN}${zone.source}${query}`,
          `${PUBLIC_ORIGIN}/${query}`,
        ]) {
          assert.equal(
            redirectKeepsPage(rewrites, proxied.url, location).ok,
            false,
            `${label}: ${proxied.url} -> ${location}`,
          );
        }
      }
    }
  });
});

describe("probeDirectHost", () => {
  const DIRECT = `${BALLOT_HOST}/us/ballot-measures-2026?${PROBE_PARAM}=1`;
  const PUBLIC = `${PUBLIC_ORIGIN}/us/ballot-measures-2026?${PROBE_PARAM}=1`;
  const probe = (table, options = {}) =>
    probeDirectHost(REWRITES, DIRECT, {
      fetchImpl: fakeFetch(table),
      ...noWait,
      ...options,
    });

  test("reports a host that serves the page itself, or a 404, as missing", async () => {
    for (const status of [200, 404]) {
      const result = await probe({ [DIRECT]: { status } });
      assert.equal(result.state, "missing");
      assert.equal(result.status, status);
    }
  });

  test("passes a 308 or 301 to the same page on www that answers 200", async () => {
    for (const status of [308, 301]) {
      const result = await probe({
        [DIRECT]: { status, location: PUBLIC },
        [PUBLIC]: page,
      });
      assert.equal(result.state, "ok", result.reason);
      assert.equal(result.location, PUBLIC);
      assert.deepEqual(result.publicHops, []);
    }
  });

  test("compares the target with the last URL on the zone's host", async () => {
    // An unknown page that the zone sends to its home first, then to www.
    const unknown = `${BALLOT_HOST}/us/ballot-measures-2026/gone?${PROBE_PARAM}=1`;
    const result = await probeDirectHost(REWRITES, unknown, {
      fetchImpl: fakeFetch({
        [unknown]: permanent(`/us/ballot-measures-2026?${PROBE_PARAM}=1`),
        [DIRECT]: permanent(PUBLIC),
        [PUBLIC]: page,
      }),
      ...noWait,
    });
    assert.equal(result.state, "ok", result.reason);
    assert.equal(result.sameHostHops, 1);
  });

  test("counts the hops policyengine.org adds, such as the apex's or a trailing slash's", async () => {
    const apex = `https://policyengine.org/us/ballot-measures-2026/?${PROBE_PARAM}=1`;
    const slashed = `${PUBLIC_ORIGIN}/us/ballot-measures-2026/?${PROBE_PARAM}=1`;
    const result = await probe({
      [DIRECT]: permanent(apex),
      [apex]: { status: 307, location: slashed },
      [slashed]: permanent(PUBLIC),
      [PUBLIC]: page,
    });
    assert.equal(result.state, "ok", result.reason);
    assert.deepEqual(result.publicHops, [slashed, PUBLIC]);
  });

  test("fails a temporary redirect to www", async () => {
    const result = await probe({
      [DIRECT]: { status: 307, location: PUBLIC },
      [PUBLIC]: page,
    });
    assert.equal(result.state, "wrong");
    assert.match(result.reason, /307/);
  });

  test("reports Vercel's SSO redirect, a challenge or a server error as unreachable", async () => {
    for (const answer of [
      { status: 302, location: "https://vercel.com/sso-api?url=x" },
      { status: 401 },
      { status: 403 },
      { status: 429 },
      { status: 503 },
      { throws: "fetch failed" },
    ]) {
      const result = await probe({ [DIRECT]: answer });
      assert.equal(result.state, "unreachable", JSON.stringify(answer));
    }
  });

  test("reports a redirect status without a location as unreachable", async () => {
    for (const status of [300, 304]) {
      const result = await probe({ [DIRECT]: { status } });
      assert.equal(result.state, "unreachable", String(status));
      assert.match(result.reason, new RegExp(`answers ${status}`));
    }
  });

  test("retries a failed request, a 429 or a 5xx, but not a challenge", async () => {
    const flaky = fakeFetch({
      [DIRECT]: [
        { throws: "socket hang up" },
        { status: 503 },
        permanent(PUBLIC),
      ],
      [PUBLIC]: [{ status: 429 }, page],
    });
    const sleeps = [];
    const result = await probeDirectHost(REWRITES, DIRECT, {
      fetchImpl: flaky,
      retryDelays: [5, 10],
      sleep: async (ms) => sleeps.push(ms),
    });
    assert.equal(result.state, "ok", result.reason);
    assert.deepEqual(sleeps, [5, 10, 5]);

    const challenged = fakeFetch({ [DIRECT]: { status: 403 } });
    await probeDirectHost(REWRITES, DIRECT, {
      fetchImpl: challenged,
      ...noWait,
    });
    assert.equal(challenged.calls.length, 1);

    const down = fakeFetch({ [DIRECT]: { status: 503 } });
    const gaveUp = await probeDirectHost(REWRITES, DIRECT, {
      fetchImpl: down,
      ...noWait,
    });
    assert.equal(gaveUp.state, "unreachable");
    assert.equal(down.calls.length, 3);
  });

  test("gives up on a request that outlasts the timeout", async () => {
    const hangs = async (url, init) =>
      new Promise((_, reject) => {
        assert.equal(init.headers["user-agent"], USER_AGENT);
        init.signal.addEventListener("abort", () => reject(init.signal.reason));
      });
    const result = await probeDirectHost(REWRITES, DIRECT, {
      fetchImpl: hangs,
      timeout: 20,
      ...noWait,
    });
    assert.equal(result.state, "unreachable");
    assert.match(result.reason, /request failed/);
  });

  test("fails a redirect to a page that answers 404, unless it only checks the path", async () => {
    const table = { [DIRECT]: permanent(PUBLIC), [PUBLIC]: { status: 404 } };
    const strict = await probe(table);
    assert.equal(strict.state, "wrong");
    assert.match(strict.reason, /answers 404/);
    assert.equal((await probe(table, { requirePage: false })).state, "ok");
  });

  test("reports www's 5xx after the redirect as unreachable, not wrong", async () => {
    const result = await probe({
      [DIRECT]: permanent(PUBLIC),
      [PUBLIC]: { status: 502 },
    });
    assert.equal(result.state, "unreachable");
  });

  test("fails when policyengine.org redirects the target to another page", async () => {
    const elsewhere = `${PUBLIC_ORIGIN}/us/research`;
    const result = await probe({
      [DIRECT]: permanent(PUBLIC),
      [PUBLIC]: permanent(elsewhere),
      [elsewhere]: page,
    });
    assert.equal(result.state, "wrong");
    assert.match(result.reason, /sends .* on to .*\/us\/research/);
  });

  test("fails loops on policyengine.org, through the zone host, and on the zone host", async () => {
    for (const [table, requirePage] of [
      [{ [DIRECT]: permanent(PUBLIC), [PUBLIC]: permanent(PUBLIC) }, true],
      [{ [DIRECT]: permanent(PUBLIC), [PUBLIC]: permanent(DIRECT) }, false],
      [{ [DIRECT]: permanent(DIRECT) }, true],
    ]) {
      const result = await probe(table, { requirePage });
      assert.equal(result.state, "wrong");
      assert.match(result.reason, /loops/);
    }
  });

  test("fails a chain of more than five hops as a loop", async () => {
    const hop = (n) =>
      `${PUBLIC_ORIGIN}/us/ballot-measures-2026?${PROBE_PARAM}=1&hop=${n}`;
    const table = { [DIRECT]: permanent(PUBLIC), [PUBLIC]: permanent(hop(1)) };
    for (let n = 1; n <= 6; n += 1) table[hop(n)] = permanent(hop(n + 1));
    const result = await probe(table);
    assert.equal(result.state, "wrong");
    assert.match(result.reason, /loops/);
  });

  test("fails when policyengine.org sends readers back to the zone host", async () => {
    const elsewhere = `${BALLOT_HOST}/us/ballot-measures-2026/other`;
    const result = await probe({
      [DIRECT]: permanent(PUBLIC),
      [PUBLIC]: permanent(elsewhere),
      [elsewhere]: page,
    });
    assert.equal(result.state, "wrong");
    assert.match(result.reason, /back to ballot-measures-2026\.vercel\.app/);
  });

  test("fails a page that names a vercel.app URL as its canonical or og:url", async () => {
    for (const head of [
      `<link rel="canonical" href="${BALLOT_HOST}/us/ballot-measures-2026">`,
      `<meta property="og:url" content="${BALLOT_HOST}/us/ballot-measures-2026">`,
    ]) {
      const result = await probe({
        [DIRECT]: permanent(PUBLIC),
        [PUBLIC]: { status: 200, body: `<head>${head}</head>` },
      });
      assert.equal(result.state, "wrong", head);
      assert.match(result.reason, /names https:\/\/ballot-measures-2026/);
    }
    const fine = await probe({
      [DIRECT]: permanent(PUBLIC),
      [PUBLIC]: {
        status: 200,
        body: `<link rel="canonical" href="https://policyengine.org/us/ballot-measures-2026">`,
      },
    });
    assert.equal(fine.state, "ok", fine.reason);
  });

  test("fails a redirect that leaves policyengine.org", async () => {
    const result = await probe({
      [DIRECT]: permanent("https://example.com/us/ballot-measures-2026"),
    });
    assert.equal(result.state, "wrong");
    assert.match(result.reason, /redirects off/);
  });
});

describe("isUnreachableStatus", () => {
  test("covers challenges, rate limits, timeouts and server errors", () => {
    for (const status of [401, 403, 408, 425, 429, 500, 502, 503, 504]) {
      assert.equal(isUnreachableStatus(status), true, String(status));
    }
    for (const status of [200, 204, 301, 308, 400, 404, 410]) {
      assert.equal(isUnreachableStatus(status), false, String(status));
    }
  });
});

describe("summarizeRoute", () => {
  const ok = { state: "ok" };
  const missing = { state: "missing" };
  const wrong = { state: "wrong", reason: "x" };
  const unreachable = { state: "unreachable", reason: "x" };
  const summary = (probes, listed) => summarizeRoute(BALLOT, probes, listed);

  test("only a redirect that goes wrong fails an unlisted route", () => {
    assert.equal(summary([missing, missing], false).fails, false);
    assert.equal(summary([ok, ok], false).fails, false);
    assert.equal(summary([ok, missing], false).state, "partial");
    assert.equal(summary([ok, missing], false).fails, false);
    assert.equal(summary([missing, wrong], false).fails, true);
    assert.equal(summary([unreachable, unreachable], false).fails, false);
  });

  test("a listed route fails once either path stops redirecting", () => {
    assert.equal(summary([ok, ok], true).fails, false);
    assert.equal(summary([ok, missing], true).fails, true);
    assert.equal(summary([missing, ok], true).fails, true);
    assert.equal(summary([missing, missing], true).fails, true);
  });

  test("an unreachable path is reported, never failed, unless the other is missing", () => {
    assert.equal(summary([ok, unreachable], true).state, "unreachable");
    assert.equal(summary([ok, unreachable], true).fails, false);
    assert.equal(summary([unreachable, missing], true).fails, true);
    assert.equal(summary([unreachable, wrong], false).state, "wrong");
  });
});

describe("findIframedHosts", () => {
  test("finds iframes that load a zone host", () => {
    const found = findIframedHosts(
      {
        "a.md": `<iframe width="100%" src="${BALLOT_HOST}/us/ballot-measures-2026"></iframe>`,
        "b.md": `<IFRAME src='https://cliff-watch.vercel.app/'></IFRAME>`,
        "c.md": `<iframe src="https://other.vercel.app/x"></iframe> [link](https://cliff-watch.vercel.app/)`,
        "d.md": `<iframe src="not a url"></iframe>`,
      },
      new Set(["ballot-measures-2026.vercel.app", "cliff-watch.vercel.app"]),
    );
    assert.deepEqual(found, [
      { file: "a.md", host: "ballot-measures-2026.vercel.app" },
      { file: "b.md", host: "cliff-watch.vercel.app" },
    ]);
  });
});

describe("DIRECT_HOST_REDIRECTS", () => {
  test("lists only zones on a Vercel host, once each", async () => {
    const zones = new Set(
      zoneRoutes(await loadRewrites()).map((zone) => zone.source),
    );
    assert.equal(
      new Set(DIRECT_HOST_REDIRECTS).size,
      DIRECT_HOST_REDIRECTS.length,
    );
    for (const source of DIRECT_HOST_REDIRECTS) {
      assert.ok(zones.has(source), `${source} isn't a zone on a Vercel host`);
    }
  });
});

describe("main", () => {
  async function quietly(fn) {
    const { log, error } = console;
    const lines = [];
    console.log = (line) => lines.push(String(line));
    console.error = (line) => lines.push(String(line));
    try {
      return { code: await fn(), output: lines.join("\n") };
    } finally {
      console.log = log;
      console.error = error;
    }
  }

  function fixture(articles = {}) {
    const dir = mkdtempSync(join(tmpdir(), "zone-direct-hosts-"));
    const routesFile = join(dir, "appZoneRoutes.mjs");
    writeFileSync(
      routesFile,
      `export const appZoneRewrites = ${JSON.stringify([
        ...withDeep("/us/ballot-measures-2026", BALLOT.destination),
        {
          source: "/us/static-page",
          destination: "/assets/static-page/index.html",
        },
      ])};`,
    );
    for (const [name, text] of Object.entries(articles)) {
      writeFileSync(join(dir, name), text);
    }
    return { dir, argv: ["--routes-file", routesFile, "--articles-dir", dir] };
  }

  async function run(table, options = {}, articles = {}) {
    const { dir, argv } = fixture(articles);
    const fetchImpl = fakeFetch(table);
    try {
      const result = await quietly(() =>
        main(argv, { fetchImpl, ...noWait, ...options }),
      );
      return { ...result, calls: fetchImpl.calls };
    } finally {
      rmSync(dir, { recursive: true });
    }
  }

  const [ROOT, DEEP] = probeUrls(BALLOT).map(({ url }) => url);
  const toPublic = (url) => url.replace(BALLOT_HOST, PUBLIC_ORIGIN);
  const redirecting = {
    [ROOT]: permanent(toPublic(ROOT)),
    [toPublic(ROOT)]: page,
    [DEEP]: permanent(toPublic(DEEP)),
  };
  const listed = { directHostRedirects: [BALLOT.source] };

  test("passes zones that don't redirect yet, and probes only Vercel hosts", async () => {
    const { code, calls, output } = await run({ [ROOT]: page });
    assert.equal(code, 0);
    assert.ok(
      calls.every((url) => url.startsWith(BALLOT_HOST)),
      calls.join(),
    );
    assert.match(output, /MISSING \/us\/ballot-measures-2026/);
    assert.match(output, /ballot-measures-2026\.vercel\.app\): 200, 404/);
  });

  test("passes a zone that redirects, listed or not, and asks to list it", async () => {
    const unlisted = await run(redirecting);
    assert.equal(unlisted.code, 0);
    assert.match(unlisted.output, /aren't in DIRECT_HOST_REDIRECTS yet/);
    assert.equal((await run(redirecting, listed)).code, 0);
  });

  test("fails a listed zone that stopped redirecting at either path", async () => {
    assert.equal((await run({ [ROOT]: page }, listed)).code, 1);
    const deepOnly = { ...redirecting, [DEEP]: { status: 404 } };
    const result = await run(deepOnly, listed);
    assert.equal(result.code, 1);
    assert.match(result.output, /no longer redirects/);
  });

  test("fails a listed source with no zone", async () => {
    const result = await run(redirecting, {
      directHostRedirects: [BALLOT.source, "/us/not-a-zone"],
    });
    assert.equal(result.code, 1);
  });

  test("reports an unreachable zone without failing, listed or not", async () => {
    for (const options of [{}, listed]) {
      const result = await run(
        { [ROOT]: { throws: "fetch failed" }, [DEEP]: { status: 503 } },
        options,
      );
      assert.equal(result.code, 0);
      assert.match(result.output, /UNREACHABLE/);
    }
  });

  test("fails a redirect to a 404", async () => {
    const result = await run({
      ...redirecting,
      [toPublic(ROOT)]: { status: 404 },
    });
    assert.equal(result.code, 1);
    assert.match(result.output, /FAIL \/us\/ballot-measures-2026/);
  });

  test("warns, without failing, about an article or notebook that iframes a zone host", async () => {
    const iframe = `<iframe src="${BALLOT.destination}"></iframe>`;
    const notebook = JSON.stringify({
      cells: [{ cell_type: "markdown", source: [iframe] }],
    });
    for (const articles of [
      { "post.md": iframe },
      { "post.ipynb": notebook },
    ]) {
      const result = await run(redirecting, {}, articles);
      assert.equal(result.code, 0);
      assert.match(result.output, /iframe a zone's Vercel host/);
      assert.match(result.output, /post\.(md|ipynb): ballot-measures-2026/);
    }
  });
});
