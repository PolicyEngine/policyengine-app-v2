/* eslint-disable @typescript-eslint/no-unused-vars -- placeholder until the implementation commit */
export function OPTIONS(_request: Request): Response {
  return new Response(null, { status: 501 });
}

export async function GET(
  _request: Request,
  _context: { params: Promise<{ country: string }> },
): Promise<Response> {
  return new Response(null, { status: 501 });
}
