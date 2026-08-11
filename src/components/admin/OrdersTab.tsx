"use client";

import * as React from "react";
import { toast } from "sonner";
import { Download, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, EmptyState, Input } from "@/components/ui/primitives";
import { cn, formatDateTime, formatFileSize, formatPrice } from "@/lib/utils";
import { AD_PACKAGES } from "@/lib/packages";

type AdminOrder = {
  id: string;
  reference: string;
  status: keyof typeof STATUS;
  priceAgorot: number;
  sku: string;
  contactName: string;
  businessName: string | null;
  phone: string;
  email: string;
  notes: string | null;
  adminNotes: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileUploadedAt: string | null;
  createdAt: string;
  paidAt: string | null;
  packageTier: string | null;
  packageEditions: number;
  selectionDetails: {
    editionId: string;
    slotId: string;
    editionLabel: string;
    gregorianMonth: number;
    gregorianYear: number;
    slotName: string;
    slotSku: string;
  }[];
  slot: { name: string; sku: string; widthCm: number; heightCm: number };
  city: { name: string };
  reservations: { expiresAt: string | null }[];
};

const STATUS = {
  PENDING: { label: "בתהליך", tone: "neutral" as const },
  AWAITING_PAYMENT: { label: "ממתין לתשלום", tone: "warn" as const },
  PAID: { label: "שולם", tone: "success" as const },
  CANCELLED: { label: "בוטלה", tone: "danger" as const },
  EXPIRED: { label: "פג תוקף", tone: "danger" as const },
};

const FILTERS = [
  { value: "ALL", label: "הכל" },
  { value: "PAID", label: "שולם" },
  { value: "AWAITING_PAYMENT", label: "ממתין לתשלום" },
  { value: "PENDING", label: "בתהליך" },
  { value: "CANCELLED", label: "בוטלו" },
];

export function OrdersTab() {
  const [orders, setOrders] = React.useState<AdminOrder[] | null>(null);
  const [counts, setCounts] = React.useState<Record<string, number>>({});
  const [status, setStatus] = React.useState("ALL");
  const [query, setQuery] = React.useState("");
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setOrders(null);
    const params = new URLSearchParams({ status });
    if (query.trim()) params.set("q", query.trim());

    const res = await fetch(`/api/admin/orders?${params}`, {
      cache: "no-store",
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data?.error?.message ?? "טעינת ההזמנות נכשלה");
      setOrders([]);
      return;
    }

    setOrders(data.orders);
    setCounts(data.counts ?? {});
  }, [status, query]);

  React.useEffect(() => {
    const timer = setTimeout(load, query ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  const changeStatus = async (order: AdminOrder, next: string) => {
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data?.error?.message ?? "עדכון הסטטוס נכשל");
      return;
    }

    toast.success("הסטטוס עודכן");
    load();
  };

  return (
    <div>
      {/* --- סרגל סינון --- */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatus(filter.value)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[13px] font-semibold",
                "transition-colors duration-200 ease-smooth",
                status === filter.value
                  ? "bg-accent text-accent-ink"
                  : "bg-surface text-ink-2 border border-line hover:border-accent",
              )}
            >
              {filter.label}
              {filter.value !== "ALL" && counts[filter.value] ? (
                <span className="tnum mr-1.5 opacity-70">
                  {counts[filter.value]}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="relative mr-auto w-full sm:w-64">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש לפי שם, מספר, אימייל…"
            className="pr-9"
          />
        </div>
      </div>

      {/* --- טבלה --- */}
      {orders === null ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-6" />}
          title="אין הזמנות להצגה"
          body="כשיגיעו הזמנות הן יופיעו כאן, עם כל הפרטים והקבצים."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-surface shadow-e1">
          <table className="w-full min-w-[760px] text-right text-sm">
            <thead className="border-b border-line bg-surface-2 text-[12px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">הזמנה</th>
                <th className="px-4 py-3 font-semibold">מפרסם</th>
                <th className="px-4 py-3 font-semibold">משבצת</th>
                <th className="px-4 py-3 font-semibold">עיר</th>
                <th className="px-4 py-3 font-semibold">סכום</th>
                <th className="px-4 py-3 font-semibold">סטטוס</th>
                <th className="px-4 py-3 font-semibold">קובץ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-line">
              {orders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr
                    onClick={() =>
                      setExpanded(expanded === order.id ? null : order.id)
                    }
                    className="cursor-pointer transition-colors duration-150 hover:bg-surface-2"
                  >
                    <td className="px-4 py-3">
                      <div className="tnum font-semibold text-ink">
                        {order.reference}
                      </div>
                      <div className="text-[11.5px] text-muted">
                        {formatDateTime(order.createdAt)}
                      </div>
                      {order.packageTier ? (
                        <Badge tone="accent" className="mt-1">
                          {AD_PACKAGES.find((p) => p.id === order.packageTier)?.label ?? order.packageTier}
                          {" · "}
                          {order.selectionDetails.length} מהדורות
                        </Badge>
                      ) : null}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">
                        {order.contactName}
                      </div>
                      {order.businessName ? (
                        <div className="text-[11.5px] text-muted">
                          {order.businessName}
                        </div>
                      ) : null}
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-ink-2">{order.slot.name}</div>
                      <div className="tnum text-[11.5px] text-muted">
                        {order.sku}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-ink-2">{order.city.name}</td>

                    <td className="tnum px-4 py-3 font-semibold text-ink">
                      {formatPrice(order.priceAgorot)}
                    </td>

                    <td className="px-4 py-3">
                      <Badge tone={STATUS[order.status].tone}>
                        {STATUS[order.status].label}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">
                      {order.fileName ? (
                        <a
                          href={`/api/admin/orders/${order.id}/file`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent hover:underline"
                        >
                          <Download className="size-3.5" />
                          הורדה
                        </a>
                      ) : (
                        <span className="text-[12.5px] text-muted">—</span>
                      )}
                    </td>
                  </tr>

                  {expanded === order.id ? (
                    <tr className="bg-surface-2">
                      <td colSpan={7} className="px-4 py-5">
                        <div className="grid gap-5 md:grid-cols-3">
                          <DetailBlock title="פרטי קשר">
                            <p dir="ltr" className="text-right">
                              {order.phone}
                            </p>
                            <p dir="ltr" className="text-right">
                              {order.email}
                            </p>
                          </DetailBlock>

                          <DetailBlock title="קובץ להדפסה">
                            {order.fileName ? (
                              <>
                                <p className="truncate" title={order.fileName}>
                                  {order.fileName}
                                </p>
                                <p className="tnum text-muted">
                                  {order.fileSize
                                    ? formatFileSize(order.fileSize)
                                    : ""}
                                  {order.fileUploadedAt
                                    ? ` · ${formatDateTime(order.fileUploadedAt)}`
                                    : ""}
                                </p>
                              </>
                            ) : (
                              <p className="text-muted">טרם הועלה קובץ</p>
                            )}
                          </DetailBlock>

                          <DetailBlock title="שינוי סטטוס">
                            <div className="flex flex-wrap gap-1.5">
                              {(
                                ["PAID", "AWAITING_PAYMENT", "CANCELLED"] as const
                              ).map((next) => (
                                <Button
                                  key={next}
                                  size="sm"
                                  variant={
                                    order.status === next ? "primary" : "subtle"
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    changeStatus(order, next);
                                  }}
                                >
                                  {STATUS[next].label}
                                </Button>
                              ))}
                            </div>
                          </DetailBlock>

                          {order.selectionDetails.length > 0 ? (
                            <DetailBlock
                              title="מהדורות ומשבצות שנרכשו"
                              className="md:col-span-3"
                            >
                              <div className="flex flex-wrap gap-1.5">
                                {order.selectionDetails.map((sel) => (
                                  <Badge key={sel.editionId} tone="accent">
                                    {sel.editionLabel} ({sel.gregorianMonth}/
                                    {sel.gregorianYear}) · {sel.slotName} (
                                    {sel.slotSku})
                                  </Badge>
                                ))}
                              </div>
                            </DetailBlock>
                          ) : null}

                          {order.notes ? (
                            <DetailBlock
                              title="הערות הלקוח"
                              className="md:col-span-3"
                            >
                              <p className="leading-relaxed">{order.notes}</p>
                            </DetailBlock>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DetailBlock({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        {title}
      </p>
      <div className="space-y-0.5 text-[13.5px] text-ink-2">{children}</div>
    </div>
  );
}
