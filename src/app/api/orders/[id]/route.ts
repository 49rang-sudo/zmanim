import {
  extractOrderToken,
  findOrderByToken,
  resolveOrderSelections,
} from "@/lib/orders";
import { handle, notFound, ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/orders/:id?token=... — מצב ההזמנה עבור הלקוח */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const { id } = await params;
    const order = await findOrderByToken(id, extractOrderToken(request));

    if (!order) return notFound("ההזמנה");

    const detailsMap = await resolveOrderSelections([
      { id: order.id, selections: order.selections },
    ]);

    return ok({
      id: order.id,
      reference: order.reference,
      status: order.status,
      priceAgorot: order.priceAgorot,
      slot: {
        name: order.slot.name,
        sku: order.slot.sku,
        widthCm: order.slot.widthCm,
        heightCm: order.slot.heightCm,
      },
      city: { name: order.city.name },
      contactName: order.contactName,
      businessName: order.businessName,
      email: order.email,
      phone: order.phone,
      file: order.fileKey
        ? {
            name: order.fileName,
            size: order.fileSize,
            uploadedAt: order.fileUploadedAt,
          }
        : null,
      holdExpiresAt: order.reservations[0]?.expiresAt ?? null,
      selections: detailsMap.get(order.id) ?? [],
      paidAt: order.paidAt,
      createdAt: order.createdAt,
    });
  });
}
