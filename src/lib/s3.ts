import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env";

let client: S3Client | null = null;

export function s3(): S3Client {
  if (client) return client;
  const e = env();

  client = new S3Client({
    region: e.S3_REGION,
    endpoint: e.S3_ENDPOINT,
    // MinIO ו-R2 מחייבים path-style; S3 אמיתי עובד עם virtual-hosted
    forcePathStyle: e.S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: e.S3_ACCESS_KEY_ID,
      secretAccessKey: e.S3_SECRET_ACCESS_KEY,
    },
  });

  return client;
}

export function bucket(): string {
  return env().S3_BUCKET;
}

/**
 * מטא-דאטה של S3 נשלח ככותרות HTTP, ולכן חייב להיות ASCII בלבד.
 * ערך עברי כמו "ירושלים" מפיל את הבקשה ב-ERR_INVALID_CHAR, ולכן
 * הערכים עוברים קידוד אחוזים והמפתחות מנוקים מכל מה שאינו ASCII.
 * הפענוח בצד השני: decodeURIComponent.
 */
function encodeMetadata(
  metadata: Record<string, string>,
): Record<string, string> {
  const safe: Record<string, string> = {};

  for (const [key, value] of Object.entries(metadata)) {
    const safeKey = key.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
    if (!safeKey) continue;
    safe[safeKey] = encodeURIComponent(value);
  }

  return safe;
}

/**
 * קבצי אמנות הם פרטיים. לעולם לא מוחזרת כתובת ציבורית —
 * ההורדה עוברת דרך presigned URL קצר-מועד שנוצר רק אחרי אימות מנהל.
 */
export async function putArtwork(
  key: string,
  body: Buffer,
  contentType: string,
  metadata?: Record<string, string>,
): Promise<void> {
  await s3().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: metadata ? encodeMetadata(metadata) : undefined,
      // כתיבה פרטית מפורשת, גם אם מדיניות הדלי רופפת
      ACL: "private",
    }),
  );
}

export async function createDownloadUrl(
  key: string,
  downloadFilename: string,
  expiresInSeconds = 300,
): Promise<string> {
  // כותרת content-disposition מוטמעת בחתימה, כך שהקובץ יורד בשם המקורי
  const safeName = downloadFilename.replace(/["\\\r\n]/g, "_");

  return getSignedUrl(
    s3(),
    new GetObjectCommand({
      Bucket: bucket(),
      Key: key,
      ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(safeName)}`,
    }),
    { expiresIn: expiresInSeconds },
  );
}

export async function getArtworkStream(key: string) {
  const res = await s3().send(
    new GetObjectCommand({ Bucket: bucket(), Key: key }),
  );
  return res.Body;
}

export async function deleteArtwork(key: string): Promise<void> {
  await s3().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}

/** נקרא פעם אחת בזריעה — יוצר את הדלי אם אינו קיים (נוח מול MinIO מקומי) */
export async function ensureBucket(): Promise<void> {
  const name = bucket();
  try {
    await s3().send(new HeadBucketCommand({ Bucket: name }));
  } catch {
    await s3().send(new CreateBucketCommand({ Bucket: name }));
  }
}
