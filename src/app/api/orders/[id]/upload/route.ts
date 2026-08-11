import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { extractOrderToken, findOrderByToken, isEditable } from "@/lib/orders";
import { checkArtworkFile, sanitizeFilename } from "@/lib/file-check";
import { deleteArtwork, putArtwork } from "@/lib/s3";
import { generateStorageKey } from "@/lib/ids";
import { fail, handle, notFound, ok } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
// העלאת קובץ אמנות עשויה לקחת זמן על חיבור איטי
export const maxDuration = 120;

/**
 * POST /api/orders/:id/upload
 * גוף: multipart/form-data עם שדה "file"
 * אימות: כותרת x-order-token
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const limit = rateLimit(
      `upload:${clientIp(request.headers)}`,
      20,
      15 * 60 * 1000,
    );
    if (!limit.ok) {
      return fail(429, "RATE_LIMITED", "יותר מדי העלאות. נסו שוב מאוחר יותר.");
    }

    const { id } = await params;
    const order = await findOrderByToken(id, extractOrderToken(request));

    if (!order) return notFound("ההזמנה");

    if (!isEditable(order.status)) {
      return fail(
        409,
        "ORDER_LOCKED",
        order.status === "PAID"
          ? "ההזמנה כבר שולמה. להחלפת קובץ פנו אלינו."
          : "ההזמנה אינה פעילה יותר",
      );
    }

    // ההחזקה פגה בזמן שהלקוח מילא פרטים
    if (
      order.reservations.some(
        (r) => r.expiresAt && r.expiresAt.getTime() < Date.now(),
      )
    ) {
      return fail(
        409,
        "HOLD_EXPIRED",
        "זמן שמירת המשבצת הסתיים. יש להתחיל הזמנה מחדש.",
      );
    }

    const maxBytes = env().MAX_UPLOAD_MB * 1024 * 1024;

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return fail(400, "INVALID_FORM", "לא הצלחנו לקרוא את הקובץ שנשלח");
    }

    const file = form.get("file");

    if (!(file instanceof File)) {
      return fail(400, "NO_FILE", "לא צורף קובץ");
    }

    if (file.size === 0) {
      return fail(400, "EMPTY_FILE", "הקובץ ריק");
    }

    if (file.size > maxBytes) {
      return fail(
        413,
        "FILE_TOO_LARGE",
        `הקובץ גדול מדי. המגבלה היא ${env().MAX_UPLOAD_MB} מ״ב.`,
      );
    }

    const filename = sanitizeFilename(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    const check = checkArtworkFile(filename, buffer);
    if (!check.ok) {
      return fail(415, "UNSUPPORTED_FILE", check.message);
    }

    const key = generateStorageKey(order.reference, filename);

    await putArtwork(key, buffer, file.type || "application/octet-stream", {
      "order-ref": order.reference,
      "city": order.city.name,
      "sku": order.sku,
    });

    const previousKey = order.fileKey;

    await prisma.order.update({
      where: { id: order.id },
      data: {
        fileKey: key,
        fileName: filename,
        fileSize: file.size,
        fileMime: file.type || "application/octet-stream",
        fileUploadedAt: new Date(),
      },
    });

    // הקובץ הישן נמחק רק אחרי שהחדש נשמר והרשומה עודכנה
    if (previousKey && previousKey !== key) {
      try {
        await deleteArtwork(previousKey);
      } catch (error) {
        console.error("[upload] מחיקת קובץ קודם נכשלה:", error);
      }
    }

    return ok({
      file: {
        name: filename,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      },
    });
  });
}
