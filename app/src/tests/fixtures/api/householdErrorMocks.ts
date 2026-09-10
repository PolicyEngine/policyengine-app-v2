// Shape bound to policyengine-api household_routes._spm_error_response and
// response_factory._make_error_response: HTTP 400 with errors[{code, message}].
// HTTP 200 uses the same envelope only as a legacy compatibility regression.
export function householdErrorResponse(detail: { code: string; message: string }, status = 400) {
  return new Response(
    JSON.stringify({ status: 'error', message: detail.message, result: null, errors: [detail] }),
    { status }
  );
}
