/* eslint-disable @typescript-eslint/no-unused-vars -- placeholder until the implementation commit */
export function OPTIONS(_request: Request): Response {
  return new Response(null, { status: 501 });
}

export async function POST(_request: Request): Promise<Response> {
  return new Response(null, { status: 501 });
}
