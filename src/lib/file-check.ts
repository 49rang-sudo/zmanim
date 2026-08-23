/**
 * בדיקת קובץ אמנות.
 *
 * סיומת ו-MIME מגיעים מהדפדפן ולכן אינם ראיה — הבדיקה האמיתית היא
 * חתימת הבתים הראשונים של הקובץ. כך לא נכנס לדלי קובץ שמתחזה ל-PDF.
 */

type Signature = { bytes: number[]; offset?: number };

const SIGNATURES: Record<string, Signature[]> = {
  ".pdf": [{ bytes: [0x25, 0x50, 0x44, 0x46] }], // %PDF
  ".ai": [
    { bytes: [0x25, 0x50, 0x44, 0x46] }, // AI מודרני הוא PDF
    { bytes: [0x25, 0x21, 0x50, 0x53] }, // %!PS
  ],
  ".eps": [
    { bytes: [0x25, 0x21, 0x50, 0x53] }, // %!PS
    { bytes: [0xc5, 0xd0, 0xd3, 0xc6] }, // EPS עם תצוגה מקדימה
  ],
  ".jpg": [{ bytes: [0xff, 0xd8, 0xff] }],
  ".jpeg": [{ bytes: [0xff, 0xd8, 0xff] }],
  ".png": [{ bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  ".tif": [
    { bytes: [0x49, 0x49, 0x2a, 0x00] }, // little endian
    { bytes: [0x4d, 0x4d, 0x00, 0x2a] }, // big endian
  ],
  ".tiff": [
    { bytes: [0x49, 0x49, 0x2a, 0x00] },
    { bytes: [0x4d, 0x4d, 0x00, 0x2a] },
  ],
  ".psd": [{ bytes: [0x38, 0x42, 0x50, 0x53] }], // 8BPS
  ".zip": [
    { bytes: [0x50, 0x4b, 0x03, 0x04] },
    { bytes: [0x50, 0x4b, 0x05, 0x06] },
    { bytes: [0x50, 0x4b, 0x07, 0x08] },
  ],
};

/** סיומות שמותר להעלות — מקור האמת היחיד */
export const ALLOWED_EXTENSIONS = Object.keys(SIGNATURES);

export function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

function matches(buffer: Buffer, signature: Signature): boolean {
  const offset = signature.offset ?? 0;
  if (buffer.length < offset + signature.bytes.length) return false;
  return signature.bytes.every((b, i) => buffer[offset + i] === b);
}

export type FileCheckResult =
  | { ok: true; extension: string }
  | { ok: false; message: string };

export function checkArtworkFile(
  filename: string,
  buffer: Buffer,
): FileCheckResult {
  const extension = extensionOf(filename);

  if (!extension) {
    return { ok: false, message: "לקובץ אין סיומת" };
  }

  const signatures = SIGNATURES[extension];

  if (!signatures) {
    return {
      ok: false,
      message: `סוג הקובץ ${extension} אינו נתמך. מותר: ${ALLOWED_EXTENSIONS.join(", ")}`,
    };
  }

  if (!signatures.some((sig) => matches(buffer, sig))) {
    return {
      ok: false,
      message: `תוכן הקובץ אינו תואם לסיומת ${extension}. ודאו שהקובץ לא נפגם ושלא שיניתם את הסיומת ידנית.`,
    };
  }

  return { ok: true, extension };
}

/* ---------------------------------------------------------------
   תמונות מדיה (לוגו) — מסלול נפרד מקבצי האמנות להדפסה
   --------------------------------------------------------------- */

const IMAGE_SIGNATURES: Record<string, Signature[]> = {
  ".png": [{ bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  ".jpg": [{ bytes: [0xff, 0xd8, 0xff] }],
  ".jpeg": [{ bytes: [0xff, 0xd8, 0xff] }],
  ".webp": [{ bytes: [0x52, 0x49, 0x46, 0x46] }], // RIFF....WEBP
  ".svg": [], // טקסט — נבדק בנפרד למטה
};

export const ALLOWED_IMAGE_EXTENSIONS = Object.keys(IMAGE_SIGNATURES);

export const IMAGE_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export function checkImageFile(
  filename: string,
  buffer: Buffer,
): FileCheckResult {
  const extension = extensionOf(filename);
  const signatures = IMAGE_SIGNATURES[extension];

  if (!signatures) {
    return {
      ok: false,
      message: `סוג הקובץ אינו נתמך. מותר: ${ALLOWED_IMAGE_EXTENSIONS.join(", ")}`,
    };
  }

  if (extension === ".svg") {
    const text = buffer.toString("utf8", 0, Math.min(buffer.length, 4096));
    if (!/<svg[\s>]/i.test(text)) {
      return { ok: false, message: "הקובץ אינו SVG תקין" };
    }
    // SVG הוא מסמך שיכול להריץ סקריפט. חוסמים כאן, ובנוסף
    // ההגשה מתבצעת עם CSP נעול — שתי שכבות, לא אחת.
    if (/<script|onload=|javascript:/i.test(text)) {
      return {
        ok: false,
        message: "קובץ ה-SVG מכיל סקריפט ולכן נדחה. ייצאו אותו מחדש בלי קוד.",
      };
    }
    return { ok: true, extension };
  }

  if (!signatures.some((sig) => matches(buffer, sig))) {
    return {
      ok: false,
      message: `תוכן הקובץ אינו תואם לסיומת ${extension}`,
    };
  }

  return { ok: true, extension };
}

/* ---------------------------------------------------------------
   קבלות/חשבוניות — מסלול שלישי, צר בכוונה
   ---------------------------------------------------------------
   קונה מעלה צילום טלפון או סריקה, לא קובץ דפוס. לכן הרשימה כאן
   מצומצמת בהרבה מ-ALLOWED_EXTENSIONS: אין zip, אין psd/ai/eps.
   ככל שרשימת הסוגים שנכנסים לאחסון קצרה יותר, כך שטח התקיפה קטן.
   --------------------------------------------------------------- */

const RECEIPT_SIGNATURES: Record<string, Signature[]> = {
  ".pdf": [{ bytes: [0x25, 0x50, 0x44, 0x46] }], // %PDF
  ".jpg": [{ bytes: [0xff, 0xd8, 0xff] }],
  ".jpeg": [{ bytes: [0xff, 0xd8, 0xff] }],
  ".png": [{ bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  // RIFF בהיסט 0 ו-WEBP בהיסט 8 — שתי החתימות נבדקות יחד למטה
  ".webp": [{ bytes: [0x52, 0x49, 0x46, 0x46] }],
  // HEIC של אייפון: קופסת ftyp בהיסט 4, עם אחד ממותגי התאימות האלה
  ".heic": [
    { bytes: [0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63], offset: 4 },
    { bytes: [0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x78], offset: 4 },
    { bytes: [0x66, 0x74, 0x79, 0x70, 0x6d, 0x69, 0x66, 0x31], offset: 4 },
    { bytes: [0x66, 0x74, 0x79, 0x70, 0x6d, 0x73, 0x66, 0x31], offset: 4 },
  ],
  ".heif": [
    { bytes: [0x66, 0x74, 0x79, 0x70, 0x6d, 0x69, 0x66, 0x31], offset: 4 },
    { bytes: [0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63], offset: 4 },
  ],
};

export const ALLOWED_RECEIPT_EXTENSIONS = Object.keys(RECEIPT_SIGNATURES);

/** MIME לשמירה באחסון — לא נלקח מהדפדפן, נגזר מהסיומת שאומתה */
export const RECEIPT_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".heif": "image/heif",
};

export function checkReceiptFile(
  filename: string,
  buffer: Buffer,
): FileCheckResult {
  const extension = extensionOf(filename);

  if (!extension) {
    return { ok: false, message: "לקובץ אין סיומת" };
  }

  const signatures = RECEIPT_SIGNATURES[extension];

  if (!signatures) {
    return {
      ok: false,
      message: `אפשר להעלות תמונה או PDF בלבד (${ALLOWED_RECEIPT_EXTENSIONS.join(", ")})`,
    };
  }

  if (!signatures.some((sig) => matches(buffer, sig))) {
    return {
      ok: false,
      message: `תוכן הקובץ אינו תואם לסיומת ${extension}. נסו לצלם או לייצא את הקבלה מחדש.`,
    };
  }

  // WEBP הוא מכולת RIFF כללית — בלי הבדיקה השנייה גם WAV היה עובר
  if (
    extension === ".webp" &&
    !matches(buffer, { bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 })
  ) {
    return { ok: false, message: "הקובץ אינו WEBP תקין" };
  }

  return { ok: true, extension };
}

/** שם קובץ נקי לשמירה במטא-דאטה — בלי נתיבים ובלי תווי בקרה */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/^.*[\\/]/, "")
    .replace(/[\x00-\x1f\x7f]/g, "")
    .slice(0, 200)
    .trim() || "artwork";
}
