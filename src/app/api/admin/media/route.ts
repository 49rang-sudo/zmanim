import { randomBytes } from "node:crypto";
import { requireAdmin } from "@/lib/auth";
import { putArtwork } from "@/lib/s3";
import {
  ALLOWED_IMAGE_EXTENSIONS,
  checkImageFile,
  IMAGE_MIME,
  sanitizeFilename,
} from "@/lib/file-check";
import { fail, handle, ok, unauthorized } from "@/lib/api";

export const runtime = "nodejs";

const MAX_MEDIA_MB = 3;

/**
 * POST /api/admin/media
 * העלאת תמונה לשימוש בתוכן האתר (לוגו). מנהלים בלבד.
 * מחזיר כתובת יציבה שנשמרת בשדה content.brand.logoUrl.
 */
export async function POST(request: Request) {
  return handle(async () => {
    if (!(await requireAdmin())) return unauthorized();

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return fail(400, "INVALID_FORM", "לא הצלחנו לקרוא את הקובץ");
    }

    const file = form.get("file");
    if (!(file instanceof File)) {
      return fail(400, "NO_FILE", "לא צורף קובץ");
    }

    if (file.size > MAX_MEDIA_MB * 1024 * 1024) {
      return fail(
        413,
        "FILE_TOO_LARGE",
        `התמונה גדולה מדי. המגבלה היא ${MAX_MEDIA_MB} מ״ב.`,
      );
    }

    const filename = sanitizeFilename(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    const check = checkImageFile(filename, buffer);
    if (!check.ok) {
      return fail(415, "UNSUPPORTED_IMAGE", check.message);
    }

    const key = `media/${randomBytes(10).toString("hex")}${check.extension}`;

    await putArtwork(key, buffer, IMAGE_MIME[check.extension]);

    return ok({
      url: `/api/media/${key.replace(/^media\//, "")}`,
      allowed: ALLOWED_IMAGE_EXTENSIONS,
    });
  });
}
