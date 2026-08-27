import { NextResponse, type NextRequest } from "next/server";

/**
 * מצב תחזוקה — האתר עדיין באמצע עבודה, לא מוכן להצגה ציבורית.
 * חוסם רק את מה שאורח רגיל היה רואה; האדמין ממשיך לעבוד כרגיל
 * כדי שהעבודה על האתר לא תיעצר.
 *
 * כובה (2026-08-27) — בעלת האתר אישרה מפורשות שהאתר עובר לחי הערב.
 */
const MAINTENANCE_MODE = false;

const ALLOWED_PREFIXES = [
  "/admin",
  "/api",
  "/_next",
  "/favicon.ico",
  "/brand",
  "/robots.txt",
];

const COMING_SOON_HTML = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>זמנים — האתר כבר בדרך אליכם</title>
<style>
  body { margin:0; min-height:100dvh; display:flex; flex-direction:column; align-items:center;
    justify-content:center; gap:28px; padding:24px; text-align:center;
    background-color:#f2efe9; color:#17131f; font-family:"Segoe UI",Arial,sans-serif; }
  img { width:160px; height:auto; }
  h1 { font-size:clamp(1.7rem,5vw,2.6rem); font-weight:800; max-width:20ch; line-height:1.25; margin:0; }
  p { font-size:17px; line-height:1.7; color:#5a5266; max-width:42ch; margin:0; }
</style>
</head>
<body>
  <img src="/brand/zmanim-logo.png" alt="זמנים" />
  <h1>האתר כבר בדרך אליכם...</h1>
  <p>אנחנו עובדים כרגע על השלמת הלוח. חוזרים בקרוב עם משהו יפה.</p>
</body>
</html>`;

export function middleware(request: NextRequest) {
  if (!MAINTENANCE_MODE) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // מחזירים HTML ישירות מה-middleware, בלי rewrite/פנייה פנימית — rewrite
  // גרר בקשה פנימית שהתבלבלה בפרוטוקול (nginx מסיים SSL, Node מדבר HTTP
  // בלבד בפורט 3000) וקרס ל-500 על כל האתר. תגובה ישירה עוקפת את זה לגמרי.
  return new NextResponse(COMING_SOON_HTML, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
