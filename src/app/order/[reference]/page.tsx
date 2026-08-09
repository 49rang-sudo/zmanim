import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, FileText, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site";
import { formatCm, formatDateTime, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/primitives";
import { SiteFooter, SiteHeader } from "@/components/landing/Landing";

export const dynamic = "force-dynamic";

const STATUS_VIEW = {
  PAID: {
    tone: "success" as const,
    label: "שולם",
    icon: CheckCircle2,
  },
  AWAITING_PAYMENT: {
    tone: "warn" as const,
    label: "ממתין לתשלום",
    icon: Clock,
  },
  PENDING: {
    tone: "neutral" as const,
    label: "בתהליך",
    icon: Clock,
  },
  CANCELLED: {
    tone: "danger" as const,
    label: "בוטלה",
    icon: XCircle,
  },
  EXPIRED: {
    tone: "danger" as const,
    label: "פג תוקף",
    icon: XCircle,
  },
};

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;

  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { reference: reference.toUpperCase() },
      include: { slot: true, city: true },
    }),
    getSiteSettings(),
  ]);

  if (!order) notFound();

  const view = STATUS_VIEW[order.status];
  const Icon = view.icon;
  const paid = order.status === "PAID";

  return (
    <>
      <SiteHeader content={settings.content} />

      <main className="mx-auto max-w-2xl px-5 py-14 sm:py-20">
        <div className="rounded-xl border border-line bg-surface p-7 shadow-e2 sm:p-9">
          <div
            className={`grid size-14 place-items-center rounded-full ${
              paid ? "bg-accent-soft text-accent" : "bg-surface-3 text-muted"
            }`}
          >
            <Icon className="size-7" />
          </div>

          <h1 className="mt-5 font-display text-3xl font-bold text-ink">
            {paid
              ? settings.content.wizard.successTitle
              : "סטטוס ההזמנה שלכם"}
          </h1>

          <p className="mt-2 leading-relaxed text-ink-2">
            {paid
              ? settings.content.wizard.successBody
              : "ההזמנה נקלטה במערכת. להלן הפרטים המעודכנים."}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Badge tone={view.tone}>{view.label}</Badge>
            <span className="tnum text-sm text-muted">
              מספר הזמנה: <strong className="text-ink">{order.reference}</strong>
            </span>
          </div>

          <dl className="mt-7 divide-y divide-line border-y border-line">
            <Row label="משבצת" value={order.slot.name} />
            <Row label="מק״ט" value={order.sku} />
            <Row
              label="מידות"
              value={formatCm(order.slot.widthCm, order.slot.heightCm)}
            />
            <Row label="עיר" value={order.city.name} />
            <Row
              label="קובץ להדפסה"
              value={order.fileName ?? "טרם הועלה"}
            />
            <Row label="נוצרה" value={formatDateTime(order.createdAt)} />
            {order.paidAt ? (
              <Row label="שולמה" value={formatDateTime(order.paidAt)} />
            ) : null}
          </dl>

          <div className="mt-6 flex items-baseline justify-between">
            <span className="font-display text-lg font-semibold text-ink">
              סכום
            </span>
            <span className="tnum font-display text-2xl font-bold text-accent">
              {formatPrice(order.priceAgorot)}
            </span>
          </div>

          {paid ? (
            <div className="mt-7 flex items-start gap-2.5 rounded-md bg-surface-2 p-4">
              <FileText className="mt-0.5 size-4 shrink-0 text-accent" />
              <p className="text-[13px] leading-relaxed text-ink-2">
                נעבור על הקובץ ונשלח אליכם הגהה דיגיטלית לאישור לפני
                המסירה לדפוס. שמרו את מספר ההזמנה למעקב.
              </p>
            </div>
          ) : null}

          <Link
            href="/"
            className="mt-7 inline-flex rounded-md border border-line px-5 py-2.5 text-sm font-semibold text-ink-2 transition-colors duration-200 ease-smooth hover:border-accent hover:text-accent"
          >
            חזרה לעמוד הראשי
          </Link>
        </div>
      </main>

      <SiteFooter content={settings.content} />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="truncate text-sm font-medium text-ink" title={value}>
        {value}
      </dd>
    </div>
  );
}
