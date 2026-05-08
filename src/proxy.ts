import { NextResponse, type NextRequest } from "next/server";
import { get } from "@vercel/edge-config";

// Toggle the maintenance page from the Vercel dashboard:
//   Storage → Edge Config → set `maintenance` = true | false
// Local override: set MAINTENANCE_MODE=true in .env.local.
async function isMaintenance(): Promise<boolean> {
  if (process.env.MAINTENANCE_MODE === "true") return true;
  try {
    return (await get<boolean>("maintenance")) === true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  if (await isMaintenance()) {
    const url = request.nextUrl.clone();
    url.pathname = "/maintenance";
    return NextResponse.rewrite(url, {
      headers: { "Retry-After": "3600" },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|maintenance|.*\\.[a-zA-Z0-9]+$).*)",
  ],
};
