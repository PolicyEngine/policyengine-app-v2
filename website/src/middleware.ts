import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getLegacyAppRedirectUrl } from "./lib/legacyRedirect";

export const config = {
  matcher: ["/:countryId/:path*", "/:countryId"],
};

export default function middleware(request: NextRequest) {
  const legacyRedirectUrl = getLegacyAppRedirectUrl(request.url);
  if (!legacyRedirectUrl) {
    return NextResponse.next();
  }

  return NextResponse.redirect(legacyRedirectUrl, 308);
}
