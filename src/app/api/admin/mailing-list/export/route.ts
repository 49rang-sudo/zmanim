import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { unauthorized } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// כותרות בפורמט ייצוא אנשי קשר של Google — כדי שהקובץ ייבא ישירות
// ל-Google Contacts. ממלאים רק שם/מייל/טלפון, שאר העמודות ריקות
// בכוונה (זה כל מה שרשימת התפוצה הזו אוספת).
const HEADERS = [
  "Name Prefix",
  "First Name",
  "Middle Name",
  "Last Name",
  "Name Suffix",
  "Phonetic First Name",
  "Phonetic Middle Name",
  "Phonetic Last Name",
  "Nickname",
  "File As",
  "E-mail 1 - Label",
  "E-mail 1 - Value",
  "Phone 1 - Label",
  "Phone 1 - Value",
  "Address 1 - Label",
  "Address 1 - Country",
  "Address 1 - Street",
  "Address 1 - Extended Address",
  "Address 1 - City",
  "Address 1 - Region",
  "Address 1 - Postal Code",
  "Address 1 - PO Box",
  "Organization Name",
  "Organization Title",
  "Organization Department",
  "Birthday",
  "Event 1 - Label",
  "Event 1 - Value",
  "Relation 1 - Label",
  "Relation 1 - Value",
  "Website 1 - Label",
  "Website 1 - Value",
  "Custom Field 1 - Label",
  "Custom Field 1 - Value",
  "Notes",
  "Labels",
] as const;

function csvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function csvRow(values: string[]): string {
  return values.map(csvField).join(",") + "\r\n";
}

/**
 * GET /api/admin/mailing-list/export — קובץ CSV לייבוא ל-Google
 * Contacts, בסדר העמודות של הייצוא הסטנדרטי של Google.
 */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const subscribers = await prisma.mailingListSubscriber.findMany({
    orderBy: { createdAt: "desc" },
  });

  let csv = "﻿" + csvRow([...HEADERS]);

  for (const s of subscribers) {
    const row = Array(HEADERS.length).fill("");
    row[1] = s.firstName; // First Name
    row[3] = s.lastName; // Last Name
    row[9] = `${s.firstName} ${s.lastName}`; // File As
    row[11] = s.email; // E-mail 1 - Value
    row[13] = s.phone ?? ""; // Phone 1 - Value
    csv += csvRow(row);
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mailing-list.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
