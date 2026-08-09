import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem?: number },
) => Promise<Buffer>;

// פרמטרים בהתאם להמלצת OWASP ל-scrypt
const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;
const MAXMEM = 64 * 1024 * 1024;

/**
 * scrypt מ-node:crypto — בלי תלות חיצונית ובלי מגבלת 72 הבתים של bcrypt.
 * הפורמט השמור מכיל את הפרמטרים, כדי שנוכל לחזק אותם בעתיד
 * בלי לשבור סיסמאות קיימות.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password.normalize("NFKC"), salt, KEYLEN, {
    N,
    r: R,
    p: P,
    maxmem: MAXMEM,
  });
  return [
    "scrypt",
    N,
    R,
    P,
    salt.toString("base64"),
    key.toString("base64"),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  try {
    const [scheme, n, r, p, saltB64, keyB64] = stored.split("$");
    if (scheme !== "scrypt") return false;

    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(keyB64, "base64");

    const actual = await scryptAsync(
      password.normalize("NFKC"),
      salt,
      expected.length,
      { N: Number(n), r: Number(r), p: Number(p), maxmem: MAXMEM },
    );

    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** דרישות מינימום לסיסמת ניהול */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < 10) return "הסיסמה חייבת להכיל לפחות 10 תווים";
  if (!/[A-Za-z]/.test(password)) return "הסיסמה חייבת להכיל אות לועזית";
  if (!/[0-9]/.test(password)) return "הסיסמה חייבת להכיל ספרה";
  return null;
}
