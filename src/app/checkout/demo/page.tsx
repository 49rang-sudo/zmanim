import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { DemoCheckoutForm } from "./DemoCheckoutForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "סליקת הדגמה" };

/**
 * עמוד סליקה מדומה.
 *
 * מוצג רק כאשר ל-SKU של המשבצת לא הוגדר קישור סליקה אמיתי בלוח
 * הניהול. מרגע שמוגדר קישור — הלקוח מועבר לספק והעמוד הזה לא נטען.
 */
export default async function DemoCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  if (!ref) notFound();

  const order = await prisma.order.findUnique({
    where: { reference: ref.toUpperCase() },
    include: { slot: true, city: true },
  });

  if (!order) notFound();

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-4 rounded-md border border-warn/40 bg-[color-mix(in_srgb,var(--color-warn)_10%,transparent)] px-4 py-3">
          <p className="text-[13px] font-semibold leading-snug text-warn">
            מצב הדגמה — אין כאן חיוב אמיתי
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
            לא הוגדר קישור סליקה למק״ט {order.sku}. הגדירו אותו בלוח
            הניהול כדי להעביר לקוחות לספק הסליקה האמיתי.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-7 shadow-e2">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-muted">
            תשלום
          </p>

          <h1 className="mt-2 font-display text-2xl font-bold text-ink">
            {order.slot.name}
          </h1>

          <p className="mt-1 text-sm text-ink-2">
            {order.city.name} · הזמנה{" "}
            <span className="tnum font-semibold">{order.reference}</span>
          </p>

          <div className="mt-6 flex items-baseline justify-between border-t border-line pt-5">
            <span className="text-sm text-ink-2">לתשלום</span>
            <span className="tnum font-display text-3xl font-bold text-accent">
              {formatPrice(order.priceAgorot)}
            </span>
          </div>

          <DemoCheckoutForm
            reference={order.reference}
            alreadyPaid={order.status === "PAID"}
          />
        </div>
      </div>
    </main>
  );
}
