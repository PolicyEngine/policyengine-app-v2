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

- A rate-limited read (429) waits the number of seconds in `Retry-After`; only decimal digits count, and a date or anything else is ignored. Without one, it waits 60 seconds (`RATE_LIMIT_WAIT_MILLISECONDS`), the length of the rate limit's window. It waits at least a second, or one interval if that is longer, unless the deadline comes sooner. On a page that can read the 429 (see [Rate limits](#rate-limits)), rate-limited reads never end polling by themselves; the deadline still applies.
- A brief gateway failure (502, 503 or 504) waits the seconds in `Retry-After`, or one interval without it. The fourth gateway failure since the last answer ends polling.

`intervalMilliseconds` must be a finite number, 0 or more. `timeoutMilliseconds` must be a number, 0 or more, or `Infinity`. Any other value, including one that is not a number, rejects with `RangeError` before the first read.

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

Versions after 0.1.0 are published by the "Publish @policyengine/api-client" workflow (`.github/workflows/publish-api-client.yaml`), started by hand on `main`. It publishes the version in `package.json` if npm doesn't have it yet. It uses npm trusted publishing, so no npm token is stored, and the versions it publishes carry provenance. It publishes directly with `npm publish`, not `npm stage publish`, so a version is public as soon as the run finishes, with no approval step on npm.

To release a version, raise `version` in a PR. After it merges, run the workflow on `main` (Actions → "Publish @policyengine/api-client" → Run workflow).

0.1.0 was published by hand by an owner of the `@policyengine` npm scope, from a tarball packed on `main`, because npm lets a package trust a workflow only once the package exists. npm also lists a `0.0.0-stage` version, a placeholder its registry created during that publish. `latest` points to 0.1.0, so installs don't get the placeholder.

### Setting up the workflow's publishing

This is done once, in this order, by a repository admin and an owner of the `@policyengine` npm scope:

1. **Set up the environment.** In the repository's Settings → Environments, open `npm-publish`, or create it if it isn't listed. Under "Deployment branches and tags", choose "Selected branches and tags" and make the branch `main` its only entry. Do this first. A workflow run that names a missing environment creates it with no restrictions, so `npm-publish` may already exist without a branch rule.
2. **Merge the next version.** Raise `version` in a PR and merge it, but don't run the workflow yet. npm expires a new trusted publisher that hasn't completed a publish within 2 days, and the workflow publishes nothing while npm already has the version in `package.json`.
3. **Add the trusted publisher.** On npmjs.com, open the package's Settings → Trusted Publisher and choose GitHub Actions. The names are case-sensitive:
   - organization or user: `PolicyEngine`;
   - repository: `policyengine-app-v2`;
   - workflow filename: `publish-api-client.yaml`;
   - environment: `npm-publish`;
   - allowed actions: allow direct `npm publish` as well as `npm stage publish`, which npm always allows. npm refuses the workflow's `npm publish` without this.

   A package can have several trusted publishers, and npm accepts a token that matches any one of them. If others are listed, remove each one that doesn't name the environment `npm-publish`.
4. **Run the workflow on `main` within 2 days.** Then check that npm shows the new version with a provenance record. If the 2 days pass first, npm marks the trusted publisher expired and it can't be edited: delete it, add it again as in step 3, and run the workflow.
5. **Optionally, disallow tokens.** Under the package's Publishing access, choose "Require two-factor authentication and disallow tokens". This stops publishing with npm access tokens. The package's maintainers on npm can still publish by hand with two-factor authentication.

npm accepts the workflow's OIDC token only when its repository, workflow file and environment match the trusted publisher, and the repository also matches `repository.url` in `package.json`. The workflow's own `main`-only conditions are in the workflow file, which a copy on another branch could leave out. The environment's branch rule is what stops such a copy from getting a token that names `npm-publish`. GitHub's documentation doesn't say whether its "Allow administrators to bypass configured protection rules" setting lets admins skip that branch rule.

## Licence

MIT. See [LICENSE](LICENSE).
