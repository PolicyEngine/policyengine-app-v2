# @policyengine/public-api-forwarding

Server-side code that sends requests to the PolicyEngine Public API (api.policyengine.org) for the website's and the calculator's route handlers. It is a private workspace package; it is not published.

Browser pages will reach the Public API only through these routes, and the routes send PolicyEngine's own server credential. Each route keeps its own allow list of operations; this package only forwards a request the route has already checked.

## What it does

`createPublicApiForwarder()` returns a `forward(request, options)` function that:

- **Chooses the Public API** from `POLICYENGINE_API_URL`. A production deployment without it uses https://api.policyengine.org. Every other deployment without it answers 503, so a preview never reaches the production Public API by omission.
- **Adds the server credential** when the four `POLICYENGINE_API_AUTH0_*` variables are set: an Auth0 client-credentials access token in `Authorization: Bearer`. With none of them set it forwards without a credential; with only some set it answers 503.
- **Caches the token** until five minutes before it expires (or halfway through the life of a token shorter than ten minutes): in the function instance's memory, then in Vercel Runtime Cache (one copy per region), shared by the deployment's instances. Requests that arrive while a token is being fetched wait for that one request. Auth0 counts issued machine-to-machine tokens per tenant per month, so tokens are never fetched per request.
- **Sends only these headers**, built from nothing rather than copied: `Accept`, `Content-Type` for a body, `User-Agent` (the caller's name), `X-Forwarded-For` (the browser's address, from Vercel's `x-real-ip`), `PolicyEngine-Unauthenticated-User` when the browser sent it, `If-None-Match` and `If-Modified-Since` for reads, and the user's token:
  - with a server credential, the browser's `Authorization` moves to `PolicyEngine-User-Authorization`;
  - without one, it stays in `Authorization`, as on a direct browser call.

  Cookies, `Origin`, `Referer` and any `PolicyEngine-User-Authorization` the browser sends are dropped.
- **Streams the answer back** with an allow list of response headers (`Content-Type`, `ETag`, `Last-Modified`, `Retry-After`, `WWW-Authenticate` and the Public API's request IDs). `Content-Encoding` and `Content-Length` are dropped, because `fetch` has already decompressed the body. Streaming matters because Vercel caps a buffered function answer at 4.5 MB.
- **Caches nothing it should not**: the route's `cacheControl` applies only to 2xx and 304 answers; every other answer is `no-store`, and so is every answer when the route gives none.
- **Maps failures to JSON** in the Public API's own error shape, `{"status": "error", "message": ..., "result": null}`:

  | Failure | Status |
  | --- | --- |
  | A path outside the letters, digits and `-_.~` segments a route may name | 404 |
  | `POLICYENGINE_API_URL` missing outside production, or a partial credential | 503 |
  | Auth0 refuses or does not answer the token request | 502 |
  | The Public API cannot be reached | 502 |
  | The Public API answers with a redirect (never followed: it would carry the credential) | 502 |
  | No response headers within the route's timeout | 504 |
  | A non-JSON error from in front of the Public API, such as the load balancer's 429 | same status, JSON body |

  JSON errors from the Public API itself pass through unchanged.

The same object's `fetchFromServer(request, options)` is for the server's own requests, not a browser's. It uses the same settings, token cache and path check. It sends only `Accept`, `User-Agent`, `Content-Type` for a body, and the server token, and never follows redirects. It passes Next.js's `next` cache options through, gives up after 30 seconds by default, and resolves with the Public API's response as it is, whatever its status. When the request cannot be sent, because the settings are missing, the token cannot be obtained or the path is refused, it throws `PublicApiUnavailableError` with the status a route would answer with.

The website's `withPublicApiCredential(fetch)` wraps a `fetch` so that requests to https://api.policyengine.org go through `fetchFromServer()`, and requests to other hosts pass unchanged. `/api/deployments` uses it for the Public API's version reports.

`checkOrigin()`, `corsResponseHeaders()` and `preflightResponse()` apply a route's CORS rules. A request whose `Origin` is neither the route's own site nor allowed gets 403 and is never forwarded: CORS alone only stops another site's page from reading the answer, not the request from running. So does a browser request with no `Origin` whose `Sec-Fetch-Site` is `cross-site` or `same-site`, which is how browsers send another site's `<img>`, `<script>` or no-cors GET. Requests without either header, such as from servers, are let through; rate limits hold those back.

The Auth0 token request never follows a redirect, which would re-send the client secret.

## Configuration

| Variable | Meaning |
| --- | --- |
| `POLICYENGINE_API_URL` | The Public API's base URL, https (or http on localhost). Required outside production. |
| `POLICYENGINE_API_AUTH0_DOMAIN` | Host of the Auth0 token endpoint. Tokens carry this host as their issuer, so it must be the issuer the Public API checks. |
| `POLICYENGINE_API_AUTH0_AUDIENCE` | The Auth0 API identifier the token is for. |
| `POLICYENGINE_API_AUTH0_CLIENT_ID` | The caller's own Auth0 machine-to-machine client. |
| `POLICYENGINE_API_AUTH0_CLIENT_SECRET` | That client's secret. Read on the server only; never put it in a `NEXT_PUBLIC_*` or `VITE_*` variable. |

Production deployments use the production Public API and a production Auth0 client. Preview and development deployments use the Public API's staging service and a staging client. For local work, `vercel env pull` writes the development values.

## Tests

```bash
cd packages/public-api-forwarding && bun run test
```
