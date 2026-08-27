import { NextResponse, type NextRequest } from "next/server";

/**
 * מצב תחזוקה — האתר עדיין באמצע עבודה, לא מוכן להצגה ציבורית.
 * חוסם רק את מה שאורח רגיל היה רואה; האדמין ממשיך לעבוד כרגיל
 * כדי שהעבודה על האתר לא תיעצר.
 */
const MAINTENANCE_MODE = true;

const ALLOWED_PREFIXES = [
  "/admin",
  "/api",
  "/_next",
  "/favicon.ico",
  "/brand",
  "/robots.txt",
];

export function middleware(request: NextRequest) {
  if (!MAINTENANCE_MODE) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }
  if (pathname === "/coming-soon") return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/coming-soon";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
