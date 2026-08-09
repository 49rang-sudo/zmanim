import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // בלי זה, שרת הפיתוח מחזיר 403 לכל בקשת /_next/* שמגיעה
  // ממקור זר. התוצאה חמורה ומטעה: ה-HTML מוגש כרגיל, אבל React
  // לא מבצע הידרציה — הכפתורים נראים תקינים ופשוט לא מגיבים.
  // נדרש כדי לצפות באתר דרך מנהרה בזמן פיתוח.
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "*.ngrok-free.app",
    "*.loca.lt",
  ],

  // דרוש לתמונת Docker רזה — Next אורז שרת עצמאי עם רק
  // התלויות שבאמת בשימוש
  output: "standalone",

  // קבצי אמנות להדפסה כבדים — מרימים את תקרת ה-Server Action.
  // ההעלאה עצמה עוברת ב-Route Handler עם בדיקת גודל משלו.
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },

  // כותרות אבטחה בסיסיות. CSP נשאר מכוון-Next (הוא זקוק ל-inline styles).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // קבצי לקוח לעולם לא נשמרים במטמון משותף
        source: "/api/admin/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
