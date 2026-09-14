# Policy parameter values

Use these rules whenever code reads, edits, compares, stores, or submits policy parameter values.

## Canonical representation

- `Parameter.values` is the authoritative in-memory and persisted representation of proposed policy values.
- Each value is a `ValueInterval` with inclusive `startDate` and `endDate` fields and a serialized PolicyEngine value.
- Do not add a parallel scalar `value` field to a policy, reform, draft, report provision, component state, fixture, or storage record. A parallel scalar can discard scheduled changes and become inconsistent with the dated values.
- Convert a scalar source to `ValueInterval[]` once, at the boundary where search, tracked-bill, chat, or other external data enters the policy model.
- Convert intervals back to a scalar only at an external interface that explicitly accepts one value for one date. Name the date used by that conversion.

## Reading and editing intervals

- Use `ValueIntervalCollection` for date lookup and interval mutation. Use `getIntervalAtDate` when callers need the complete interval and `getValueAtDate` when they only need its value.
- Use the helpers in `policyParameterUpdate` for `Parameter` objects. `getParameterValueAtDate` supplies the editor fallback used by existing interfaces, and `updateParameterValueAtDate` changes the selected interval without discarding other intervals.
- Preserve every interval that the user did not edit. Deep-copy interval objects when data crosses a storage or component ownership boundary.
- Keep serializable `ValueInterval[]` in Redux, local storage, API models, and component state. `ValueIntervalCollection` is the operation layer, not a serialized state type.

## Current-law comparison

Current-law normalization in `policyCurrentLaw` is policy-specific. It deliberately handles metadata as potentially incomplete input, splits proposed ranges at current-law effective dates, compares structured values without coercion, and removes only the portions proven equal to current law. These behaviors differ from the general overlap operations in `ValueIntervalCollection`; do not replace either implementation with the other unless the shared interval abstraction first supports those semantics.

Before normalizing values for a save or run action, call `hasRequiredPolicyMetadata`. The action must remain disabled and its handler must return without making an API request unless all of the following are true:

- metadata is not loading and has no error;
- metadata belongs to the active country;
- the model version and current-law policy identifier are present; and
- current-law values exist for every proposed parameter.

`normalizePolicyParameters` conservatively preserves a parameter when its current-law values are unavailable. That behavior protects data transformations from destructive assumptions, so action-level readiness checks—not normalization—must prevent incomplete metadata from being submitted.

## Tests

Cover the complete boundary affected by a change. In particular, include multiple scheduled intervals, metadata loading and wrong-country states, legacy storage migration when storage shapes change, and asynchronous hydration when report data can arrive after a component's first render.
