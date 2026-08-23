/**
 * מחולל PNG זעיר לזריעה בלבד.
 *
 * תמונות ההשראה האמיתיות (קיר מטבח, עגלת תינוק) יועלו על ידי
 * הלקוחה דרך מנגנון המדיה הרגיל. עד אז הזריעה צריכה *משהו* אמיתי
 * שיישב באחסון ויוגש דרך /api/media — כדי שהחלונות על התמונה
 * יהיו ניתנים לבדיקה מקצה לקצה. לכן מחוללים כאן PNG פשוט במקום
 * לגרור תלות בספריית תמונות שלמה.
 *
 * אין כאן עיבוד תמונה — רק כתיבת פורמט: חתימה, IHDR, IDAT, IEND.
 */
import { deflateSync } from "node:zlib";

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buffer: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buffer) {
    c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);

  return Buffer.concat([length, typeAndData, crc]);
}

export type Rgb = [number, number, number];

/**
 * תמונת רקע עם מדרג אנכי עדין בין שני גוונים, ורשת קווים חיוורת
 * שמקלה לוודא בעין שהחלונות יושבים במקום הנכון על התמונה.
 */
export function gradientPng(
  width: number,
  height: number,
  top: Rgb,
  bottom: Rgb,
): Buffer {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  let offset = 0;

  for (let y = 0; y < height; y += 1) {
    raw[offset] = 0; // filter type 0 (None)
    offset += 1;

    const t = y / Math.max(1, height - 1);

    for (let x = 0; x < width; x += 1) {
      // רשת עדינה כל 10% מרוחב/גובה — סרגל ויזואלי לאחוזים
      const onGrid =
        x % Math.round(width / 10) === 0 || y % Math.round(height / 10) === 0;
      const lift = onGrid ? 12 : 0;

      for (let channel = 0; channel < 3; channel += 1) {
        const value = top[channel] + (bottom[channel] - top[channel]) * t + lift;
        raw[offset] = Math.max(0, Math.min(255, Math.round(value)));
        offset += 1;
      }
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
