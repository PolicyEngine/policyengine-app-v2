PolicyEngine now publishes TRACE Transparent Research Objects (TROs) — cryptographically pinned provenance records — for its certified releases, its microdata builds, and individual simulation runs. Each TRO binds every artifact that determined a result by SHA-256 hash, and a single command verifies any TRO by re-fetching and re-hashing what it claims.

This work delivers:

- A certified bundle TRO in every `policyengine` Python release, pinning the country model wheel, the calibrated dataset, and both release manifests
- A build TRO for every populace microdata build, pinning restricted inputs that third parties cannot re-download
- Run records: self-contained, offline-verifiable directories whose fingerprint serves as a citable identifier for a single simulation
- `policyengine trace-tro-verify`, which re-hashes every artifact a TRO claims
- Zenodo mirroring of certification records, adding durable DOIs under a published preservation policy

## Why versioning alone was not enough

PolicyEngine merges changes daily — rule corrections, new calibration targets, expanded program coverage — and each change can move published results. We version everything: the US model alone has shipped hundreds of releases on PyPI, and our calibrated datasets carry versioned release manifests on Hugging Face. A researcher who pins exact versions can reproduce our numbers.

Two gaps remained. First, results from the web app: a researcher who scored a reform at policyengine.org last fall had no durable record binding that result to the model and data versions that produced it. When one Brookings team returned to publish months later, recovering the exact configuration required manual work by our staff. Second, the calibrated microdata itself: our builds consume inputs like the IRS Public Use File that the public cannot freely download, so even a fully versioned pipeline is not one a reader can re-run.

Tara Watson at Brookings raised the publication-replicability question directly, and Lars Vilhuber — the American Economic Association's Data Editor — pointed us to the [TRACE specification](https://transparency-certified.github.io/trace-specification/), an emerging standard his collaborators are developing and piloting with European central banks. We met with the TRACE team, Watson, and John Sabelhaus in April 2026; this release implements what came out of that conversation.

## What a TRO does

A Transparent Research Object is a JSON-LD document using the [TROv vocabulary](https://w3id.org/trace/trov/0.1#). It lists every artifact in an analysis — code, data, configuration, outputs — with a SHA-256 hash and a location for each, and a composition fingerprint computed over the sorted artifact hashes. A reader who cannot re-run the analysis can still check that specific files produced specific results; any modification to any artifact changes the fingerprint.

The TRACE team's framing shaped where we applied it. A TRO adds little for a researcher running our open-source Python package on public data: they can reinstall the same pinned versions and re-run. It adds the most where re-running is blocked — builds that consume restricted inputs, and simulations that institutions run on researchers' behalf.

## The three TRO layers

| Layer | What it pins | Where it lives |
|-------|--------------|----------------|
| Bundle TRO | Country model wheel, calibrated dataset, bundle and data release manifests | Ships inside every `policyengine` release |
| Build TRO | Microdata build outputs, restricted inputs, calibration gates, build code version | Published alongside each populace release on Hugging Face |
| Run record | Reform, input dataset, results, and the bundle TRO, for one simulation | A directory the simulation writes; fingerprint is the citable id |

The build TRO addresses the restricted-input case directly. The populace build that now powers US simulations derives from the CPS ASEC, the IRS Public Use File, the Survey of Consumer Finances, SIPP, CPS-ORG, MEPS, and the ACS. A re-runner cannot fetch the Public Use File without agreeing to IRS terms, so the TRO records its hash in the composition and flags its location as access-restricted: anyone who later obtains the same file can confirm it is byte-identical to what our build consumed, without us redistributing anything.

The run record addresses the vanished-result case. After running a simulation in `policyengine.py`:

```python
record = simulation.write_run_record("./record")
print(record.composition_fingerprint)
```

The directory holds the reform (as parameter values with effective dates), the input dataset reference, the output hashes, the certified bundle TRO, and a run TRO binding them. A paper cites the fingerprint; the directory verifies offline forever. One refusal is deliberate: reforms expressed as arbitrary Python functions raise an error rather than producing a record, because a certificate that cannot bind the code that shaped the result would claim more than it can support.

## Verification is a command

```bash
policyengine trace-tro-verify record/run.trace.tro.jsonld
```

```
ok: bundle_tro (bundle.trace.tro.jsonld)
ok: reform (reform.json)
ok: input (input.json)
ok: results (results.json)
fingerprint: ok
```

The verifier fetches each artifact from the location the TRO declares — over HTTPS for published artifacts, from the record directory for local ones — recomputes its SHA-256, and recomputes the composition fingerprint. Artifacts a verifier knowingly cannot fetch, such as restricted inputs, can be skipped explicitly and are reported as skipped rather than silently ignored.

Verification establishes that the bytes are exactly the bytes the TRO binds. It does not make our runs third-party audited: when we run our own code and emit our own TRO, that is institution-backed self-attestation, and we describe it as such. The verifiable parts are the hashes anyone can recompute; institutional accountability covers the rest.

## Preservation

Hugging Face hosts our primary artifacts but publishes no preservation policy, and its DOIs are deletable short URLs. Zenodo publishes a preservation policy backed by CERN infrastructure and mints durable DOIs. `policyengine zenodo-mirror` deposits each release's certification record — the manifests and TRO that let a future reader verify any copy of the data — with a hard licence gate: dataset bytes are never deposited from private source repositories, which keeps UK Data Service-licensed microdata where its licence requires while still preserving the hashes that make it verifiable.

## What comes next

The web app does not yet emit run records; that integration — a "cite this result" action backed by the same primitives — is the open workstream, alongside cryptographic signing of TROs and durable addressing commitments for run-record storage. The full analysis, including what TRACE does not solve for us, is in our public [case study](https://github.com/PolicyEngine/policyengine.py/blob/main/docs/trace-case-study.md).

We thank Lars Vilhuber, the TRACE specification team, Tara Watson, and John Sabelhaus for the conversations that scoped this work. The TRACE project is [seeking use cases](https://transparency-certified.github.io/trace-specification/) as the specification evolves; we will continue contributing implementation experience from microsimulation.
