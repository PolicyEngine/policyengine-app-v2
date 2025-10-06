# Deprecated components

## Frames (src/frames/)

The following Frame components are only used in tests and not in actual pages:

- `src/frames/policy/PolicyParameterSelectorFrame.tsx` - replaced by PolicyCreationFlow modal
- `src/frames/policy/PolicyCreationFrame.tsx` - replaced by PolicyCreationFlow modal
- `src/frames/policy/PolicySubmitFrame.tsx` - replaced by PolicyCreationFlow modal

These frames were part of an older flow-based architecture. The app now uses modal-based components:
- PolicyCreationFlow (src/components/policy/PolicyCreationFlow.tsx) is used for policy creation

Consider removing these deprecated frames after verifying tests can be updated.
