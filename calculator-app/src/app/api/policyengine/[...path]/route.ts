export const dynamic = "force-dynamic";

function notImplemented(_request: Request): Response {
  return new Response(null, { status: 501 });
}

export const OPTIONS = notImplemented;
export const GET = async (request: Request) => notImplemented(request);
export const POST = GET;
export const PATCH = GET;
export const DELETE = GET;
