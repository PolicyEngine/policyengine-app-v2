/**
 * The shape of the Public API's economy request, on a reserved `.test` host
 * that never resolves: if the guard were missing, these tests would still
 * send nothing to a real server.
 */
export const UNMOCKED_ECONOMY_URL = 'https://api.policyengine.test/uk/economy/98557/over/2';

/** A fetch mock's answer. */
export const MOCKED_ECONOMY_BODY = { status: 'computing' };
