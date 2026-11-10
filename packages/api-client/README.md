# @policyengine/api-client

A browser client for www.policyengine.org's dashboard API. PolicyEngine dashboards use it instead of calling the PolicyEngine Public API (api.policyengine.org) directly. The website's server sends PolicyEngine's credential, so a dashboard needs none.

It has no dependencies and uses the browser's `fetch`.

## Install

```bash
npm install @policyengine/api-client
```

## Use

```ts
import { createPolicyEngineApiClient } from "@policyengine/api-client";

const policyengine = createPolicyEngineApiClient();

// A household under current law, or under parameter changes.
const household = await policyengine.calculateHousehold({
  country: "us",
  household: {
    people: { you: { age: { 2026: 40 }, employment_income: { 2026: 50000 } } },
    households: { your_household: { members: ["you"] } },
  },
  policy: {
    "gov.irs.credits.ctc.amount.base[0].amount": {
      "2026-01-01.2100-12-31": 3000,
    },
  },
});

// Store parameter changes as a policy, then compare it with current law
// across the whole economy. compareEconomy polls until the comparison is
// ready, which can take several minutes.
const reformId = await policyengine.createPolicy({
  country: "us",
  parameters: {
    "gov.irs.credits.ctc.amount.base[0].amount": {
      "2026-01-01.2100-12-31": 3000,
    },
  },
});
const impact = await policyengine.compareEconomy(
  { country: "us", policy: reformId, baseline: 2, region: "us", year: 2026 },
  { onProgress: (answer) => console.log(answer.status) },
);

// A country's variables and parameters.
const metadata = await policyengine.getMetadata("uk");
```

`baseline` is the policy ID of current law for the country, as the Public API numbers it.

## Operations

| Method | Dashboard API route | Resolves with |
| --- | --- | --- |
| `calculateHousehold({country, household, policy?})` | `POST /api/household/calculate` | The calculated household (`result`) |
| `createPolicy({country, parameters})` | `POST /api/policies` | The stored policy's ID |
| `getEconomyComparison({country, policy, baseline, region, year})` | `GET /api/economy/compare` | One answer: `{status: "computing" \| "ok" \| "error", result, …}` |
| `compareEconomy(request, {intervalMilliseconds?, timeoutMilliseconds?, onProgress?, signal?})` | the same, polled | The comparison's `result` |
| `getMetadata(country)` | `GET /api/metadata/{country}` | The country's metadata (`result`) |

`country` is `"us"` or `"uk"`.

Each method that resolves with a result takes the result's type, for example `calculateHousehold<MyHousehold>(…)` or `compareEconomy<MyImpact>(…)`. The type is not checked at run time. Without one, the result is `unknown`.

## Options

`createPolicyEngineApiClient({ baseUrl, fetch, unauthenticatedUserId })`:

- `baseUrl`: where the dashboard API is served. The default is https://www.policyengine.org, which works from a dashboard served on www.policyengine.org, from its preview and from local development. Pass `""` to call the page's own origin.
- `fetch`: a `fetch` to use instead of the global one.
- `unauthenticatedUserId`: sent as `PolicyEngine-Unauthenticated-User`, for pages that keep one.

Every method takes a `signal` to cancel the request (or the polling).

## Polling

`compareEconomy` reads the comparison every 5 seconds by default and gives up after 30 minutes with `EconomyComparisonTimeoutError`. No wait runs past that deadline: the last one is shortened so that polling reads once more at the deadline.

- A rate-limited read (429) waits the number of seconds in `Retry-After`; a date there is ignored. Without one, it waits 60 seconds (`RATE_LIMIT_WAIT_MILLISECONDS`), the length of the rate limit's window. It waits at least one interval, unless the deadline comes sooner. On a page that can read the 429 (see [Rate limits](#rate-limits)), rate-limited reads never end polling by themselves; the deadline still applies.
- A brief gateway failure (502, 503 or 504) waits the seconds in `Retry-After`, or one interval without it. The fourth gateway failure since the last answer ends polling.

`intervalMilliseconds` must be a finite number, 0 or more. `timeoutMilliseconds` must be a number, 0 or more, or `Infinity`. Any other value rejects with `RangeError` before the first read.

Keep the interval at a few seconds: the dashboard API allows 120 comparison reads a minute from one address.

A comparison that failed is not a gateway failure. The Public API answers it with 502, `status: "error"` and `retry_after_seconds`, which says how long it keeps that failure. `getEconomyComparison` resolves with that answer, and `compareEconomy` throws it at once rather than polling.

## Errors

Every failure throws `PolicyEngineApiError`, with:

- `status`: the HTTP status, or `null` when no answer arrived;
- `message`: the dashboard API's message;
- `body`: the parsed answer;
- `retryAfterSeconds`: from `Retry-After`, when the answer had one.

A comparison that ends in `"error"` throws it with the answer's HTTP status (502 from the Public API), and with `retryAfterSeconds` set to its `retry_after_seconds`. An abort rejects with the abort's reason, also when the answer is still arriving. A connection that drops mid-answer throws with `status` `null`.

## Rate limits

www.policyengine.org's firewall limits the requests from each IP address, counted in fixed 60-second windows:

| Requests | Allowed a minute |
| --- | --- |
| `calculateHousehold` | 30 |
| `getEconomyComparison`, and each read `compareEconomy` makes | 120 |
| `createPolicy` and `getMetadata`, together | 300 |

Everyone behind one address, such as an office network, shares these limits. Each Vercel region counts separately.

Over a limit, the firewall itself answers 429 with the text "Too Many Requests" and no `Retry-After`. The error therefore has `status` 429, `retryAfterSeconds` `null`, `body` `null`, and the message "The dashboard API answered HTTP 429.". Requests are accepted again when the window ends, within 60 seconds. `compareEconomy` waits that out; the other methods throw the 429.

That answer has no CORS headers. A page on www.policyengine.org reads it as above. A page on another origin cannot read it: the browser reports a network failure, so `status` is `null`, and `compareEconomy` stops at once with that error. Other origins include `http://localhost` in development, a preview, or a dashboard's own `*.vercel.app` host.

## Which pages may call it

The dashboard API answers browser requests from www.policyengine.org itself, from `http://localhost` and `http://127.0.0.1` on any port, from the PolicyEngine team's Vercel previews (`*-policy-engine.vercel.app`), and from the dashboards' own `*.vercel.app` hosts that www.policyengine.org serves. It refuses other sites' pages with 403.

## Releases

Published from `packages/api-client` in PolicyEngine/policyengine-app-v2 by the "Publish @policyengine/api-client" workflow. The workflow is started by hand on `main`. It uses npm trusted publishing, and publishes the version in `package.json` if npm does not have it yet.

npm lets a package trust a workflow only once the package exists. So an owner of the `@policyengine` npm scope publishes the first version by hand, from `main`:

```bash
npx -y bun@1.2.21 install --frozen-lockfile
cd packages/api-client
npm test
npm run build
npm pack --dry-run
npm publish --access public
```

Then, on npmjs.com, open the package's Settings, then Trusted Publisher, and choose GitHub Actions with repository `PolicyEngine/policyengine-app-v2` and workflow `publish-api-client.yaml`. Later versions are released by raising `version` in a PR and running the workflow after it merges.
