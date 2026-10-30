import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";

import {
  canonicalUrls,
  compileSource,
  decodeAs,
  DIRECT_HOST_REDIRECTS,
  encodingFor,
  findIframedHosts,
  isProductionVercelHost,
  isUnreachableStatus,
  loadRewrites,
  main,
  pageEncoding,
  PROBE_PARAM,
  probeDirectHost,
  probeUrls,
  proxiedUrl,
  PUBLIC_ORIGIN,
  publicUrlFor,
  readCanonicalUrls,
  readPage,
  redirectKeepsPage,
  summarizeRoute,
  unreadableHeaders,
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
 * A response is `{ status, location, body }` (or `bytes` for the body,
 * `contentType`, by default text/html in UTF-8 (null sends none), and other
 * `headers` by lower-case name), `{ throws }`, or a list of these
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
    const headers = {
      location: entry.location,
      "content-type":
        entry.contentType === undefined
          ? "text/html; charset=utf-8"
          : entry.contentType,
      ...entry.headers,
    };
    return {
      status: entry.status,
      headers: { get: (name) => headers[name] ?? null },
      arrayBuffer: async () =>
        entry.bytes ?? new TextEncoder().encode(entry.body ?? ""),
    };
  };
  return Object.assign(impl, { calls });
}

const permanent = (location) => ({ status: 308, location });
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

  test("with the rewrites, names the public URL that proxies to each probe", () => {
    const named = (source) =>
      probeUrls(ZONES[source], REWRITES).map(({ url, publicUrl }) => [
        url,
        publicUrl,
      ]);
    assert.deepEqual(named("/us/ballot-measures-2026"), [
      [
        `${BALLOT_HOST}/us/ballot-measures-2026?${PROBE_PARAM}=1`,
        `${PUBLIC_ORIGIN}/us/ballot-measures-2026?${PROBE_PARAM}=1`,
      ],
      [
        `${BALLOT_HOST}/us/ballot-measures-2026/direct-host-audit?${PROBE_PARAM}=1`,
        `${PUBLIC_ORIGIN}/us/ballot-measures-2026/direct-host-audit?${PROBE_PARAM}=1`,
      ],
    ]);
    // /us/pe84 proxies to /us/pe84/calculator, and /us/pe84/:path* to /us/pe84/:path*.
    assert.deepEqual(named("/us/pe84"), [
      [
        `https://april-fools-2026-two.vercel.app/us/pe84/calculator?${PROBE_PARAM}=1`,
        `${PUBLIC_ORIGIN}/us/pe84?${PROBE_PARAM}=1`,
      ],
      [
        `https://april-fools-2026-two.vercel.app/us/pe84/direct-host-audit?${PROBE_PARAM}=1`,
        `${PUBLIC_ORIGIN}/us/pe84/direct-host-audit?${PROBE_PARAM}=1`,
      ],
    ]);
    // The UK view's own route names it, though the US route also proxies there.
    assert.deepEqual(
      named("/uk/marriage").map(([, publicUrl]) => publicUrl),
      [
        `${PUBLIC_ORIGIN}/uk/marriage?${PROBE_PARAM}=1`,
        `${PUBLIC_ORIGIN}/uk/marriage/direct-host-audit?${PROBE_PARAM}=1`,
      ],
    );
    // The year in review has no deep rewrite under its route, so its second
    // probe's public URL comes from the asset route that serves it.
    assert.deepEqual(named("/us/2025-year-in-review"), [
      [
        `https://policyengine-2025-year-in-review.vercel.app/2025-year-in-review/us?${PROBE_PARAM}=1`,
        `${PUBLIC_ORIGIN}/us/2025-year-in-review?${PROBE_PARAM}=1`,
      ],
      [
        `https://policyengine-2025-year-in-review.vercel.app/2025-year-in-review/us/direct-host-audit?${PROBE_PARAM}=1`,
        `${PUBLIC_ORIGIN}/2025-year-in-review/us/direct-host-audit?${PROBE_PARAM}=1`,
      ],
    ]);
  });
});

describe("publicUrlFor", () => {
  test("runs each rewrite backwards and keeps a URL that proxies back", () => {
    const cases = [
      [
        `${BALLOT_HOST}/us/ballot-measures-2026/x?a=1`,
        `${PUBLIC_ORIGIN}/us/ballot-measures-2026/x?a=1`,
      ],
      [
        "https://cliff-watch.vercel.app/benefits",
        `${PUBLIC_ORIGIN}/us/cliffwatch/benefits`,
      ],
      [
        "https://april-fools-2026-two.vercel.app/us/pe84/calculator",
        `${PUBLIC_ORIGIN}/us/pe84`,
      ],
      [
        "https://policyengine-2025-year-in-review.vercel.app/2025-year-in-review/us/x",
        `${PUBLIC_ORIGIN}/2025-year-in-review/us/x`,
      ],
      // The shared host's US rule serves its UK view too, query and all.
      [
        "https://marriage-zeta-beryl.vercel.app/us/marriage?country=uk",
        `${PUBLIC_ORIGIN}/us/marriage?country=uk`,
      ],
    ];
    for (const [zoneUrl, expected] of cases) {
      assert.equal(publicUrlFor(REWRITES, zoneUrl), expected, zoneUrl);
    }
  });

  test("skips a URL that an earlier rewrite sends elsewhere", () => {
    const shadowed = [
      { source: "/a/special", destination: "https://other.vercel.app/x" },
      { source: "/a/:path*", destination: "https://z.vercel.app/:path*" },
    ];
    assert.equal(publicUrlFor(shadowed, "https://z.vercel.app/special"), null);
    assert.equal(
      publicUrlFor(shadowed, "https://z.vercel.app/plain"),
      `${PUBLIC_ORIGIN}/a/plain`,
    );
  });

  test("finds nothing for a host or path no rewrite serves", () => {
    assert.equal(publicUrlFor(REWRITES, "https://other.vercel.app/x"), null);
    assert.equal(publicUrlFor(REWRITES, `${BALLOT_HOST}/somewhere-else`), null);
  });

  test("names a URL that proxies to the zone URL, for every zone URL it names one for", () => {
    const random = mulberry32(20261031);
    for (const zone of zoneRoutes(REWRITES)) {
      for (let i = 0; i < 50; i += 1) {
        const { suffix, search } = randomSuffixAndQuery(random);
        const zoneUrl = new URL(zone.destination);
        zoneUrl.pathname =
          `${zoneUrl.pathname.replace(/\/$/, "")}${suffix}` || "/";
        for (const [key, value] of new URLSearchParams(search)) {
          zoneUrl.searchParams.append(key, value);
        }
        const found = publicUrlFor(REWRITES, zoneUrl.toString());
        const label = `seed 20261031 ${zone.source} case ${i}: ${zoneUrl}`;
        assert.ok(found, label);
        const back = new URL(proxiedUrl(REWRITES, found).url);
        assert.equal(back.host, zoneUrl.host, label);
        assert.equal(
          back.pathname.replace(/\/$/, ""),
          zoneUrl.pathname.replace(/\/$/, ""),
          label,
        );
        assert.deepEqual(
          [...back.searchParams].map(String).sort(),
          [...zoneUrl.searchParams].map(String).sort(),
          label,
        );
      }
    }
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

  test("tells apart queries whose decoded keys and values join the same way", () => {
    assert.equal(
      keeps(
        `${BALLOT_HOST}/us/ballot-measures-2026?a=b%3Dc`,
        `${PUBLIC_ORIGIN}/us/ballot-measures-2026?a%3Db=c`,
      ).ok,
      false,
    );
  });

  test("rejects a zone path that policyengine.org serves from its own icons", async () => {
    const withIcons = await loadRewrites(undefined, undefined);
    const givecalc = zoneRoutes(withIcons).find(
      (zone) => zone.source === "/us/givecalc",
    );
    const host = new URL(givecalc.destination).origin;
    const result = redirectKeepsPage(
      withIcons,
      `${host}/us/givecalc/favicon.ico`,
      `${PUBLIC_ORIGIN}/us/givecalc/favicon.ico`,
    );
    assert.equal(result.ok, false);
    assert.match(result.reason, /teal-square\.png/);
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
        { kind: "canonical", url: `${PUBLIC_ORIGIN}/y` },
        { kind: "og:url", url: "https://b.vercel.app/" },
      ],
    );
  });

  test("resolves protocol-relative, encoded and <base>-relative URLs against the page", () => {
    const page = `${PUBLIC_ORIGIN}/us/ballot-measures-2026`;
    const named = (html) =>
      canonicalUrls(html, page).map(({ kind, url }) => [kind, url]);
    assert.deepEqual(
      named(
        `<link rel="canonical" href="//ballot-measures-2026.vercel.app/us/x">`,
      ),
      [["canonical", "https://ballot-measures-2026.vercel.app/us/x"]],
    );
    assert.deepEqual(
      named(
        `<meta property="og:url" content="https&colon;//ballot-measures-2026.vercel.app/us/x">`,
      ),
      [["og:url", "https://ballot-measures-2026.vercel.app/us/x"]],
    );
    assert.deepEqual(
      named(`<link rel="canonical" href="https&#58;&#x2F;/a.vercel.app/x">`),
      [["canonical", "https://a.vercel.app/x"]],
    );
    assert.deepEqual(
      named(
        `<base href="https://ballot-measures-2026.vercel.app/us/"><link rel="canonical" href="x">`,
      ),
      [["canonical", "https://ballot-measures-2026.vercel.app/us/x"]],
    );
    assert.deepEqual(named(`<link title="a > b" rel=canonical href=/us/x>`), [
      ["canonical", `${PUBLIC_ORIGIN}/us/x`],
    ]);
    assert.deepEqual(
      named(
        `<link rel="canonical" href="/us/first" href="https://a.vercel.app/x"><META PROPERTY="OG:URL" CONTENT="/us/y">`,
      ),
      [
        ["canonical", `${PUBLIC_ORIGIN}/us/first`],
        ["og:url", `${PUBLIC_ORIGIN}/us/y`],
      ],
    );
  });

  test("skips comments, scripts and other text that isn't markup", () => {
    const old = `<link rel="canonical" href="https://a.vercel.app/x">`;
    for (const html of [
      `<!-- ${old} -->`,
      `<script>document.write('${old}')</script>`,
      `<template>${old}</template>`,
      `<title>${old}</title>`,
      `<textarea>${old}</textarea>`,
      `<style>/* ${old} */</style>`,
    ]) {
      assert.deepEqual(canonicalUrls(html), [], html);
    }
    assert.equal(canonicalUrls(`<!-- old --> ${old}`).length, 1);
  });

  test("reads markup as HTML does, not as text", () => {
    const old = `<link rel="canonical" href="https://a.vercel.app/x">`;
    // Comment- and script-like text inside an attribute doesn't hide what follows.
    for (const before of [
      `<div title="<!--"></div>`,
      `<div title="<script>"></div>`,
    ]) {
      assert.deepEqual(
        canonicalUrls(`${before}${old}`).map(({ url }) => url),
        ["https://a.vercel.app/x"],
        before,
      );
    }
    // Inside nested templates, or as an attribute's text, it isn't a link.
    for (const html of [
      `<template><template></template>${old}</template>`,
      `<div data-x='${old}'></div>`,
    ]) {
      assert.deepEqual(canonicalUrls(html), [], html);
    }
  });

  test("matches rel and property in any case", () => {
    assert.deepEqual(
      canonicalUrls(
        `<link rel="Canonical" href="https://a.vercel.app/x"><meta property="OG:URL" content="https://b.vercel.app/y">`,
      ).map(({ kind, url }) => [kind, url]),
      [
        ["canonical", "https://a.vercel.app/x"],
        ["og:url", "https://b.vercel.app/y"],
      ],
    );
  });

  test("skips a value that isn't a URL and reads the rest", () => {
    assert.deepEqual(
      canonicalUrls(
        `<link rel="canonical" href="https://[bad"><meta property="og:url" content="https://a.vercel.app/x">`,
      ).map(({ url }) => url),
      ["https://a.vercel.app/x"],
    );
  });

  test("reads <noscript> as a browser with scripting on does: as text", () => {
    const urls = (html) => canonicalUrls(html).map(({ url }) => url);
    // Inside it, link-shaped text is inert, and a <base> doesn't count.
    assert.deepEqual(
      urls(
        `<head><noscript><link rel="canonical" href="https://a.vercel.app/x"></noscript></head>`,
      ),
      [],
    );
    assert.deepEqual(
      urls(
        `<head><noscript><base href="https://a.vercel.app/"></noscript><link rel="canonical" href="/x"></head>`,
      ),
      [`${PUBLIC_ORIGIN}/x`],
    );
    // A <style> inside it doesn't hide what follows.
    assert.deepEqual(
      urls(
        `<head><noscript><style></noscript><link rel="canonical" href="https://b.vercel.app/y"></head>`,
      ),
      ["https://b.vercel.app/y"],
    );
    // Nor in the body.
    assert.deepEqual(
      urls(
        `<body><noscript><link rel="canonical" href="https://a.vercel.app/x"></noscript></body>`,
      ),
      [],
    );
  });

  test("counts only HTML elements, not SVG or MathML ones", () => {
    for (const wrapper of ["svg", "math"]) {
      assert.deepEqual(
        canonicalUrls(
          `<${wrapper}><link rel="canonical" href="https://a.vercel.app/x" /><base href="https://a.vercel.app/" /></${wrapper}><link rel="canonical" href="/y">`,
        ).map(({ url }) => url),
        [`${PUBLIC_ORIGIN}/y`],
        wrapper,
      );
      // A <meta> start tag ends SVG or MathML content, so it's HTML, as in a
      // browser.
      assert.deepEqual(
        canonicalUrls(
          `<${wrapper}><meta property="og:url" content="https://a.vercel.app/x"></${wrapper}>`,
        ).map(({ url }) => url),
        ["https://a.vercel.app/x"],
        wrapper,
      );
    }
    // HTML inside SVG's foreignObject is HTML again.
    assert.deepEqual(
      canonicalUrls(
        `<svg><foreignObject><link rel="canonical" href="https://a.vercel.app/x"></foreignObject></svg>`,
      ).map(({ url }) => url),
      ["https://a.vercel.app/x"],
    );
  });

  test("resolves against the first <base> with an href, or the page's URL", () => {
    const urls = (html) => canonicalUrls(html).map(({ url }) => url);
    assert.deepEqual(
      urls(
        `<base target="_top"><base href="https://a.vercel.app/dir/"><base href="https://b.example/"><link rel="canonical" href="x">`,
      ),
      ["https://a.vercel.app/dir/x"],
    );
    // A <base> later in the page still counts, and one that isn't a URL
    // leaves the page's URL.
    assert.deepEqual(
      urls(
        `<link rel="canonical" href="x"><body><base href="https://a.vercel.app/">`,
      ),
      ["https://a.vercel.app/x"],
    );
    assert.deepEqual(
      urls(`<base href="https://[bad"><link rel="canonical" href="x">`),
      [`${PUBLIC_ORIGIN}/x`],
    );
  });

  test("ignores a data: or javascript: <base>, as the HTML standard does", () => {
    for (const href of [
      "javascript:void(0)",
      "data:text/plain,x",
      "JavaScript:x",
    ]) {
      assert.deepEqual(
        canonicalUrls(
          `<base href="${href}"><link rel="canonical" href="//a.vercel.app/x"><meta property="og:url" content="//b.vercel.app/y">`,
        ).map(({ url }) => url),
        ["https://a.vercel.app/x", "https://b.vercel.app/y"],
        href,
      );
    }
  });

  test("reads a deeply nested page without overflowing the stack", () => {
    const deep = (depth, inner) =>
      `${"<div>".repeat(depth)}${inner}${"</div>".repeat(depth)}`;
    assert.deepEqual(
      canonicalUrls(
        deep(5000, `<link rel="canonical" href="https://a.vercel.app/x">`),
      ).map(({ url }) => url),
      ["https://a.vercel.app/x"],
    );
  });

  test("decodes every character reference, and survives invalid ones", () => {
    // URL parsing drops the tab that &Tab; decodes to.
    assert.deepEqual(
      canonicalUrls(
        `<link rel="canonical" href="https&Tab;://ballot-measures-2026.vercel.app/us/x">`,
      ).map(({ url }) => url),
      ["https://ballot-measures-2026.vercel.app/us/x"],
    );
    assert.deepEqual(
      canonicalUrls(
        `<link rel="canonical" title="&#1114112;" href="${PUBLIC_ORIGIN}/us/x">`,
      ).map(({ url }) => url),
      [`${PUBLIC_ORIGIN}/us/x`],
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

/** Bytes from ASCII text and byte lists, in order. */
const bytesOf = (...parts) =>
  new Uint8Array(
    parts.flatMap((part) =>
      typeof part === "string" ? [...new TextEncoder().encode(part)] : part,
    ),
  );
const utf16 = (text, littleEndian) => {
  const bytes = new Uint8Array(text.length * 2);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < text.length; i += 1) {
    view.setUint16(i * 2, text.charCodeAt(i), littleEndian);
  }
  return bytes;
};
// Between these escapes ISO-2022-JP reads the bytes of "<!--" as two kanji;
// every other encoding reads a comment that hides the rest of the page.
const JIS_X_0208 = [0x1b, 0x24, 0x42];
const BACK_TO_ASCII = [0x1b, 0x28, 0x42];
const VERCEL_CANONICAL = `<link rel="canonical" href="https://a.vercel.app/x">`;

// Every encoding in the Encoding Standard, by name.
const ENCODINGS = [
  "utf-8",
  "ibm866",
  "iso-8859-2",
  "iso-8859-3",
  "iso-8859-4",
  "iso-8859-5",
  "iso-8859-6",
  "iso-8859-7",
  "iso-8859-8",
  "iso-8859-8-i",
  "iso-8859-10",
  "iso-8859-13",
  "iso-8859-14",
  "iso-8859-15",
  "iso-8859-16",
  "koi8-r",
  "koi8-u",
  "macintosh",
  "windows-874",
  "windows-1250",
  "windows-1251",
  "windows-1252",
  "windows-1253",
  "windows-1254",
  "windows-1255",
  "windows-1256",
  "windows-1257",
  "windows-1258",
  "x-mac-cyrillic",
  "gbk",
  "gb18030",
  "big5",
  "euc-jp",
  "iso-2022-jp",
  "shift_jis",
  "euc-kr",
  "replacement",
  "utf-16be",
  "utf-16le",
  "x-user-defined",
];

describe("encodingFor", () => {
  test("knows every encoding in the Encoding Standard by its name", () => {
    // This Node needs full ICU, as the official builds have.
    for (const name of ENCODINGS) assert.equal(encodingFor(name), name);
  });

  test("resolves a label as the standard does, and nothing else", () => {
    const cases = [
      [" Latin1\n", "windows-1252"],
      ["ISO-8859-1", "windows-1252"],
      ["utf8", "utf-8"],
      ["unicode", "utf-16le"],
      ["csiso2022kr", "replacement"],
      ["ISO-2022-KR", "replacement"],
      ["hz-gb-2312", "replacement"],
      ["no-such-thing", null],
      ["", null],
      ["utf 8", null],
      // Only ASCII whitespace trims, and only ASCII letters fold.
      ["\vutf-8", null],
      ["utf-8 ", null],
      ["Koi8-r", null],
    ];
    for (const [label, encoding] of cases) {
      assert.equal(encodingFor(label), encoding, JSON.stringify(label));
    }
  });
});

describe("pageEncoding", () => {
  const html = bytesOf(VERCEL_CANONICAL);

  test("reads a text/html page in the encoding its BOM or charset fixes", () => {
    const cases = [
      [html, "text/html; charset=utf-8", "utf-8"],
      [html, "text/html;charset=windows-1252", "windows-1252"],
      [html, "text/html;charset=latin1", "windows-1252"],
      [html, "text/html;charset=x-user-defined", "x-user-defined"],
      [html, "text/html;charset=iso-2022-kr", "replacement"],
      [html, 'text/html;profile=";charset=utf-16le";charset=utf-8', "utf-8"],
      [html, 'text/html;charset="utf\\-16le"', "utf-16le"],
      // One value, read as the MIME Sniffing standard says.
      [html, "Text/HTML; Charset=KOI8-R", "koi8-r"],
      [html, 'text/html;charset="koi8-r', "koi8-r"],
      [html, "text/html;charset=koi8-r;charset=utf-8", "koi8-r"],
      [html, 'text/html;x="a,b";charset=koi8-r', "koi8-r"],
      [html, 'text/html;x="a\\",b";charset=koi8-r', "koi8-r"],
      // A byte-order mark wins over the charset, and needs none.
      [bytesOf([0xef, 0xbb, 0xbf]), "text/html", "utf-8"],
      [bytesOf([0xff, 0xfe]), "text/html;charset=utf-8", "utf-16le"],
      [bytesOf([0xfe, 0xff]), "text/html;charset=utf-8", "utf-16be"],
      // Only a whole mark counts.
      [bytesOf([0xef, 0xbb, 0x41]), "text/html;charset=koi8-r", "koi8-r"],
      [bytesOf([0xfe, 0x41]), "text/html;charset=koi8-r", "koi8-r"],
      [bytesOf([0xff, 0x41]), "text/html;charset=koi8-r", "koi8-r"],
    ];
    for (const [bytes, contentType, encoding] of cases) {
      assert.deepEqual(
        pageEncoding(bytes, contentType),
        { encoding },
        contentType,
      );
    }
  });

  test("reads every encoding whose Node decoder follows the standard", () => {
    const nonstandard = [
      "big5",
      "euc-jp",
      "euc-kr",
      "iso-2022-jp",
      "shift_jis",
    ];
    for (const name of ENCODINGS) {
      const reading = pageEncoding(html, `text/html; charset=${name}`);
      if (nonstandard.includes(name)) {
        assert.match(reading.unreadable, /doesn't decode/, name);
      } else {
        assert.deepEqual(reading, { encoding: name }, name);
      }
    }
  });

  test("won't read a page browsers could read another way", () => {
    const cases = [
      // No type, or a type that isn't text/html: browsers guess, read XML or
      // show text.
      [html, null, /has no Content-Type/],
      [html, "", /names no MIME type/],
      [html, "nonsense", /names no MIME type/],
      [html, "*/*", /it's \*\/\*, not text\/html/],
      [
        html,
        "application/xhtml+xml; charset=utf-8",
        /application\/xhtml\+xml, not text\/html/,
      ],
      [html, "text/plain; charset=utf-8", /text\/plain, not text\/html/],
      // Several values: Fetch keeps the first charset since the type last
      // changed, Chromium and Firefox the last one given.
      [html, "text/html; charset=utf-8, text/plain", /has 2 values/],
      [html, "text/html;charset=koi8-r, text/html", /has 2 values/],
      [html, "text/html, text/html;charset=koi8-r", /has 2 values/],
      [
        html,
        "text/html; charset=utf-8, text/html; charset=utf-16le, text/html",
        /has 3 values/,
      ],
      [html, "text/html;charset=koi8-r, */*", /has 2 values/],
      [html, "text/html; charset=utf-8, ", /has 2 values/],
      [bytesOf([0xef, 0xbb, 0xbf]), "text/plain", /text\/plain/],
      // No encoding fixed: browsers find one in the page or guess.
      [html, "text/html", /neither a byte-order mark nor/],
      [bytesOf("<meta charset=utf-8>"), "text/html", /neither/],
      [html, "text/html;charset=no-such-thing", /neither/],
      // Node's decoders for these read some bytes as browsers don't.
      [html, "text/html;charset=iso-2022-jp", /iso-2022-jp/],
      [html, "text/html;charset=csiso2022jp", /iso-2022-jp/],
      [html, "text/html;charset=sjis", /shift_jis/],
      [html, "text/html;charset=big5-hkscs", /big5/],
      [html, "text/html;charset=ks_c_5601-1987", /euc-kr/],
      [html, "text/html;charset=x-euc-jp", /euc-jp/],
    ];
    for (const [bytes, contentType, reason] of cases) {
      const reading = pageEncoding(bytes, contentType);
      assert.equal(reading.encoding, undefined, String(contentType));
      assert.match(reading.unreadable, reason, String(contentType));
    }
  });
});

describe("unreadableHeaders", () => {
  const plain = {
    "content-type": "text/html; charset=utf-8",
    "content-security-policy": null,
    refresh: null,
    link: null,
  };

  test("reads a page whose headers don't change how browsers read it", () => {
    for (const headers of [
      {},
      // /us/qbi-calculator's policy (2026-10-30).
      {
        "content-security-policy":
          "frame-ancestors 'self' https://policyengine.org https://*.policyengine.org",
      },
      // Blocking scripts leaves scripting on, so the parse is the same.
      { "content-security-policy": "script-src 'none'" },
      { "content-security-policy": "sandboxed; base-urls" },
      { "content-security-policy": "default-src 'self' sandbox" },
      // The 2025 year in review's preload link.
      {
        link: '<https://raw.githubusercontent.com/x/white.png>; rel=preload; as="image"',
      },
      { link: '</canonical.css>; rel="preload"; as="style"' },
      { link: '</x?rel=canonical;y=1>; rel="preload"; as="style"' },
      { link: '</a.css>; rel=preload; title="canonical"' },
      { link: '</a.css>; rel="preload canonicalish"' },
      // Parameters, not text, say what a link is.
      { link: '</a.css>; rel=preload; title="rel=canonical"' },
      { link: "</a.css>; rel=preload; x-rel=canonical" },
      { link: '</a.css>; title="<"; rel=preload; x=">"' },
      { link: '</a.css>; rel="pre\\load", </b.css>; rel=preload,' },
      { link: "" },
      { link: "</a.css>; rel=preload, </canonical.css>; rel=preload" },
      { link: "</a.css> ; rel=preload ; as=style , </b.css>;rel=preload" },
      { link: '</a.css>; rel = preload; as= "style"; title ="x"' },
      { link: '</a.css>; rel= "preload"' },
      // Next's own header for a high-priority image: a filename's spaces stay.
      {
        link: '</assets/ballot measures 2026.png>; rel=preload; as="image"; fetchpriority="high"',
      },
      {
        link: '</a.png>; rel=preload; as="image"; imagesrcset="/a.png 1x, /b.png 2x"; imagesizes="(max-width: 600px) 100vw, 50vw"',
      },
      // Hand-written headers leave these unquoted, or end in a semicolon.
      {
        link: "</a.woff2>; rel=preload; as=font; type=font/woff2; crossorigin",
      },
      { link: "</a.css>; rel=preload; integrity=sha384-ab+/=" },
      { link: "</a.css>; rel=preload;" },
      { link: "</a.css>; rel=preload; ; as=style" },
      { link: "</a.css>;, </b.css>; rel=preload" },
      // /us/marriage's font preload.
      {
        link: '</a.woff2?dpl=dpl_x>; rel=preload; as="font"; crossorigin=""; type="font/woff2"',
      },
    ]) {
      assert.equal(
        unreadableHeaders({ ...plain, ...headers }),
        null,
        JSON.stringify(headers),
      );
    }
  });

  test("won't read a page whose headers change how browsers read it", () => {
    for (const [headers, reason] of [
      // A sandbox turns scripting off, so <noscript> holds elements.
      [{ "content-security-policy": "sandbox" }, /sets sandbox or base-uri/],
      [
        {
          "content-security-policy": "default-src 'self'; Sandbox allow-forms",
        },
        /sets sandbox or base-uri/,
      ],
      // A blocked <base> leaves the page's URL as the base.
      [
        { "content-security-policy": "base-uri 'none'" },
        /sets sandbox or base-uri/,
      ],
      [
        { "content-security-policy": "  BASE-URI\t'self';" },
        /sets sandbox or base-uri/,
      ],
      // Two policies, as headers.get joins two headers.
      [
        {
          "content-security-policy": "frame-ancestors 'self', base-uri 'none'",
        },
        /sets sandbox or base-uri/,
      ],
      [{ refresh: "0; url=https://a.vercel.app/x" }, /Refresh/],
      [
        { link: '<https://a.vercel.app/x>; rel="canonical"' },
        /Link header names a canonical/,
      ],
      [
        {
          link: "</a.css>; rel=preload, <https://a.vercel.app/x>; rel=CANONICAL",
        },
        /Link header names a canonical/,
      ],
      [
        { link: '<https://a.vercel.app/x>; REL = "alternate canonical"' },
        /Link header names a canonical/,
      ],
      // The ninth review's cases: a quoted pair, and a rel between
      // quoted angle brackets.
      [
        { link: '<https://a.vercel.app/x>; rel="canoni\\cal"' },
        /Link header names a canonical/,
      ],
      [
        { link: '<https://a.vercel.app/x>; title="<"; rel=canonical; x=">"' },
        /Link header names a canonical/,
      ],
      [
        {
          link: '</a.css>; rel=preload, <https://a.vercel.app/x>; rel="canoni\\cal"',
        },
        /Link header names a canonical/,
      ],
      [
        { link: '<https://a.vercel.app/x>; title="a, b; c"; rel=canonical' },
        /Link header names a canonical/,
      ],
      // A later rel, which RFC 8288 says to ignore, still counts.
      [
        { link: "<https://a.vercel.app/x>; rel=preload; rel=canonical" },
        /Link header names a canonical/,
      ],
      [
        { link: "<https://a.vercel.app/x>; rel*=UTF-8''canonical" },
        /Link header names a canonical/,
      ],
      // Spaces around the separators, and a parameter before the rel.
      [
        { link: '<https://a.vercel.app/x> ; rel="canoni\\cal"' },
        /Link header names a canonical/,
      ],
      [
        { link: '<https://a.vercel.app/x>; rel = "canoni\\cal"' },
        /Link header names a canonical/,
      ],
      [
        { link: '<https://a.vercel.app/x>; rel= "canonical"' },
        /Link header names a canonical/,
      ],
      [
        { link: '<https://a.vercel.app/x>; title="a"; rel="canoni\\cal"' },
        /Link header names a canonical/,
      ],
      [
        { link: "<https://a.vercel.app/x>; rel*=UTF-8''%63anonical" },
        /Link header names a canonical/,
      ],
      [
        { link: '<https://a.vercel.app/x>; rel="alternate\fcanonical"' },
        /Link header names a canonical/,
      ],
      // A field it can't parse counts however it's spelled, since a valid
      // link can follow the broken one and browsers recover differently.
      [{ link: "nonsense" }, /won't parse/],
      [{ link: '</a.css>; title="preload' }, /won't parse/],
      [
        { link: 'nonsense, <https://a.vercel.app/x>; rel="canoni\\cal"' },
        /won't parse/,
      ],
      [
        {
          link: '</a.css>; title="x"junk, <https://a.vercel.app/x>; rel="canoni\\cal"',
        },
        /won't parse/,
      ],
      [
        { link: "nonsense, <https://a.vercel.app/x>; rel*=UTF-8''%63anonical" },
        /won't parse/,
      ],
      [
        {
          link: '</a.css>; title="x, <https://a.vercel.app/x>; rel="canoni\\cal"',
        },
        /won't parse/,
      ],
      [{ link: '<https://a.vercel.app/x>; r el="canoni\\cal"' }, /won't parse/],
      [
        { link: '<https://a.vercel.app/x>; r\fel="canoni\\cal"' },
        /won't parse/,
      ],
      [
        { link: '<https://a.vercel.app/x>; \u00a0rel="canoni\\cal"' },
        /won't parse/,
      ],
      [{ link: '<https://a.vercel.app/x>; rel="canoni\\cal' }, /won't parse/],
      [{ link: '<https://a.vercel.app/x>; rel="canoni\\cal\\' }, /won't parse/],
      [{ link: "<https://a.vercel.app/x>; rel=canoni\\cal" }, /won't parse/],
      [{ link: '<https://a.vercel.app/x>; rel=can"on"ical' }, /won't parse/],
      [{ link: "<https://a.vercel.app/x>; rel=" }, /won't parse/],
      [
        { link: "<https://a.vercel.app/x y>; ; rel=canonical" },
        /Link header names a canonical/,
      ],
      [{ link: "<https://a.vercel.app/x>; =canonical" }, /won't parse/],
      [{ link: "</a.css>; rel=preload x" }, /won't parse/],
      [{ link: ", <https://a.vercel.app/x>; rel=preload" }, /won't parse/],
      [{ link: "REL=CANONICAL" }, /Link header names a canonical/],
      [
        { link: "<https://a.vercel.app/x> rel=canonical" },
        /Link header names a canonical/,
      ],
      [
        { link: "<https://a.vercel.app/canonical>; x=1, nonsense" },
        /Link header names a canonical/,
      ],
      [{ link: "rel=canonical" }, /Link header names a canonical/],
      [
        { link: '<https://a.vercel.app/x>; rel="canonical"x' },
        /Link header names a canonical/,
      ],
      [
        { link: "<https://a.vercel.app/x; rel=canonical" },
        /Link header names a canonical/,
      ],
      [
        { link: '<https://a.vercel.app/x>; title="a; rel=canonical' },
        /Link header names a canonical/,
      ],
    ]) {
      assert.match(
        unreadableHeaders({ ...plain, ...headers }),
        reason,
        JSON.stringify(headers),
      );
    }
  });
});

describe("unreadableHeaders with a broken link first", () => {
  const plain = {
    "content-type": "text/html; charset=utf-8",
    "content-security-policy": null,
    refresh: null,
    link: null,
  };

  test("won't read any field that fails to parse, whatever follows", () => {
    for (const broken of [
      "nonsense",
      "<https://a.vercel.app/x",
      "<https://a.vercel.app/x<y>",
      '</a.css>; title="x"junk',
      "</a.css> junk",
      '</a.css>; title="x',
      "</a.css>; r el=preload",
    ]) {
      for (const rest of [
        "",
        ", </b.css>; rel=preload",
        ", <https://a.vercel.app/x>; rel=canonical",
        ', <https://a.vercel.app/x>; rel="canoni\\cal"',
        ", <https://a.vercel.app/x>; rel*=UTF-8''%63anonical",
      ]) {
        const link = `${broken}${rest}`;
        assert.match(
          unreadableHeaders({ ...plain, link }),
          /Link header names a canonical or won't parse/,
          link,
        );
      }
    }
  });
});

describe("readPage", () => {
  test("answers a page's canonicalUrls", () => {
    for (const html of [
      VERCEL_CANONICAL,
      `<meta property="og:url" content="/us/x">`,
      "",
    ]) {
      assert.deepEqual(readPage(html), { urls: canonicalUrls(html) }, html);
    }
  });

  test("won't read a page whose <meta> sets a policy or refreshes it", () => {
    for (const [html, reason] of [
      [
        `<meta http-equiv="Content-Security-Policy" content="base-uri 'none'"><base href="https://a.vercel.app/"><link rel="canonical" href="/us/x">`,
        /Content-Security-Policy/,
      ],
      [
        `<meta http-equiv=" content-security-policy " content="sandbox">`,
        /Content-Security-Policy/,
      ],
      [
        `<body><meta http-equiv=CONTENT-SECURITY-POLICY content="sandbox">`,
        /Content-Security-Policy/,
      ],
      [
        `<meta http-equiv="refresh" content="0; url=https://a.vercel.app/x">`,
        /refreshes it/,
      ],
      // A <meta> ends SVG, so this one is HTML and acts.
      [`<svg><meta http-equiv="refresh" content="0"></svg>`, /refreshes it/],
    ]) {
      const page = readPage(html);
      assert.equal(page.urls, undefined, html);
      assert.match(page.unreadable, reason, html);
    }
  });

  test("reads past metas that don't act", () => {
    for (const html of [
      `<template><meta http-equiv="refresh" content="0"></template>`,
      `<head><noscript><meta http-equiv="refresh" content="0"></noscript></head>`,
      `<!-- <meta http-equiv="refresh" content="0"> -->`,
      `<script>"<meta http-equiv=refresh content=0>"</script>`,
      `<meta name="refresh" content="0">`,
      `<div http-equiv="refresh" content="0"></div>`,
      `<meta http-equiv="content-type" content="text/html; charset=utf-8">`,
      `<meta http-equiv="content-security-policy" content="default-src 'self'">`,
    ]) {
      assert.deepEqual(readPage(html), { urls: [] }, html);
    }
  });
});

describe("readCanonicalUrls", () => {
  test("answers what canonicalUrls does, from a worker", async () => {
    for (const [bytes, encoding] of [
      [
        bytesOf(
          `<link rel="canonical" href="https://a.vercel.app/x"><meta property="og:url" content="/y">`,
        ),
        "utf-8",
      ],
      [
        bytesOf(
          `<noscript><link rel="canonical" href="https://a.vercel.app/x"></noscript>`,
        ),
        "utf-8",
      ],
      [utf16(VERCEL_CANONICAL, true), "utf-16le"],
      [
        bytesOf(
          '<link rel="canonical" href="https://caf',
          [0xe9],
          '.vercel.app/x">',
        ),
        "windows-1252",
      ],
      [bytesOf(VERCEL_CANONICAL), "replacement"],
      [bytesOf(""), "utf-8"],
    ]) {
      const expected = canonicalUrls(decodeAs(bytes, encoding), PUBLIC_ORIGIN);
      assert.deepEqual(
        await readCanonicalUrls(bytes, encoding, PUBLIC_ORIGIN),
        { urls: expected },
        encoding,
      );
    }
    // The cases above say something: these differ.
    assert.deepEqual(decodeAs(bytesOf(VERCEL_CANONICAL), "replacement"), "�");
    assert.deepEqual(
      canonicalUrls(
        decodeAs(
          bytesOf(
            '<link rel="canonical" href="https://caf',
            [0xe9],
            '.vercel.app/x">',
          ),
          "windows-1252",
        ),
      ),
      [{ kind: "canonical", url: "https://xn--caf-dma.vercel.app/x" }],
    );
  });

  test("answers only once its worker has stopped", async () => {
    // A worker still stopping holds a MessagePort open. Let any from earlier
    // tests close first.
    const ports = () =>
      process.getActiveResourcesInfo().filter((type) => type === "MessagePort")
        .length;
    await delay(200);
    const before = ports();
    await readCanonicalUrls(
      bytesOf("<div>".repeat(50_000)),
      "utf-8",
      PUBLIC_ORIGIN,
      {
        timeout: 100,
      },
    );
    assert.equal(ports(), before, "after a parse it stopped");
    await readCanonicalUrls(bytesOf("<p>"), "utf-8", PUBLIC_ORIGIN);
    assert.equal(ports(), before, "after a parse that finished");
  });

  test("stops a parse that runs past its time", async () => {
    // parse5 slows with depth: this takes seconds.
    const bytes = bytesOf(
      `${"<div>".repeat(50_000)}${"</div>".repeat(50_000)}`,
    );
    const started = Date.now();
    const read = await readCanonicalUrls(bytes, "utf-8", PUBLIC_ORIGIN, {
      timeout: 200,
    });
    const took = Date.now() - started;
    assert.match(read.error, /took over 200 ms/);
    assert.ok(took < 2000, `took ${took} ms with a 200 ms limit`);
  });

  test("answers why it won't read a page whose <meta> acts", async () => {
    const read = await readCanonicalUrls(
      bytesOf(`<meta http-equiv="refresh" content="0">${VERCEL_CANONICAL}`),
      "utf-8",
      PUBLIC_ORIGIN,
    );
    assert.deepEqual(read, {
      unreadable: "a <meta> refreshes it, which sends readers on",
    });
  });

  test("answers an error when it can't start the worker", async () => {
    // A function can't be copied to a worker.
    const read = await readCanonicalUrls(() => {}, "utf-8", PUBLIC_ORIGIN);
    assert.match(read.error, /could not be cloned/);
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

  test("compares the target with the last URL on the zone's host after a trailing-slash hop", async () => {
    const slashed = `${BALLOT_HOST}/us/ballot-measures-2026/?${PROBE_PARAM}=1`;
    const result = await probeDirectHost(REWRITES, slashed, {
      fetchImpl: fakeFetch({
        [slashed]: permanent(`/us/ballot-measures-2026?${PROBE_PARAM}=1`),
        [DIRECT]: permanent(PUBLIC),
        [PUBLIC]: page,
      }),
      ...noWait,
    });
    assert.equal(result.state, "ok", result.reason);
    assert.equal(result.sameHostHops, 1);
  });

  describe("a same-host redirect that changes the path", () => {
    // An unknown page that the zone sends to its home first, then to www.
    const unknown = `${BALLOT_HOST}/us/ballot-measures-2026/gone?${PROBE_PARAM}=1`;
    const publicUnknown = `${PUBLIC_ORIGIN}/us/ballot-measures-2026/gone?${PROBE_PARAM}=1`;
    const zoneTable = {
      [unknown]: permanent(`/us/ballot-measures-2026?${PROBE_PARAM}=1`),
      [DIRECT]: permanent(PUBLIC),
      [PUBLIC]: page,
    };
    const run = (table, options) =>
      probeDirectHost(REWRITES, unknown, {
        fetchImpl: fakeFetch(table),
        ...noWait,
        ...options,
      });

    test("passes when a reader of the public URL gets it too", async () => {
      // Proxied, the zone's redirect is relative, so it stays on www.
      const result = await run(
        {
          ...zoneTable,
          [publicUnknown]: permanent(
            `/us/ballot-measures-2026?${PROBE_PARAM}=1`,
          ),
        },
        { publicUrl: publicUnknown },
      );
      assert.equal(result.state, "ok", result.reason);
      assert.equal(result.sameHostHops, 1);
    });

    test("fails when only direct visits get it, so the deep page is lost", async () => {
      // The public URL serves the page (here a 404) without redirecting.
      const result = await run(
        { ...zoneTable, [publicUnknown]: { status: 404 } },
        { publicUrl: publicUnknown },
      );
      assert.equal(result.state, "wrong");
      assert.match(result.reason, /a reader of .*gone.* lands on .*gone/);
    });

    test("without a public URL, compares with the URL the reader asked for", async () => {
      const result = await run(zoneTable, {});
      assert.equal(result.state, "wrong");
      assert.match(result.reason, /redirects on its own host to/);
    });

    test("reports the public URL's failed request as unreachable", async () => {
      const result = await run(
        { ...zoneTable, [publicUnknown]: { throws: "fetch failed" } },
        { publicUrl: publicUnknown },
      );
      assert.equal(result.state, "unreachable");
    });

    test("reports the public URL behind Vercel's SSO as unreachable", async () => {
      for (const status of [302, 307]) {
        const login = "https://vercel.com/sso-api?url=x";
        const fetchImpl = fakeFetch({
          ...zoneTable,
          [publicUnknown]: { status, location: login },
        });
        const result = await probeDirectHost(REWRITES, unknown, {
          fetchImpl,
          ...noWait,
          publicUrl: publicUnknown,
        });
        assert.equal(
          result.state,
          "unreachable",
          `${status}: ${result.reason}`,
        );
        assert.match(
          result.reason,
          new RegExp(`answers ${status} to vercel\\.com`),
        );
        assert.ok(!fetchImpl.calls.includes(login), `fetched ${login}`);
      }
      // Not a permanent redirect there, though.
      const permanentLogin = await run(
        { ...zoneTable, [publicUnknown]: permanent("https://vercel.com/x") },
        { publicUrl: publicUnknown },
      );
      assert.equal(permanentLogin.state, "wrong");
    });

    test("fails a public URL whose Location isn't a URL", async () => {
      const result = await run(
        {
          ...zoneTable,
          [publicUnknown]: { status: 308, location: "http://[" },
        },
        { publicUrl: publicUnknown },
      );
      assert.equal(result.state, "wrong");
      assert.match(result.reason, /Location that isn't a URL/);
    });

    test("reports a challenge or an error on the public URL as unreachable", async () => {
      for (const status of [401, 403, 429, 503]) {
        const result = await run(
          { ...zoneTable, [publicUnknown]: { status } },
          { publicUrl: publicUnknown },
        );
        assert.equal(
          result.state,
          "unreachable",
          `${status}: ${result.reason}`,
        );
        assert.match(result.reason, new RegExp(`answers ${status}`));
      }
    });

    test("passes when the reader lands on another public URL for the same zone page", async () => {
      // The year in review: its deep page normalizes to its root on the zone
      // host. The direct visit is sent to the route, /us/2025-year-in-review;
      // a reader of the asset path lands on /2025-year-in-review/us. Both
      // proxy to the same zone URL.
      const year = "https://policyengine-2025-year-in-review.vercel.app";
      const deep = `${year}/2025-year-in-review/us/direct-host-audit?${PROBE_PARAM}=1`;
      const publicDeep = `${PUBLIC_ORIGIN}/2025-year-in-review/us/direct-host-audit?${PROBE_PARAM}=1`;
      const route = `${PUBLIC_ORIGIN}/us/2025-year-in-review?${PROBE_PARAM}=1`;
      const result = await probeDirectHost(REWRITES, deep, {
        fetchImpl: fakeFetch({
          [deep]: permanent(`/2025-year-in-review/us?${PROBE_PARAM}=1`),
          [`${year}/2025-year-in-review/us?${PROBE_PARAM}=1`]: permanent(route),
          [publicDeep]: permanent(`/2025-year-in-review/us?${PROBE_PARAM}=1`),
          [`${PUBLIC_ORIGIN}/2025-year-in-review/us?${PROBE_PARAM}=1`]: page,
          [route]: page,
        }),
        ...noWait,
        requirePage: false,
        publicUrl: publicDeep,
      });
      assert.equal(result.state, "ok", result.reason);
    });

    test("fails when the reader lands on a public URL for another zone page", async () => {
      const year = "https://policyengine-2025-year-in-review.vercel.app";
      const deep = `${year}/2025-year-in-review/us/direct-host-audit?${PROBE_PARAM}=1`;
      const publicDeep = `${PUBLIC_ORIGIN}/2025-year-in-review/us/direct-host-audit?${PROBE_PARAM}=1`;
      const route = `${PUBLIC_ORIGIN}/us/2025-year-in-review?${PROBE_PARAM}=1`;
      const other = `${PUBLIC_ORIGIN}/2025-year-in-review/us/other?${PROBE_PARAM}=1`;
      const result = await probeDirectHost(REWRITES, deep, {
        fetchImpl: fakeFetch({
          [deep]: permanent(`/2025-year-in-review/us?${PROBE_PARAM}=1`),
          [`${year}/2025-year-in-review/us?${PROBE_PARAM}=1`]: permanent(route),
          [publicDeep]: permanent(other),
          [other]: page,
          [route]: page,
        }),
        ...noWait,
        requirePage: false,
        publicUrl: publicDeep,
      });
      assert.equal(result.state, "wrong", result.reason);
      assert.match(result.reason, /lands on .*\/us\/other/);
    });
  });

  describe("the deadline", () => {
    // A clock the fake fetch moves forward: each request takes `cost` ms.
    function clocked(table, cost) {
      let time = 0;
      const fetchImpl = fakeFetch(table);
      const starts = [];
      const impl = async (url, init) => {
        starts.push(time);
        time += cost;
        return fetchImpl(url, init);
      };
      const sleeps = [];
      return {
        impl,
        starts,
        sleeps,
        now: () => time,
        sleep: async (ms) => {
          sleeps.push(time);
          time += ms;
        },
      };
    }

    test("starts no request and no retry after it", async () => {
      // Every request answers 503 after 400 ms; retries wait 1 and 4 s.
      const clock = clocked({ [DIRECT]: { status: 503 } }, 400);
      const result = await probeDirectHost(REWRITES, DIRECT, {
        fetchImpl: clock.impl,
        retryDelays: [1000, 4000],
        sleep: clock.sleep,
        now: clock.now,
        deadline: 2000,
      });
      assert.equal(result.state, "unreachable", result.reason);
      // 0: first try; 400: wait 1 s; 1400: second try; 1800 + 4000 > 2000, so no third.
      assert.deepEqual(clock.starts, [0, 1400]);
      assert.deepEqual(clock.sleeps, [400]);
    });

    test("reports a probe cut off by it as unreachable", async () => {
      // The direct request ends at 1200 ms, past the 1000 ms deadline, so the
      // public URL is never fetched.
      const clock = clocked(
        {
          [DIRECT]: permanent(PUBLIC),
          [PUBLIC]: page,
        },
        1200,
      );
      const result = await probeDirectHost(REWRITES, DIRECT, {
        fetchImpl: clock.impl,
        ...noWait,
        now: clock.now,
        deadline: 1000,
      });
      assert.equal(result.state, "unreachable");
      assert.match(result.reason, /reached its deadline/);
      assert.deepEqual(clock.starts, [0]);
    });

    test("parses nothing after it", async () => {
      // The page arrives at 1200 ms, past the 1000 ms deadline.
      const clock = clocked(
        { [DIRECT]: permanent(PUBLIC), [PUBLIC]: page },
        600,
      );
      const result = await probeDirectHost(REWRITES, DIRECT, {
        fetchImpl: clock.impl,
        ...noWait,
        now: clock.now,
        deadline: 1000,
      });
      assert.equal(result.state, "unreachable");
      assert.match(result.reason, /reached its deadline/);
      assert.deepEqual(clock.starts, [0, 600]);
    });

    test("cuts the parse's time to the time left", async () => {
      const started = Date.now();
      const result = await probeDirectHost(REWRITES, DIRECT, {
        fetchImpl: fakeFetch({
          [DIRECT]: permanent(PUBLIC),
          [PUBLIC]: {
            status: 200,
            body: `${"<div>".repeat(50_000)}${"</div>".repeat(50_000)}`,
          },
        }),
        ...noWait,
        deadline: started + 300,
      });
      const took = Date.now() - started;
      assert.equal(result.state, "unreachable");
      assert.ok(took < 2000, `took ${took} ms with a 300 ms deadline`);
    });

    test("cuts each request's timeout to the time left", async () => {
      // Real time, scaled down: every request hangs until its signal aborts.
      const hang = async (url, init) =>
        new Promise((_, reject) => {
          init.signal.addEventListener("abort", () =>
            reject(new Error("timed out")),
          );
        });
      const started = Date.now();
      const result = await probeDirectHost(REWRITES, DIRECT, {
        fetchImpl: hang,
        timeout: 10_000,
        retryDelays: [10, 10],
        deadline: started + 300,
      });
      const took = Date.now() - started;
      assert.equal(result.state, "unreachable");
      assert.ok(took < 1000, `took ${took} ms with a 300 ms deadline`);
    });
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

  test("fails a temporary redirect to www, or to anywhere but Vercel's SSO", async () => {
    for (const location of [
      PUBLIC,
      PUBLIC.replace("https:", "http:"),
      PUBLIC.replace("www.policyengine.org", "www.policyengine.org:8443"),
      "https://example.com/",
      "https://givecalc.vercel.app/us/givecalc",
      "https://vercel.com.example.com/sso-api",
      "https://evilvercel.com/sso-api",
    ]) {
      for (const status of [302, 307]) {
        const result = await probe({
          [DIRECT]: { status, location },
          [PUBLIC]: page,
        });
        assert.equal(result.state, "wrong", `${status} ${location}`);
        assert.match(result.reason, new RegExp(String(status)));
      }
    }
  });

  test("reports Vercel's SSO redirect, a challenge or a server error as unreachable", async () => {
    for (const answer of [
      { status: 302, location: "https://vercel.com/sso-api?url=x" },
      { status: 307, location: "https://vercel.com/login?next=x" },
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

  test("reports a 3xx that isn't a redirect, or has no Location, as missing", async () => {
    // Fetch and Chromium redirect on 301, 302, 303, 307 and 308 only; a browser
    // shows any other response where it is.
    for (const entry of [
      { status: 300 },
      { status: 304 },
      { status: 308 },
      { status: 300, location: PUBLIC },
      { status: 304, location: PUBLIC },
      { status: 305, location: PUBLIC },
      { status: 306, location: PUBLIC },
      { status: 399, location: PUBLIC },
    ]) {
      const fetchImpl = fakeFetch({ [DIRECT]: entry, [PUBLIC]: page });
      const result = await probeDirectHost(REWRITES, DIRECT, {
        fetchImpl,
        ...noWait,
      });
      const label = JSON.stringify(entry);
      assert.deepEqual(
        result,
        { state: "missing", directUrl: DIRECT, status: entry.status },
        label,
      );
      assert.deepEqual(fetchImpl.calls, [DIRECT], label);
    }
  });

  test("doesn't follow a 3xx that isn't a redirect on policyengine.org", async () => {
    const result = await probe({
      [DIRECT]: permanent(PUBLIC),
      [PUBLIC]: { status: 300, location: "https://www.policyengine.org/" },
      "https://www.policyengine.org/": page,
    });
    assert.equal(result.state, "wrong", result.reason);
    assert.match(result.reason, /answers 300$/);
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

  test("reads a UTF-16 page's links, by charset or byte-order mark", async () => {
    const html = `<link rel="canonical" href="${DIRECT}">`;
    const bytes = new Uint8Array(html.length * 2);
    for (let i = 0; i < html.length; i += 1) bytes[i * 2] = html.charCodeAt(i);
    for (const response of [
      { status: 200, bytes, contentType: "text/html; charset=utf-16le" },
      {
        status: 200,
        bytes: new Uint8Array([0xff, 0xfe, ...bytes]),
        contentType: "text/html",
      },
    ]) {
      const result = await probe({
        [DIRECT]: permanent(PUBLIC),
        [PUBLIC]: response,
      });
      assert.equal(result.state, "wrong", result.reason);
      assert.match(result.reason, /names .*vercel\.app.* as its canonical/);
    }
  });

  test("reads a page in the encoding its BOM or charset fixes", async () => {
    // Read as UTF-8, each of these names no URL; in its own encoding, each
    // names a Vercel one.
    const cases = [
      [
        bytesOf(
          '<link rel="canonical" href="https://caf',
          [0xe9],
          '.vercel.app/x">',
        ),
        "text/html; charset=windows-1252",
      ],
      [utf16(VERCEL_CANONICAL, true), "text/html; charset=utf-16le"],
      [
        bytesOf([0xfe, 0xff], [...utf16(VERCEL_CANONICAL, false)]),
        "text/html; charset=utf-8",
      ],
    ];
    for (const [bytes, contentType] of cases) {
      assert.deepEqual(
        canonicalUrls(new TextDecoder().decode(bytes)).filter(({ url }) =>
          url.includes(".vercel.app"),
        ),
        [],
        contentType,
      );
      const result = await probe({
        [DIRECT]: permanent(PUBLIC),
        [PUBLIC]: { status: 200, bytes, contentType },
      });
      assert.equal(result.state, "wrong", `${contentType}: ${result.reason}`);
      assert.match(result.reason, /\.vercel\.app/);
    }
  });

  test("reports a page it can't read as browsers do as unreachable", async () => {
    // Browsers disagree on this page: it fixes no encoding, and ISO-2022-JP
    // (which its <meta> names) hides a comment opener from those that use it.
    const jis = bytesOf(
      "<meta charset=iso-2022-jp>",
      JIS_X_0208,
      "<!--",
      BACK_TO_ASCII,
      `<link rel="canonical" href="${DIRECT}">`,
    );
    for (const [bytes, contentType, reason] of [
      [jis, "text/html", /neither a byte-order mark nor/],
      [jis, "text/html; charset=iso-2022-jp", /doesn't decode iso-2022-jp/],
      [
        bytesOf(`<link rel="canonical" href="${DIRECT}">`),
        "application/xhtml+xml",
        /not text\/html/,
      ],
      [bytesOf("just text"), "text/plain", /not text\/html/],
      [bytesOf("just text"), null, /has no Content-Type/],
    ]) {
      const result = await probe({
        [DIRECT]: permanent(PUBLIC),
        [PUBLIC]: { status: 200, bytes, contentType },
      });
      assert.equal(
        result.state,
        "unreachable",
        `${contentType}: ${result.reason}`,
      );
      assert.match(result.reason, /can't read .* as browsers do/);
      assert.match(result.reason, reason);
    }
  });

  test("reports a public URL behind Vercel's SSO as unreachable, without following it", async () => {
    // As with a test mirror of the website, given as --public-origin.
    const mirror = "https://website-mirror.vercel.app";
    const mirrored = PUBLIC.replace(PUBLIC_ORIGIN, mirror);
    for (const [publicOrigin, target] of [
      [mirror, mirrored],
      [PUBLIC_ORIGIN, PUBLIC],
    ]) {
      for (const login of [
        "https://vercel.com/sso-api?url=x",
        "https://sso.vercel.com/login",
      ]) {
        for (const status of [302, 303, 307]) {
          const fetchImpl = fakeFetch({
            [DIRECT]: permanent(target),
            [target]: { status, location: login },
          });
          const result = await probeDirectHost(REWRITES, DIRECT, {
            fetchImpl,
            publicOrigin,
            ...noWait,
          });
          const label = `${publicOrigin} ${status} ${login}`;
          assert.equal(
            result.state,
            "unreachable",
            `${label}: ${result.reason}`,
          );
          assert.match(result.reason, /vercel\.com/, label);
          assert.ok(!fetchImpl.calls.includes(login), `fetched ${login}`);
        }
      }
    }
  });

  test("fails a permanent redirect to vercel.com, or a temporary one elsewhere", async () => {
    for (const answer of [
      permanent("https://vercel.com/sso-api?url=x"),
      { status: 302, location: "https://vercel.com.example.com/sso-api" },
      { status: 302, location: "https://evilvercel.com/sso-api" },
      { status: 302, location: "https://example.com/login" },
    ]) {
      const result = await probe({
        [DIRECT]: permanent(PUBLIC),
        [PUBLIC]: answer,
      });
      assert.equal(result.state, "wrong", JSON.stringify(answer));
      assert.match(result.reason, /off the site/);
    }
  });

  test("fails a Location that is empty or isn't a URL, on either host", async () => {
    for (const location of ["http://[", ""]) {
      const bad = { status: 308, location };
      for (const table of [
        { [DIRECT]: bad },
        { [DIRECT]: permanent(PUBLIC), [PUBLIC]: bad },
      ]) {
        const result = await probe(table);
        const label = `${Object.keys(table).length} ${JSON.stringify(location)}`;
        assert.equal(result.state, "wrong", `${label}: ${result.reason}`);
        assert.match(
          result.reason,
          new RegExp(
            `answers 308 with a Location that isn't a URL: ${escapeRegExp(JSON.stringify(location))}$`,
          ),
          label,
        );
      }
    }
  });

  test("reports a Location that may be several joined as unreachable, on either host", async () => {
    // headers.get joins repeated Location headers with ", ", so each of these
    // could be one header or several, which browsers read differently: one
    // whole URL, or each copy apart.
    for (const location of [
      `${PUBLIC}, ${PUBLIC}`,
      `${PUBLIC}, ${PUBLIC}, ${PUBLIC}`,
      `${PUBLIC}, https://www.policyengine.org/elsewhere`,
      `, ${PUBLIC}`,
      `${PUBLIC}#a, b`,
    ]) {
      const joined = { status: 308, location };
      for (const table of [
        { [DIRECT]: joined, [PUBLIC]: page },
        { [DIRECT]: permanent(PUBLIC), [PUBLIC]: joined },
      ]) {
        const fetchImpl = fakeFetch(table);
        const result = await probeDirectHost(REWRITES, DIRECT, {
          fetchImpl,
          ...noWait,
        });
        const label = `${Object.keys(table).length} ${JSON.stringify(location)}`;
        assert.equal(result.state, "unreachable", `${label}: ${result.reason}`);
        assert.match(
          result.reason,
          new RegExp(
            `answers 308 with a Location that may be one URL or several joined: ${escapeRegExp(JSON.stringify(location))}$`,
          ),
          label,
        );
        assert.deepEqual(
          fetchImpl.calls,
          table[DIRECT] === joined ? [DIRECT] : [DIRECT, PUBLIC],
          label,
        );
      }
    }
  });

  test("follows a Location with a comma but no space: one header holds it", async () => {
    // headers.get joins with ", ", so "," alone can't come from two headers.
    const elsewhere = "https://www.policyengine.org/us/a,b";
    const fetchImpl = fakeFetch({
      [DIRECT]: permanent(PUBLIC),
      [PUBLIC]: permanent(elsewhere),
      [elsewhere]: page,
    });
    const result = await probeDirectHost(REWRITES, DIRECT, {
      fetchImpl,
      ...noWait,
    });
    assert.equal(result.state, "wrong", result.reason);
    assert.match(
      result.reason,
      /sends .* on to https:\/\/www\.policyengine\.org\/us\/a,b$/,
    );
    assert.deepEqual(fetchImpl.calls, [DIRECT, PUBLIC, elsewhere]);
  });

  test("reports a page whose headers or metas change how browsers read it as unreachable", async () => {
    const noscript = `<head><noscript>${VERCEL_CANONICAL}</noscript></head>`;
    const based = `<base href="https://a.vercel.app/"><link rel="canonical" href="/us/x">`;
    for (const [entry, reason] of [
      [
        { body: noscript, headers: { "content-security-policy": "sandbox" } },
        /Content-Security-Policy sets sandbox or base-uri/,
      ],
      [
        {
          body: based,
          headers: { "content-security-policy": "base-uri 'none'" },
        },
        /Content-Security-Policy sets sandbox or base-uri/,
      ],
      [
        {
          body: `<meta http-equiv="content-security-policy" content="base-uri 'none'">${based}`,
        },
        /a <meta> sets a Content-Security-Policy/,
      ],
      [
        {
          body: page.body,
          headers: { refresh: "0; url=https://a.vercel.app/" },
        },
        /Refresh header/,
      ],
      [
        {
          body: `<meta http-equiv="refresh" content="0; url=https://a.vercel.app/">`,
        },
        /a <meta> refreshes it/,
      ],
      [
        {
          body: page.body,
          headers: { link: '<https://a.vercel.app/x>; rel="canonical"' },
        },
        /Link header names a canonical/,
      ],
    ]) {
      const result = await probe({
        [DIRECT]: permanent(PUBLIC),
        [PUBLIC]: { status: 200, ...entry },
      });
      const label = JSON.stringify(entry);
      assert.equal(result.state, "unreachable", `${label}: ${result.reason}`);
      assert.match(result.reason, /can't read .* as browsers do/, label);
      assert.match(result.reason, reason, label);
    }
  });

  test("still reads a page whose headers don't change it", async () => {
    // A report-only policy enforces nothing; a preload link names no
    // canonical. The Vercel canonical in each still fails.
    for (const headers of [
      { "content-security-policy-report-only": "sandbox" },
      { "content-security-policy": "frame-ancestors 'self'" },
      { link: '</app.css>; rel="preload"; as="style"' },
    ]) {
      const result = await probe({
        [DIRECT]: permanent(PUBLIC),
        [PUBLIC]: { status: 200, body: VERCEL_CANONICAL, headers },
      });
      assert.equal(
        result.state,
        "wrong",
        `${JSON.stringify(headers)}: ${result.reason}`,
      );
      assert.match(result.reason, /names https:\/\/a\.vercel\.app\/x/);
    }
  });

  test("reads a deep page, and reports one it can't parse in time as unreachable", async () => {
    const deep = (depth, inner) =>
      `${"<div>".repeat(depth)}${inner}${"</div>".repeat(depth)}`;
    const ok = await probe({
      [DIRECT]: permanent(PUBLIC),
      [PUBLIC]: {
        status: 200,
        body: deep(5000, `<link rel="canonical" href="${PUBLIC}">`),
      },
    });
    assert.equal(ok.state, "ok", ok.reason);
    const vercel = await probe({
      [DIRECT]: permanent(PUBLIC),
      [PUBLIC]: {
        status: 200,
        body: deep(5000, `<link rel="canonical" href="${DIRECT}">`),
      },
    });
    assert.equal(vercel.state, "wrong", vercel.reason);
    const slow = await probe(
      {
        [DIRECT]: permanent(PUBLIC),
        [PUBLIC]: { status: 200, body: deep(50_000, "") },
      },
      { parseTimeout: 200 },
    );
    assert.equal(slow.state, "unreachable");
    assert.match(
      slow.reason,
      /couldn't read the canonical links .*took over 200 ms/,
    );
  });

  test("passes when policyengine.org sends the target on to another URL for the same zone page", async () => {
    const q = `${PROBE_PARAM}=1`;
    const year = "https://policyengine-2025-year-in-review.vercel.app";
    const april = "https://april-fools-2026-two.vercel.app";
    const marriage = "https://marriage-zeta-beryl.vercel.app";
    // A zone URL, the public URL its host names, and where policyengine.org
    // sends that: each pair proxies to the zone URL.
    const chains = [
      [
        `${year}/2025-year-in-review/us?${q}`,
        `${PUBLIC_ORIGIN}/2025-year-in-review/us?${q}`,
        `${PUBLIC_ORIGIN}/us/2025-year-in-review?${q}`,
      ],
      [
        `${april}/us/pe84/calculator?${q}`,
        `${PUBLIC_ORIGIN}/us/pe84/calculator?${q}`,
        `${PUBLIC_ORIGIN}/us/pe84?${q}`,
      ],
      [
        `${marriage}/us/marriage?country=uk&${q}`,
        `${PUBLIC_ORIGIN}/us/marriage?country=uk&${q}`,
        `${PUBLIC_ORIGIN}/uk/marriage?${q}`,
      ],
    ];
    for (const [zoneUrl, named, route] of chains) {
      const result = await probeDirectHost(REWRITES, zoneUrl, {
        fetchImpl: fakeFetch({
          [zoneUrl]: permanent(named),
          [named]: permanent(route),
          [route]: page,
        }),
        ...noWait,
      });
      assert.equal(result.state, "ok", `${zoneUrl}: ${result.reason}`);
      assert.deepEqual(result.publicHops, [route]);
    }
  });

  test("fails loops on policyengine.org and on the zone host", async () => {
    for (const [table, requirePage] of [
      [{ [DIRECT]: permanent(PUBLIC), [PUBLIC]: permanent(PUBLIC) }, true],
      [{ [DIRECT]: permanent(DIRECT) }, true],
    ]) {
      const result = await probe(table, { requirePage });
      assert.equal(result.state, "wrong");
      assert.match(result.reason, /loops/);
    }
    // A loop through the zone host stops at its first hop back there.
    const back = await probe(
      { [DIRECT]: permanent(PUBLIC), [PUBLIC]: permanent(DIRECT) },
      { requirePage: false },
    );
    assert.equal(back.state, "wrong");
    assert.match(back.reason, /back to ballot-measures-2026\.vercel\.app/);
  });

  test("fails a hop off policyengine.org, even one that comes back, and never follows it", async () => {
    const offSite = [
      "http://example.com/bridge",
      "https://example.com/bridge",
      `http://www.policyengine.org/us/ballot-measures-2026?${PROBE_PARAM}=1`,
      `https://www.policyengine.org:8443/us/ballot-measures-2026?${PROBE_PARAM}=1`,
      "https://other-zone.vercel.app/x",
      `${BALLOT_HOST}/us/ballot-measures-2026/bridge`,
    ];
    for (const bridge of offSite) {
      const apex = `https://policyengine.org/us/ballot-measures-2026?${PROBE_PARAM}=1`;
      const fetchImpl = fakeFetch({
        [DIRECT]: permanent(apex),
        [apex]: permanent(bridge),
        [bridge]: permanent(PUBLIC),
        [PUBLIC]: page,
      });
      const result = await probeDirectHost(REWRITES, DIRECT, {
        fetchImpl,
        ...noWait,
      });
      assert.equal(result.state, "wrong", `${bridge}: ${result.reason}`);
      assert.ok(!fetchImpl.calls.includes(bridge), `fetched ${bridge}`);
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

  async function run(
    table,
    options = {},
    articles = {},
    onFetch = () => {},
    extraArgs = [],
  ) {
    const { dir, argv } = fixture(articles);
    const fake = fakeFetch(table);
    const fetchImpl = Object.assign(
      async (url, init) => {
        onFetch(url);
        return fake(url, init);
      },
      { calls: fake.calls },
    );
    try {
      const result = await quietly(() =>
        main([...argv, ...extraArgs], {
          ...noWait,
          ...options,
          fetchImpl,
        }),
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

  test("holds the shipped routes to the shipped list, but not a routes file", async () => {
    const { dir, argv } = fixture();
    try {
      const shipped = await quietly(() =>
        main(argv.slice(2), { ...noWait, fetchImpl: fakeFetch({}) }),
      );
      assert.equal(shipped.code, 1);
      assert.match(shipped.output, /no longer redirects/);
      assert.match(shipped.output, /\/us\/ballot-measures-2026: /);
    } finally {
      rmSync(dir, { recursive: true });
    }
    // run() passes a routes file that lists no zone's redirect.
    assert.equal((await run({ [ROOT]: page })).code, 0);
  });

  test("reads a page past Next's preload of an image with spaces in its name", async () => {
    const landing = (body) => ({
      ...redirecting,
      [toPublic(ROOT)]: {
        status: 200,
        body,
        headers: {
          link: '</assets/ballot measures 2026.png>; rel=preload; as="image"; fetchpriority="high"',
        },
      },
    });
    const good = `<link rel="canonical" href="${BALLOT.source}">`;
    const passed = await run(landing(good), listed);
    assert.equal(passed.code, 0);
    assert.match(passed.output, /OK \/us\/ballot-measures-2026/);
    const failed = await run(landing(VERCEL_CANONICAL), listed);
    assert.equal(failed.code, 1);
    assert.match(failed.output, /a\.vercel\.app/);
  });

  test("fails a listed zone that stopped redirecting at either path", async () => {
    assert.equal((await run({ [ROOT]: page }, listed)).code, 1);
    // A 300 with a Location isn't a redirect: the reader stays on it.
    const multiple = {
      ...redirecting,
      [ROOT]: { status: 300, location: redirecting[ROOT].location },
    };
    assert.equal((await run(multiple, listed)).code, 1);
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

  test("fails a direct-only redirect that sends a deep link to the root", async () => {
    // Direct: deep -> root on the zone's host -> www's root. Proxied, the
    // deep page answers without redirecting, so its readers keep the page.
    const lossy = {
      ...redirecting,
      [DEEP]: permanent(new URL(ROOT).pathname + new URL(ROOT).search),
      [toPublic(DEEP)]: { status: 404 },
    };
    for (const options of [{}, listed]) {
      const result = await run(lossy, options);
      assert.equal(result.code, 1);
      assert.match(result.output, /a reader of .*direct-host-audit.* lands on/);
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

  test("reports zones left unprobed at the deadline as unreachable, without failing", async () => {
    let clock = 0;
    const result = await run(
      redirecting,
      {
        ...listed,
        // Each request moves the clock past the deadline.
        fetchImpl: undefined,
        now: () => clock,
      },
      {},
      () => {
        clock += 1000;
      },
      ["--deadline-ms", "500"],
    );
    assert.equal(result.code, 0);
    assert.match(result.output, /not probed: the audit reached its deadline/);
    assert.match(result.output, /UNREACHABLE \/us\/ballot-measures-2026/);
    // The probe under way stops too: it never fetches the public URL.
    assert.deepEqual(result.calls, [ROOT]);
  });

  test("reports a page it can't parse, and finishes the run", async () => {
    const slowPage = {
      status: 200,
      body: `${"<div>".repeat(50_000)}${"</div>".repeat(50_000)}`,
    };
    const started = Date.now();
    const { code, output } = await run(
      { ...redirecting, [toPublic(ROOT)]: slowPage },
      { ...listed, parseTimeout: 200 },
    );
    // Well under the 10 s default: main passes its parse limit on.
    const took = Date.now() - started;
    assert.ok(took < 5000, `took ${took} ms with a 200 ms parse limit`);
    assert.equal(code, 0);
    assert.match(output, /UNREACHABLE \/us\/ballot-measures-2026/);
    assert.match(output, /couldn't read the canonical links/);
  });

  test("fails a zone whose Location isn't a URL, and finishes the run", async () => {
    const { code, output } = await run({
      ...redirecting,
      [DEEP]: { status: 308, location: "http://[" },
    });
    assert.equal(code, 1);
    assert.match(output, /Location that isn't a URL/);
  });

  test("ends near the deadline when every request hangs", async () => {
    const { dir, argv } = fixture();
    // Each request hangs until its timeout signal aborts it.
    const hang = async (url, init) =>
      new Promise((_, reject) => {
        init.signal.addEventListener("abort", () =>
          reject(new Error("timed out")),
        );
      });
    const started = Date.now();
    try {
      const result = await quietly(() =>
        main([...argv, "--deadline-ms", "300", "--timeout", "5000"], {
          ...noWait,
          ...listed,
          fetchImpl: hang,
        }),
      );
      assert.equal(result.code, 0);
      assert.match(result.output, /UNREACHABLE \/us\/ballot-measures-2026/);
    } finally {
      rmSync(dir, { recursive: true });
    }
    const took = Date.now() - started;
    assert.ok(took < 2000, `took ${took} ms with a 300 ms deadline`);
  });

  test("warns about an iframe of a zone host whether or not the zone redirects", async () => {
    const iframe = `<iframe src="${BALLOT.destination}"></iframe>`;
    for (const table of [{ [ROOT]: page }, { [ROOT]: { status: 503 } }]) {
      const result = await run(table, {}, { "post.md": iframe });
      assert.equal(result.code, 0);
      assert.match(result.output, /post\.md: ballot-measures-2026/);
    }
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
