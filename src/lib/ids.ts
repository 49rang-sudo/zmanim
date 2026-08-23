import { randomBytes, timingSafeEqual } from "node:crypto";

// שרת בלבד — משתמש ב-node:crypto

/** מזהה הזמנה קריא לבני אדם — בלי תווים מתבלבלים (0/O, 1/I) */
const REF_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateReference(): string {
  const bytes = randomBytes(6);
  let out = "";
  for (const b of bytes) out += REF_ALPHABET[b % REF_ALPHABET.length];
  return `LU-${out}`;
}

/** טוקן יכולת — מאפשר ללקוח להמשיך את ההזמנה שלו בלי חשבון משתמש */
export function generateAccessToken(): string {
  return randomBytes(32).toString("base64url");
}

export function generateStorageKey(orderRef: string, filename: string): string {
  return storageKey("artwork", orderRef, filename);
}

/**
 * קבלה של קונה — קידומת נפרדת (receipts/) מקבצי האמנות, כדי
 * שאפשר יהיה להחיל עליה מדיניות שמירה/הרשאות משלה. מסמך פרטי:
 * שמור באותו דלי פרטי, בלי כתובת ציבורית.
 */
export function generateReceiptKey(orderRef: string, filename: string): string {
  return storageKey("receipts", orderRef, filename);
}

function storageKey(prefix: string, orderRef: string, filename: string): string {
  const ext = filename.includes(".")
    ? filename.slice(filename.lastIndexOf(".")).toLowerCase()
    : "";
  const stamp = new Date().toISOString().slice(0, 10);
  return `${prefix}/${stamp}/${orderRef}-${randomBytes(8).toString("hex")}${ext}`;
}

/**
 * השוואה עמידה בפני התקפות תזמון.
 * חובה לכל השוואת טוקן/חתימה — `===` דולף מידע דרך זמן הריצה.
 */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
