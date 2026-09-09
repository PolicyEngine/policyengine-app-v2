Household reports require an explicit national or county SPM choice when the API advertises canonical measurement, retain that choice and the full calculation receipt through creation, modification and saved-report replay, and show provenance in the results methodology. Baseline and reform households retain their own inputs and policies. Reproduction notebooks use the recorded runtime versions and settings.

Calculation ownership is shared through persistence so duplicate viewers cannot race to overwrite a result. Typed terminal errors survive reopening. Correcting an unsupported year saves a new household snapshot for that period with unchanged values and geography; original households and policy dates remain intact. Ambiguous multi-year inputs require explicit correction.

Report creation, replacement and save-as-new reject mixed household/geography populations before household or simulation writes, including hydrated and stale state. Matching-type selection and visible correction guidance preserve independent same-type households. Earnings and marginal tax rate views retain corrective API SPM codes, stop deterministic retries, and show errors while a sibling calculation is pending. Invalid source/country or empty-simulation report loads display errors and retire stale drafts.

Validation for the final Fable fixes: 934 tests across 84 suites, all three forced workspace typechecks, both production builds, and scoped lint/format on all 29 changed TypeScript files pass. Regression-first tests cover both population directions in all three save modes, actual API error envelopes, retry behavior, and hydration ownership. Exact evidence and source bindings are in rollout/app-fable-fixes/FINAL-REPORT.md and validation.json.

All 18 notebook generation-source hashes match the prior qualification receipt. That prior qualification executed four generated notebooks against authenticated development wheels, with all 12,060 checked values agreeing with the installed calculation oracle. No notebook or expensive axes calculation was repeated for these error-only fixes. Original install cells remain unexecuted until the coordinated versions are published.

Depends on the coordinated API/model/worker release. Fable gate recording, live-service and final published-package verification remain required before promotion. Shared chrome and dependency manifests are unchanged. No deployment or merge was performed.

Fixes #1191.
