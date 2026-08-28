"use client";

import * as React from "react";
import { toast } from "sonner";
import { Inbox, MessageSquare } from "lucide-react";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { cn, formatDateTime } from "@/lib/utils";

type Inquiry = {
  id: string;
  businessName: string | null;
  category: string;
  location: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  monthGuess: string | null;
  note: string | null;
  source: "FORM" | "POPUP";
  status: keyof typeof STATUS;
  adminNotes: string | null;
  createdAt: string;
};

const STATUS = {
  NEW: { label: "חדשה", tone: "warn" as const },
  CONTACTED: { label: "יצרנו קשר", tone: "accent" as const },
  MATCHED: { label: "נמצאה התאמה", tone: "success" as const },
  CLOSED: { label: "נסגרה", tone: "neutral" as const },
};

const STATUS_ORDER = ["NEW", "CONTACTED", "MATCHED", "CLOSED"] as const;

const SOURCE_LABEL = {
  FORM: "טופס הפנייה",
  POPUP: "פופאפ",
} as const;

const FILTERS = [
  { value: "ALL", label: "הכל" },
  ...STATUS_ORDER.map((value) => ({ value, label: STATUS[value].label })),
];

/**
 * פניות "בדקו לי התאמה" — לידים משני הטפסים הציבוריים (הטופס המלא
 * בתחתית עמוד הנחיתה והפופאפ הקצר). לא הזמנות: כאן אין כסף, אין
 * מקום תפוס ואין מהדורה — רק עסק שצריך שיחזרו אליו.
 */
export function InquiriesTab() {
  const [inquiries, setInquiries] = React.useState<Inquiry[] | null>(null);
  const [filter, setFilter] = React.useState<string>("ALL");

  const load = React.useCallback(async () => {
    const res = await fetch("/api/admin/inquiries", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data?.error?.message ?? "טעינת הפניות נכשלה");
      setInquiries([]);
      return;
    }
    setInquiries(data.inquiries);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (inquiry: Inquiry, next: string) => {
    // עדכון אופטימי — הרשימה יכולה להיות ארוכה, וטעינה מחדש בכל
    // לחיצה הייתה מקפיצה את המנהלת חזרה לראש העמוד.
    setInquiries((prev) =>
      prev
        ? prev.map((row) =>
            row.id === inquiry.id
              ? { ...row, status: next as Inquiry["status"] }
              : row,
          )
        : prev,
    );

    const res = await fetch(`/api/admin/inquiries/${inquiry.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data?.error?.message ?? "עדכון הפנייה נכשל");
      load();
      return;
    }
  };

  if (inquiries === null) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-24" />
        ))}
      </div>
    );
  }

  const visible =
    filter === "ALL"
      ? inquiries
      : inquiries.filter((row) => row.status === filter);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((option) => {
            const count =
              option.value === "ALL"
                ? inquiries.length
                : inquiries.filter((row) => row.status === option.value).length;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-[13px] font-semibold",
                  "transition-colors duration-200 ease-smooth",
                  filter === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
                )}
              >
                {option.label}
                <span className="tnum mr-1.5 opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Inbox className="size-6" />}
          title={filter === "ALL" ? "עדיין אין פניות" : "אין פניות בסטטוס הזה"}
          body='כל מי שממלא "בדקו לי התאמה" באתר — בטופס או בפופאפ — יופיע כאן.'
        />
      ) : (
        <div className="grid gap-2.5">
          {visible.map((inquiry) => (
            <article
              key={inquiry.id}
              className="rounded-2xl border border-border bg-card p-4 soft-shadow"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-heading text-[15px] font-bold text-foreground">
                    {inquiry.businessName || inquiry.category}
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    {inquiry.category}
                    {inquiry.location ? ` · ${inquiry.location}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge tone="neutral">{SOURCE_LABEL[inquiry.source]}</Badge>
                  <Badge tone={STATUS[inquiry.status].tone}>
                    {STATUS[inquiry.status].label}
                  </Badge>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
                {inquiry.contactName ? <span>{inquiry.contactName}</span> : null}
                {inquiry.phone ? (
                  <a
                    dir="ltr"
                    href={`tel:${inquiry.phone}`}
                    className="text-primary hover:text-accent-strong"
                  >
                    {inquiry.phone}
                  </a>
                ) : null}
                {inquiry.email ? (
                  <a
                    dir="ltr"
                    href={`mailto:${inquiry.email}`}
                    className="text-primary hover:text-accent-strong"
                  >
                    {inquiry.email}
                  </a>
                ) : null}
                <span className="text-muted-foreground">
                  {formatDateTime(inquiry.createdAt)}
                </span>
              </div>

              {inquiry.monthGuess || inquiry.note ? (
                <div className="mt-3 grid gap-1.5 rounded-xl bg-secondary/40 p-3 text-[13px] leading-relaxed text-muted-foreground">
                  {inquiry.monthGuess ? (
                    <p>
                      <span className="font-semibold text-foreground">
                        חודש/קונספט שחשבו עליו:{" "}
                      </span>
                      {inquiry.monthGuess}
                    </p>
                  ) : null}
                  {inquiry.note ? (
                    <p className="flex gap-2">
                      <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      {inquiry.note}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
                {STATUS_ORDER.map((value) => (
                  <button
                    key={value}
                    type="button"
                    disabled={inquiry.status === value}
                    onClick={() => changeStatus(inquiry, value)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-[12.5px] font-semibold",
                      "transition-colors duration-200 ease-smooth",
                      inquiry.status === value
                        ? "cursor-default bg-primary/15 text-primary"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
                    )}
                  >
                    {STATUS[value].label}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
