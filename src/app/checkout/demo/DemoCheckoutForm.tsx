"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DemoCheckoutForm({
  reference,
  alreadyPaid,
}: {
  reference: string;
  alreadyPaid: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const pay = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/checkout/demo/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error?.message ?? "אישור התשלום נכשל");
        return;
      }

      router.push(`/order/${reference}`);
    } catch {
      toast.error("שגיאת רשת. נסו שוב.");
    } finally {
      setBusy(false);
    }
  };

  if (alreadyPaid) {
    return (
      <Button
        className="mt-6 w-full"
        variant="subtle"
        onClick={() => router.push(`/order/${reference}`)}
      >
        ההזמנה כבר שולמה — למעבר לסטטוס
      </Button>
    );
  }

  return (
    <>
      <Button size="lg" className="mt-6 w-full" loading={busy} onClick={pay}>
        <CreditCard className="size-4" />
        אישור תשלום (הדגמה)
      </Button>

      <p className="mt-3 text-center text-[11.5px] text-muted">
        לחיצה כאן מדמה אישור מספק הסליקה ומסמנת את ההזמנה כמשולמת.
      </p>
    </>
  );
}
