type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * מגביל קצב בזיכרון התהליך.
 * מספיק לפריסה של מופע יחיד (docker-compose על VPS).
 * אם מרחיבים ליותר ממופע אחד — להחליף ב-Redis, אחרת כל מופע
 * סופר בנפרד וההגבלה נעשית רופפת פי מספר המופעים.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  return {
    ok: true,
    remaining: limit - bucket.count,
    retryAfterSeconds: 0,
  };
}

/** ניקוי עצל כדי שהמפה לא תגדל ללא גבול */
export function sweepRateLimits(): void {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * X-Real-IP קודם, לא X-Forwarded-For: ה-nginx שלנו (nginx/luach.conf)
 * קובע את X-Real-IP בעצמו מ-$remote_addr (השכבה הרשתית — לקוח לא יכול
 * לזייף), אבל את X-Forwarded-For הוא רק *מוסיף* אליו
 * ($proxy_add_x_forwarded_for) — לקוח ששולח כותרת XFF מזויפת משלו
 * גורם ל-IP האמיתי שלו לנחות שני בשרשרת, בעוד שהערך הראשון (המזויף)
 * הוא זה שנלקח כאן. זה עקף בפועל את כל הגבלות הקצב באתר (יצירת הזמנה,
 * העלאת קובץ, פניות) — תוקן אחרי ביקורת אבטחה שאישרה זאת מול הקוד
 * וקונפיגורצית ה-nginx בפועל.
 */
export function clientIp(headers: Headers): string {
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
