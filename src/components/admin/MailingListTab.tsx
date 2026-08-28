"use client";

import * as React from "react";
import { toast } from "sonner";
import { Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/utils";

type Subscriber = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  createdAt: string;
};

export function MailingListTab() {
  const [subscribers, setSubscribers] = React.useState<Subscriber[] | null>(
    null,
  );

  const load = React.useCallback(async () => {
    const res = await fetch("/api/admin/mailing-list", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data?.error?.message ?? "טעינת רשימת התפוצה נכשלה");
      setSubscribers([]);
      return;
    }
    setSubscribers(data.subscribers);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  if (subscribers === null) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-14" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">{subscribers.length}</strong> נרשמים
          לרשימת התפוצה
        </p>
        <Button
          variant="soft"
          size="sm"
          disabled={subscribers.length === 0}
          onClick={() => window.open("/api/admin/mailing-list/export", "_blank")}
        >
          <Download className="size-4" />
          ייצוא ל-CSV (Google Contacts)
        </Button>
      </div>

      {subscribers.length === 0 ? (
        <EmptyState
          icon={<Mail className="size-6" />}
          title="עדיין אין נרשמים"
          body="ברגע שמבקרים יצטרפו לרשימת התפוצה דרך החלונית שקופצת באתר, הם יופיעו כאן."
        />
      ) : (
        <div className="grid gap-2.5">
          {subscribers.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 soft-shadow"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">
                  {s.firstName} {s.lastName}
                </p>
                <p className="truncate text-[12.5px] text-muted-foreground" dir="ltr">
                  {s.email}
                  {s.phone ? ` · ${s.phone}` : ""}
                </p>
              </div>
              <p className="text-[12px] text-muted-foreground">
                נרשם/ה {formatDateTime(s.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
