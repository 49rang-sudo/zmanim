"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  ChevronDown,
  Download,
  Inbox,
  Undo2,
} from "lucide-react";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { cn, formatCm, formatDateTime, formatFileSize } from "@/lib/utils";

type Job = {
  id: string;
  reference: string;
  sku: string;
  contactName: string;
  businessName: string | null;
  phone: string;
  email: string;
  notes: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileUploadedAt: string | null;
  productionStatus: "WAITING" | "HANDLED";
  productionNote: string | null;
  artworkDownloadedAt: string | null;
  artworkDownloadedBy: string | null;
  paidAt: string | null;
  slot: { name: string; widthCm: number; heightCm: number };
  city: { id: string; name: string };
};

type Data = {
  waiting: Job[];
  handled: Job[];
  cities: { id: string; name: string; waitingCount: number }[];
  totals: { waiting: number; handled: number };
};

export function ProductionTab() {
  const [cityId, setCityId] = React.useState("ALL");
  const [data, setData] = React.useState<Data | null>(null);
  const [showHandled, setShowHandled] = React.useState(false);

  const load = React.useCallback(async () => {
    const res = await fetch(`/api/admin/production?cityId=${cityId}`, {
      cache: "no-store",
    });
    const body = await res.json();
    if (!res.ok) {
      toast.error(body?.error?.message ?? "טעינת העבודות נכשלה");
      return;
    }
    setData(body);
  }, [cityId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (job: Job, next: "WAITING" | "HANDLED") => {
    const res = await fetch(`/api/admin/production/${job.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productionStatus: next }),
    });
    if (!res.ok) {
      const body = await res.json();
      toast.error(body?.error?.message ?? "העדכון נכשל");
      return;
    }
    toast.success(next === "HANDLED" ? "סומן כטופל" : "הוחזר לטיפול");
    load();
  };

  if (!data) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-24" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* --- בורר עיר --- */}
      <div className="mb-5">
        <p className="mb-2 text-[12.5px] font-medium text-muted">
          בחרו עיר כדי לראות את מה שממתין לטיפול בה
        </p>
        <div className="flex flex-wrap gap-2">
          <CityChip
            label="כל הערים"
            count={data.cities.reduce((s, c) => s + c.waitingCount, 0)}
            active={cityId === "ALL"}
            onClick={() => setCityId("ALL")}
          />
          {data.cities.map((city) => (
            <CityChip
              key={city.id}
              label={city.name}
              count={city.waitingCount}
              active={cityId === city.id}
              onClick={() => setCityId(city.id)}
            />
          ))}
        </div>
      </div>

      {/* --- ממתין לטיפול --- */}
      <section className="mb-8">
        <h3 className="mb-3 flex items-center gap-2 font-display text-xl text-ink">
          ממתין לטיפול
          {data.totals.waiting > 0 ? (
            <Badge tone="warn">{data.totals.waiting}</Badge>
          ) : null}
        </h3>

        {data.waiting.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="size-6" />}
            title="הכול מטופל"
            body="אין כרגע עבודות שממתינות לגרפיקה בבחירה הזו."
          />
        ) : (
          <ul className="space-y-3">
            {data.waiting.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onDone={() => setStatus(job, "HANDLED")}
                onReload={load}
              />
            ))}
          </ul>
        )}
      </section>

      {/* --- טופל: מקופל כברירת מחדל --- */}
      <section>
        <button
          type="button"
          onClick={() => setShowHandled(!showHandled)}
          className="flex w-full items-center justify-between rounded-lg border border-line bg-surface-2 px-5 py-3.5 text-right transition-colors duration-200 hover:bg-surface-3"
        >
          <span className="flex items-center gap-2 font-display text-lg text-ink-2">
            טופל
            <Badge tone="neutral">{data.totals.handled}</Badge>
          </span>
          <ChevronDown
            className={cn(
              "size-4 text-muted transition-transform duration-200",
              showHandled && "rotate-180",
            )}
          />
        </button>

        {showHandled ? (
          data.handled.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted">
              עדיין לא טופלה אף עבודה בבחירה הזו.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.handled.map((job) => (
                <li
                  key={job.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-line bg-surface px-4 py-3 text-[13px]"
                >
                  <span className="tnum font-semibold text-ink">
                    {job.reference}
                  </span>
                  <span className="text-ink-2">{job.city.name}</span>
                  <span className="text-muted">{job.slot.name}</span>
                  <span className="truncate text-muted" title={job.fileName ?? ""}>
                    {job.fileName}
                  </span>

                  <span className="mr-auto flex items-center gap-3">
                    {job.artworkDownloadedAt ? (
                      <span className="text-[11.5px] text-muted">
                        {formatDateTime(job.artworkDownloadedAt)}
                        {job.artworkDownloadedBy
                          ? ` · ${job.artworkDownloadedBy}`
                          : ""}
                      </span>
                    ) : null}

                    <a
                      href={`/api/admin/orders/${job.id}/file`}
                      className="text-accent hover:underline"
                    >
                      הורדה חוזרת
                    </a>

                    <Button
                      size="sm"
                      variant="quiet"
                      onClick={() => setStatus(job, "WAITING")}
                    >
                      <Undo2 className="size-3.5" />
                      החזרה לטיפול
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </section>
    </div>
  );
}

/* --------------------------------------------------------------- */

function CityChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-semibold",
        "transition-colors duration-200 ease-smooth",
        active
          ? "bg-accent text-accent-ink"
          : "border border-line bg-surface text-ink-2 hover:border-accent",
      )}
    >
      {label}
      {count > 0 ? (
        <span
          className={cn(
            "tnum rounded-full px-1.5 text-[11px]",
            active ? "bg-white/20" : "bg-warn/15 text-warn",
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

function JobCard({
  job,
  onDone,
  onReload,
}: {
  job: Job;
  onDone: () => void;
  onReload: () => void;
}) {
  return (
    <li className="rounded-lg border border-line bg-surface p-5 shadow-e1">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="tnum font-semibold text-ink">{job.reference}</span>
            <Badge tone="accent">{job.city.name}</Badge>
            <Badge tone="neutral">
              {job.slot.name} · {formatCm(job.slot.widthCm, job.slot.heightCm)}
            </Badge>
            <span className="tnum text-[11.5px] text-muted">{job.sku}</span>
          </div>

          <p className="mt-1.5 text-[13.5px] text-ink-2">
            {job.businessName ?? job.contactName}
            <span dir="ltr" className="mr-2 text-muted">
              {job.phone}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* ההורדה עצמה היא מה שמסמן כטופל — לכן היא הפעולה הראשית */}
          <a
            href={`/api/admin/orders/${job.id}/file`}
            onClick={() => setTimeout(onReload, 1500)}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink shadow-accent transition-[transform,background-color] duration-200 ease-smooth hover:-translate-y-0.5 hover:bg-accent-strong"
          >
            <Download className="size-4" />
            הורדה
          </a>

          <Button size="sm" variant="subtle" onClick={onDone}>
            סימון כטופל
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-[12px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Inbox className="size-3.5" />
          <span className="truncate" title={job.fileName ?? ""}>
            {job.fileName}
          </span>
        </span>
        {job.fileSize ? <span className="tnum">{formatFileSize(job.fileSize)}</span> : null}
        {job.paidAt ? <span>שולם {formatDateTime(job.paidAt)}</span> : null}
      </div>

      {job.notes ? (
        <p className="mt-3 rounded-md bg-surface-2 p-3 text-[12.5px] leading-relaxed text-ink-2">
          <span className="font-semibold">הערת הלקוח: </span>
          {job.notes}
        </p>
      ) : null}
    </li>
  );
}
