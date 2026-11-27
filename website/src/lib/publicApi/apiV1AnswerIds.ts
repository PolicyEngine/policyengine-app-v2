// The IDs API v1 gives its answers, in their response headers: a request
// ID on every answer, and an observability ID, which leads to the
// simulation service's logs, on the answer to a request that started a
// calculation.

export const REQUEST_ID_HEADER = "X-PolicyEngine-Request-Id";
export const OBSERVABILITY_ID_HEADER = "X-PolicyEngine-Observability-Id";

export interface ApiV1AnswerIds {
  readonly requestId: string | null;
  readonly observabilityId: string | null;
}

export const NO_ANSWER_IDS: ApiV1AnswerIds = {
  requestId: null,
  observabilityId: null,
};

/** The IDs in an answer's headers. */
export function answerIdsOf(response: Response): ApiV1AnswerIds {
  return {
    requestId: response.headers.get(REQUEST_ID_HEADER),
    observabilityId: response.headers.get(OBSERVABILITY_ID_HEADER),
  };
}
