# Policy parameter values

Use these rules whenever code reads, edits, compares, stores, or submits policy parameter values.

## Canonical representation

- `Parameter.values` is the authoritative in-memory and persisted representation of proposed policy values.
- Each value is a `ValueInterval` with inclusive `startDate` and `endDate` fields and a serialized PolicyEngine value.
- Keep interval bounds as canonical `YYYY-MM-DD` strings in state, storage, API payloads, and component interfaces. Never store or pass JavaScript `Date` or Day.js objects as policy interval bounds.
- PolicyEngine metadata uses years `0000` and `0001` for values effective from the beginning of available history. Treat these as valid four-digit policy years; the shared date helpers account for JavaScript date libraries' special handling of years below 100.
- Equal interval bounds are valid and represent a policy value that applies for one day.
- Do not add a parallel scalar `value` field to a policy, reform, draft, report provision, component state, fixture, or storage record. A parallel scalar can discard scheduled changes and become inconsistent with the dated values.
- Convert a scalar source with `convertScalarToValueIntervals` once, at the boundary where chat or another scalar-only external source enters the policy model.
- Convert an external dated range map with `convertDateRangeMapToValueIntervals`. Never select only one entry from a dated map: every scheduled value must survive conversion.
- Convert intervals back to a scalar only at an external interface that explicitly accepts one value for one date. Name the date used by that conversion.

## Reading and editing intervals

- Use `ValueIntervalCollection` for date lookup and interval mutation. Use `getIntervalAtDate` when callers need the complete interval and `getValueAtDate` when they only need its value.
- Use the shared ISO calendar-date helpers in `dateUtils` for validation, comparison, and whole-day arithmetic. They use Day.js internally and return date-only strings; do not parse policy interval bounds with JavaScript `Date` or use local-time date methods.
- Use the helpers in `policyParameterUpdate` for `Parameter` objects. `getParameterValueAtDate` supplies the editor fallback used by existing interfaces, `updateParameterValueAtDate` changes the selected interval without discarding other intervals, and `removeParameterInterval` removes a canonical interval through `ValueIntervalCollection` rather than using its display index against another array.
- Preserve every interval that the user did not edit. Deep-copy interval objects when data crosses a storage or component ownership boundary.
- When selecting a parameter from current-law metadata, initialize its editable values from the current-law schedule at the editing date and later. Do not extend the value at the editing date indefinitely, because that would replace later current-law changes before the user edits anything.
- Keep serializable `ValueInterval[]` in Redux, local storage, API models, and component state. `ValueIntervalCollection` is the operation layer, not a serialized state type.

## Current-law comparison

Current-law normalization in `policyCurrentLaw` is policy-specific. It deliberately handles metadata as potentially incomplete input, splits proposed ranges at current-law effective dates, compares structured values without coercion, and removes only the portions proven equal to current law. These behaviors differ from the general overlap operations in `ValueIntervalCollection`; do not replace either implementation with the other unless the shared interval abstraction first supports those semantics.

Before normalizing values for a save or run action, call `hasRequiredPolicyMetadata`. The action must remain disabled and its handler must return without making an API request unless all of the following are true:

- metadata is not loading and has no error;
- metadata belongs to the active country;
- the model version and current-law policy identifier are present; and
- each proposed parameter has a nonempty current-law value map with valid effective dates; and
- a current-law value applies at the start of every proposed interval.

`normalizePolicyParameters` conservatively preserves a parameter when its current-law values are unavailable. That behavior protects data transformations from destructive assumptions, so action-level readiness checks—not normalization—must prevent incomplete metadata from being submitted.

## Tests

Cover the complete boundary affected by a change. In particular, include external date-map conversion without value loss, untouched parameter selection across a future current-law change, multiple scheduled intervals, empty or invalid metadata maps, metadata loading and wrong-country states, legacy storage migration when storage shapes change, and asynchronous hydration when report data can arrive after a component's first render.
