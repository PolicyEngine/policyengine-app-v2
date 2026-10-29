import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";

import {
  extractRoutes,
  resolveDestinationForSource,
} from "./audit-app-zone-shell.mjs";
import {
  DIRECT_HOST_REDIRECTS,
  findIframedHosts,
  isProductionVercelHost,
  main,
  PROBE_PARAM,
  probeDirectHost,
  probePaths,
  PUBLIC_ORIGIN,
  redirectKeepsPage,
  routeForPublicPath,
  summarizeRoute,
} from "./audit-zone-direct-hosts.mjs";

const ROUTES = [
  {
    source: "/us/ballot-measures-2026",
    destination:
      "https://ballot-measures-2026.vercel.app/us/ballot-measures-2026",
  },
  {
    source: "/us/cliffwatch",
    destination: "https://cliff-watch.vercel.app/",
    deepDestination: "https://cliff-watch.vercel.app/:path*",
  },
  {
    source: "/us/pe84",
    destination: "https://april-fools-2026-two.vercel.app/us/pe84/calculator",
    deepDestination: "https://april-fools-2026-two.vercel.app/us/pe84/:path*",
  },
  {
    source: "/us/marriage",
    destination: "https://marriage-zeta-beryl.vercel.app/us/marriage",
  },
  {
    source: "/uk/marriage",
    destination:
      "https://marriage-zeta-beryl.vercel.app/us/marriage?country=uk",
    deepDestination:
      "https://marriage-zeta-beryl.vercel.app/us/marriage/:path*?country=uk",
  },
];
const [BALLOT, CLIFFWATCH, PE84, US_MARRIAGE, UK_MARRIAGE] = ROUTES;

/** A fetch that answers from a table of `url -> { status, location }`; anything else 404s. */
function fakeFetch(table) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push(url);
    assert.equal(init.redirect, "manual");
    const { status, location } = table[url] ?? { status: 404 };
    return {
      status,
      headers: { get: (name) => (name === "location" ? location : null) },
    };
  };
  return Object.assign(impl, { calls });
}

const permanent = (location) => ({ status: 308, location });
const page = { status: 200 };

describe("isProductionVercelHost", () => {
  test("accepts vercel.app destinations only", () => {
    assert.equal(isProductionVercelHost(BALLOT.destination), true);
    assert.equal(
      isProductionVercelHost("https://example.modal.run/us/x"),
      false,
    );
    assert.equal(
      isProductionVercelHost("/assets/posts/some-post/index.html"),
      false,
    );
  });
});

describe("probePaths", () => {
  test("probes the root, which must serve a page, and a path under it", () => {
    assert.deepEqual(probePaths(BALLOT), [
      {
        path: `/us/ballot-measures-2026?${PROBE_PARAM}=1`,
        requirePage: true,
      },
      {
        path: `/us/ballot-measures-2026/direct-host-audit?${PROBE_PARAM}=1`,
        requirePage: false,
      },
    ]);
  });
});

describe("routeForPublicPath", () => {
  test("picks the longest source that contains the path, on segment boundaries", () => {
    const routes = [
      { source: "/us/a", destination: "https://a.vercel.app/us/a" },
      { source: "/us/a/b", destination: "https://b.vercel.app/us/a/b" },
    ];
    assert.equal(routeForPublicPath(routes, "/us/a").source, "/us/a");
    assert.equal(routeForPublicPath(routes, "/us/a/").source, "/us/a");
    assert.equal(routeForPublicPath(routes, "/us/a/c").source, "/us/a");
    assert.equal(routeForPublicPath(routes, "/us/a/b/c").source, "/us/a/b");
    assert.equal(routeForPublicPath(routes, "/us/ab"), null);
    assert.equal(routeForPublicPath(routes, "/"), null);
  });
});

describe("redirectKeepsPage", () => {
  const keeps = (route, publicPath, location) =>
    redirectKeepsPage(
      ROUTES,
      resolveDestinationForSource(route, publicPath, PUBLIC_ORIGIN),
      location,
    );

  test("accepts the same path and query on www", () => {
    assert.deepEqual(
      keeps(
        BALLOT,
        "/us/ballot-measures-2026/ca-prop-40?a=1&a=2",
        `${PUBLIC_ORIGIN}/us/ballot-measures-2026/ca-prop-40?a=2&a=1`,
      ),
      { ok: true, apex: false },
    );
  });

  test("accepts the apex domain but marks the extra hop", () => {
    assert.deepEqual(
      keeps(
        BALLOT,
        "/us/ballot-measures-2026",
        "https://policyengine.org/us/ballot-measures-2026",
      ),
      { ok: true, apex: true },
    );
  });

  test("maps root-served and renamed zones back through their rewrite", () => {
    assert.equal(
      keeps(
        CLIFFWATCH,
        "/us/cliffwatch?s=CA",
        `${PUBLIC_ORIGIN}/us/cliffwatch?s=CA`,
      ).ok,
      true,
    );
    assert.equal(
      keeps(CLIFFWATCH, "/us/cliffwatch/x", `${PUBLIC_ORIGIN}/us/cliffwatch/x`)
        .ok,
      true,
    );
    // cliff-watch.vercel.app/ is policyengine.org/us/cliffwatch, not policyengine.org/.
    assert.match(
      keeps(CLIFFWATCH, "/us/cliffwatch", `${PUBLIC_ORIGIN}/`).reason,
      /no zone route serves \//,
    );
    // pe84's root rewrites to /us/pe84/calculator, so both public URLs serve it.
    assert.equal(keeps(PE84, "/us/pe84", `${PUBLIC_ORIGIN}/us/pe84`).ok, true);
    assert.equal(
      keeps(PE84, "/us/pe84", `${PUBLIC_ORIGIN}/us/pe84/calculator`).ok,
      true,
    );
  });

  test("keeps a host shared between countries on the right country", () => {
    assert.equal(
      keeps(UK_MARRIAGE, "/uk/marriage", `${PUBLIC_ORIGIN}/uk/marriage`).ok,
      true,
    );
    // The US route with ?country=uk proxies to the same request, so it serves
    // the same page.
    assert.equal(
      keeps(
        UK_MARRIAGE,
        "/uk/marriage",
        `${PUBLIC_ORIGIN}/us/marriage?country=uk`,
      ).ok,
      true,
    );
    // A rule that matches ?country=uk and keeps the query sends it to the UK
    // route, whose rewrite adds the same pair again.
    assert.equal(
      keeps(
        UK_MARRIAGE,
        "/uk/marriage",
        `${PUBLIC_ORIGIN}/uk/marriage?country=uk`,
      ).ok,
      true,
    );
    // Dropping ?country=uk turns a UK reader's page into the US one.
    assert.equal(
      keeps(UK_MARRIAGE, "/uk/marriage", `${PUBLIC_ORIGIN}/us/marriage`).ok,
      false,
    );
    assert.equal(
      keeps(US_MARRIAGE, "/us/marriage", `${PUBLIC_ORIGIN}/uk/marriage`).ok,
      false,
    );
  });

  test("rejects a route that serves the same path from another zone", () => {
    const routes = [
      { source: "/us/a", destination: "https://a.vercel.app/us/x" },
      { source: "/us/b", destination: "https://b.vercel.app/us/x" },
    ];
    const directUrl = resolveDestinationForSource(
      routes[0],
      "/us/a",
      PUBLIC_ORIGIN,
    );
    assert.equal(
      redirectKeepsPage(routes, directUrl, `${PUBLIC_ORIGIN}/us/a`).ok,
      true,
    );
    assert.match(
      redirectKeepsPage(routes, directUrl, `${PUBLIC_ORIGIN}/us/b`).reason,
      /serves https:\/\/b\.vercel\.app/,
    );
  });

  test("rejects a dropped query, another path or another site", () => {
    assert.equal(
      keeps(
        BALLOT,
        "/us/ballot-measures-2026/ca-prop-40?utm_source=x",
        `${PUBLIC_ORIGIN}/us/ballot-measures-2026/ca-prop-40`,
      ).ok,
      false,
    );
    assert.equal(
      keeps(
        BALLOT,
        "/us/ballot-measures-2026/ca-prop-40",
        `${PUBLIC_ORIGIN}/us/ballot-measures-2026`,
      ).ok,
      false,
    );
    assert.match(
      keeps(
        BALLOT,
        "/us/ballot-measures-2026",
        "https://ballot-measures-2026.vercel.app/us/ballot-measures-2026",
      ).reason,
      /redirects off/,
    );
    assert.match(
      keeps(
        BALLOT,
        "/us/ballot-measures-2026",
        "https://policyengine.org.evil.example/us/ballot-measures-2026",
      ).reason,
      /redirects off/,
    );
  });
});

// Seeded so a failure reproduces; the label names the seed and the case.
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

describe("redirectKeepsPage over every route in appZoneRoutes.ts", () => {
  const routes = extractRoutes(
    readFileSync("website/src/data/appZoneRoutes.ts", "utf8"),
  );
  const zones = routes.filter((route) =>
    isProductionVercelHost(route.destination),
  );
  const SEED = 20261029;
  const CASES_PER_ZONE = 50;

  test("finds the zones", () => {
    assert.ok(zones.length > 40, `only ${zones.length} zones`);
  });

  test("the documented redirect, to the same path and query on www, keeps every page", () => {
    const random = mulberry32(SEED);
    for (const route of zones) {
      for (let i = 0; i < CASES_PER_ZONE; i += 1) {
        const { suffix, search } = randomSuffixAndQuery(random);
        const publicPath = `${route.source}${suffix}${search}`;
        const directUrl = resolveDestinationForSource(
          route,
          publicPath,
          PUBLIC_ORIGIN,
        );
        const result = redirectKeepsPage(
          routes,
          directUrl,
          `${PUBLIC_ORIGIN}${publicPath}`,
        );
        assert.equal(
          result.ok,
          true,
          `seed ${SEED} ${route.source} case ${i}: ${directUrl} -> ${publicPath}: ${result.reason}`,
        );
      }
    }
  });

  test("a redirect that drops a query parameter or the path never passes", () => {
    const random = mulberry32(SEED + 1);
    for (const route of zones) {
      for (let i = 0; i < CASES_PER_ZONE; i += 1) {
        const { suffix, search } = randomSuffixAndQuery(random);
        const label = `seed ${SEED + 1} ${route.source} case ${i}`;
        const directUrl = resolveDestinationForSource(
          route,
          `${route.source}${suffix}${search || "?qa=1"}`,
          PUBLIC_ORIGIN,
        );
        const dropsQuery = `${PUBLIC_ORIGIN}${route.source}${suffix}`;
        assert.equal(
          redirectKeepsPage(routes, directUrl, dropsQuery).ok,
          false,
          `${label}: ${directUrl} -> ${dropsQuery}`,
        );
        const toSiteRoot = `${PUBLIC_ORIGIN}/${search || "?qa=1"}`;
        assert.equal(
          redirectKeepsPage(routes, directUrl, toSiteRoot).ok,
          false,
          `${label}: ${directUrl} -> ${toSiteRoot}`,
        );
      }
    }
  });
});

describe("probeDirectHost", () => {
  const ROOT = `/us/ballot-measures-2026?${PROBE_PARAM}=1`;
  const DIRECT = `https://ballot-measures-2026.vercel.app${ROOT}`;
  const PUBLIC = `${PUBLIC_ORIGIN}${ROOT}`;
  const probe = (table, options = {}) =>
    probeDirectHost(ROUTES, BALLOT, ROOT, {
      fetchImpl: fakeFetch(table),
      ...options,
    });

  test("reports a host that serves the page itself as missing", async () => {
    const result = await probe({ [DIRECT]: page });
    assert.equal(result.state, "missing");
    assert.equal(result.status, 200);
  });

  test("passes a 308 to the same page on www that answers 200", async () => {
    const result = await probe({ [DIRECT]: permanent(PUBLIC), [PUBLIC]: page });
    assert.equal(result.state, "ok");
    assert.equal(result.location, PUBLIC);
    assert.equal(result.sameHostHops, 0);
  });

  test("follows same-host hops, such as a trailing slash, first", async () => {
    const slashed = `https://ballot-measures-2026.vercel.app/us/ballot-measures-2026/?${PROBE_PARAM}=1`;
    const result = await probeDirectHost(
      ROUTES,
      BALLOT,
      `/us/ballot-measures-2026/?${PROBE_PARAM}=1`,
      {
        fetchImpl: fakeFetch({
          [slashed]: permanent(`/us/ballot-measures-2026?${PROBE_PARAM}=1`),
          [DIRECT]: permanent(PUBLIC),
          [PUBLIC]: page,
        }),
      },
    );
    assert.equal(result.state, "ok");
    assert.equal(result.sameHostHops, 1);
  });

  test("fails a temporary redirect", async () => {
    const result = await probe({
      [DIRECT]: { status: 307, location: PUBLIC },
      [PUBLIC]: page,
    });
    assert.equal(result.state, "wrong");
    assert.match(result.reason, /307/);
  });

  test("fails a redirect to a page policyengine.org doesn't serve yet, unless it only checks the path", async () => {
    const table = { [DIRECT]: permanent(PUBLIC), [PUBLIC]: { status: 404 } };
    const strict = await probe(table);
    assert.equal(strict.state, "wrong");
    assert.match(strict.reason, /answers 404/);
    assert.equal((await probe(table, { requirePage: false })).state, "ok");
  });

  test("fails a loop on policyengine.org", async () => {
    const result = await probe({
      [DIRECT]: permanent(PUBLIC),
      [PUBLIC]: permanent(PUBLIC),
    });
    assert.equal(result.state, "wrong");
    assert.match(result.reason, /loops/);
  });

  test("fails a loop through the zone host, even when only the path is checked", async () => {
    const result = await probe(
      { [DIRECT]: permanent(PUBLIC), [PUBLIC]: permanent(DIRECT) },
      { requirePage: false },
    );
    assert.equal(result.state, "wrong");
    assert.match(result.reason, /loops/);
  });

  test("fails when policyengine.org sends readers back to the zone host", async () => {
    const elsewhere =
      "https://ballot-measures-2026.vercel.app/us/ballot-measures-2026/other";
    const result = await probe({
      [DIRECT]: permanent(PUBLIC),
      [PUBLIC]: permanent(elsewhere),
      [elsewhere]: page,
    });
    assert.equal(result.state, "wrong");
    assert.match(result.reason, /back to ballot-measures-2026\.vercel\.app/);
  });

  test("fails a loop on the zone host itself", async () => {
    const result = await probe({ [DIRECT]: permanent(DIRECT) });
    assert.equal(result.state, "wrong");
    assert.match(result.reason, /own host/);
  });

  test("fails a redirect that leaves policyengine.org", async () => {
    const result = await probe({
      [DIRECT]: permanent("https://example.com/us/ballot-measures-2026"),
    });
    assert.equal(result.state, "wrong");
    assert.match(result.reason, /redirects off/);
  });
});

describe("summarizeRoute", () => {
  const ok = { state: "ok" };
  const missing = { state: "missing" };
  const wrong = { state: "wrong", reason: "x" };

  test("only a redirect that goes wrong fails an unlisted route", () => {
    assert.equal(
      summarizeRoute(BALLOT, [missing, missing], false).fails,
      false,
    );
    assert.equal(summarizeRoute(BALLOT, [ok, ok], false).fails, false);
    assert.equal(summarizeRoute(BALLOT, [ok, missing], false).state, "partial");
    assert.equal(summarizeRoute(BALLOT, [ok, missing], false).fails, false);
    assert.equal(summarizeRoute(BALLOT, [missing, wrong], false).fails, true);
  });

  test("a listed route fails once its root stops redirecting", () => {
    assert.equal(summarizeRoute(BALLOT, [ok, ok], true).fails, false);
    assert.equal(summarizeRoute(BALLOT, [ok, missing], true).fails, false);
    assert.equal(summarizeRoute(BALLOT, [missing, ok], true).fails, true);
    assert.equal(summarizeRoute(BALLOT, [missing, missing], true).fails, true);
  });
});

describe("findIframedHosts", () => {
  test("finds iframes that load a redirecting host", () => {
    const found = findIframedHosts(
      {
        "a.md": `<iframe width="100%" src="https://ballot-measures-2026.vercel.app/us/ballot-measures-2026"></iframe>`,
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
  test("lists only zone routes on a Vercel host, once each", () => {
    const zones = new Set(
      extractRoutes(readFileSync("website/src/data/appZoneRoutes.ts", "utf8"))
        .filter((route) => isProductionVercelHost(route.destination))
        .map((route) => route.source),
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
  const silence = (fn) => async () => {
    const { log, error } = console;
    console.log = () => {};
    console.error = () => {};
    try {
      return await fn();
    } finally {
      console.log = log;
      console.error = error;
    }
  };

  function fixture(articles = {}) {
    const dir = mkdtempSync(join(tmpdir(), "zone-direct-hosts-"));
    const routesFile = join(dir, "appZoneRoutes.ts");
    writeFileSync(
      routesFile,
      `export const appZoneRoutes = [
        { source: "/us/ballot-measures-2026", destination: "${BALLOT.destination}" },
        { source: "/us/static-page", destination: "/assets/static-page/index.html" },
      ];`,
    );
    for (const [name, text] of Object.entries(articles)) {
      writeFileSync(join(dir, name), text);
    }
    return {
      dir,
      argv: ["--routes-file", routesFile, "--articles-dir", dir],
    };
  }

  const ROOT = `/us/ballot-measures-2026?${PROBE_PARAM}=1`;
  const DEEP = `/us/ballot-measures-2026/direct-host-audit?${PROBE_PARAM}=1`;
  const direct = (path) => `https://ballot-measures-2026.vercel.app${path}`;
  const redirecting = {
    [direct(ROOT)]: permanent(`${PUBLIC_ORIGIN}${ROOT}`),
    [`${PUBLIC_ORIGIN}${ROOT}`]: page,
    [direct(DEEP)]: permanent(`${PUBLIC_ORIGIN}${DEEP}`),
  };

  test(
    "passes zones that don't redirect yet, and probes only Vercel hosts",
    silence(async () => {
      const { dir, argv } = fixture();
      const fetchImpl = fakeFetch({ [direct(ROOT)]: page });
      try {
        assert.equal(await main(argv, { fetchImpl }), 0);
        assert.ok(
          fetchImpl.calls.every((url) => url.startsWith(direct(""))),
          fetchImpl.calls.join(", "),
        );
      } finally {
        rmSync(dir, { recursive: true });
      }
    }),
  );

  test(
    "passes a zone that redirects, listed or not",
    silence(async () => {
      const { dir, argv } = fixture();
      try {
        for (const directHostRedirects of [[], [BALLOT.source]]) {
          assert.equal(
            await main(argv, {
              fetchImpl: fakeFetch(redirecting),
              directHostRedirects,
            }),
            0,
          );
        }
      } finally {
        rmSync(dir, { recursive: true });
      }
    }),
  );

  test(
    "fails a listed zone that stopped redirecting, or a listed source with no zone",
    silence(async () => {
      const { dir, argv } = fixture();
      try {
        assert.equal(
          await main(argv, {
            fetchImpl: fakeFetch({ [direct(ROOT)]: page }),
            directHostRedirects: [BALLOT.source],
          }),
          1,
        );
        assert.equal(
          await main(argv, {
            fetchImpl: fakeFetch(redirecting),
            directHostRedirects: [BALLOT.source, "/us/not-a-zone"],
          }),
          1,
        );
      } finally {
        rmSync(dir, { recursive: true });
      }
    }),
  );

  test(
    "fails a redirect to a 404, and an article that iframes a redirecting host",
    silence(async () => {
      const broken = fixture();
      const iframed = fixture({
        "post.md": `<iframe src="${BALLOT.destination}"></iframe>`,
      });
      try {
        assert.equal(
          await main(broken.argv, {
            fetchImpl: fakeFetch({
              ...redirecting,
              [`${PUBLIC_ORIGIN}${ROOT}`]: { status: 404 },
            }),
          }),
          1,
        );
        assert.equal(
          await main(iframed.argv, { fetchImpl: fakeFetch(redirecting) }),
          1,
        );
        assert.equal(
          await main(iframed.argv, {
            fetchImpl: fakeFetch({ [direct(ROOT)]: page }),
          }),
          0,
        );
      } finally {
        rmSync(broken.dir, { recursive: true });
        rmSync(iframed.dir, { recursive: true });
      }
    }),
  );
});
