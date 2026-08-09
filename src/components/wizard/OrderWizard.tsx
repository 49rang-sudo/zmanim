"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Clock,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { CalendarMockup, type MockupSlot } from "./CalendarMockup";
import { CityPicker } from "./CityPicker";
import { TosDialog } from "./TosDialog";
import { UploadPanel } from "./UploadPanel";
import { Button } from "@/components/ui/button";
import { Badge, Eyebrow, Field, Input, Textarea } from "@/components/ui/primitives";
import { cn, formatCm, formatPrice } from "@/lib/utils";
import type { SiteContentData } from "@/lib/content";
import type { CityAvailability } from "@/lib/availability";

type OrderState = {
  id: string;
  reference: string;
  accessToken: string;
  holdExpiresAt: string;
};

type Props = {
  slots: MockupSlot[];
  content: SiteContentData;
  maxUploadMb: number;
};

const STEPS = ["משבצת", "עיר", "פרטים", "קובץ", "תשלום"] as const;

const STORAGE_KEY = "luach:order";

export function OrderWizard({ slots, content, maxUploadMb }: Props) {
  const [step, setStep] = React.useState(1);
  const [slot, setSlot] = React.useState<MockupSlot | null>(null);
  const [pendingSlot, setPendingSlot] = React.useState<MockupSlot | null>(null);
  const [tosOpen, setTosOpen] = React.useState(false);
  const [city, setCity] = React.useState<CityAvailability | null>(null);
  const [order, setOrder] = React.useState<OrderState | null>(null);
  const [uploaded, setUploaded] = React.useState<{
    name: string;
    size: number;
  } | null>(null);
  const [busy, setBusy] = React.useState(false);

  const [form, setForm] = React.useState({
    contactName: "",
    businessName: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const topRef = React.useRef<HTMLDivElement>(null);

  const goTo = (next: number) => {
    setStep(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* --- לחיצה על משבצת פותחת את התנאים לפני כל התחייבות --- */
  const handleSlotClick = (clicked: MockupSlot) => {
    setPendingSlot(clicked);
    setTosOpen(true);
  };

  const handleTosAccept = () => {
    setSlot(pendingSlot);
    // החלפת משבצת מאפסת את בחירת העיר — הזמינות תלויה בשתיהן
    setCity(null);
    goTo(2);
  };

  /* --- יצירת ההזמנה ותפיסת המשבצת --- */
  const createOrder = async () => {
    if (!slot || !city) return;

    const nextErrors: Record<string, string> = {};
    if (form.contactName.trim().length < 2)
      nextErrors.contactName = "נא למלא שם מלא";
    if (!/^[0-9+\-\s()]{9,20}$/.test(form.phone.trim()))
      nextErrors.phone = "מספר טלפון לא תקין";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()))
      nextErrors.email = "כתובת אימייל לא תקינה";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slotId: slot.id,
          cityId: city.id,
          tosAccepted: true,
          contactName: form.contactName.trim(),
          businessName: form.businessName.trim() || null,
          phone: form.phone.trim(),
          email: form.email.trim(),
          notes: form.notes.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // העיר התמלאה בזמן מילוי הטופס — מחזירים לבחירת עיר
        if (data?.error?.code === "CITY_FULL") {
          toast.error(data.error.message);
          setCity(null);
          goTo(2);
          return;
        }
        toast.error(data?.error?.message ?? "יצירת ההזמנה נכשלה");
        return;
      }

      const created: OrderState = {
        id: data.id,
        reference: data.reference,
        accessToken: data.accessToken,
        holdExpiresAt: data.holdExpiresAt,
      };

      setOrder(created);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(created));
      goTo(4);
    } catch {
      toast.error("שגיאת רשת. נסו שוב.");
    } finally {
      setBusy(false);
    }
  };

  /* --- מעבר לסליקה --- */
  const goToCheckout = async () => {
    if (!order) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/checkout`, {
        method: "POST",
        headers: { "x-order-token": order.accessToken },
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error?.message ?? "המעבר לתשלום נכשל");
        return;
      }

      window.location.href = data.checkoutUrl;
    } catch {
      toast.error("שגיאת רשת. נסו שוב.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={topRef} className="scroll-mt-24">
      <Stepper current={step} />

      {/* ============ שלב 1 — משבצת ============ */}
      {step === 1 ? (
        <section className="animate-[fade-up_0.45s_var(--ease-out-soft)_both]">
          <StepHeading
            title={content.wizard.chooseTitle}
            subtitle={content.wizard.chooseSubtitle}
          />
          <CalendarMockup
            slots={slots}
            calendar={content.calendar}
            selectedSlotId={slot?.id ?? null}
            onSelect={handleSlotClick}
          />
        </section>
      ) : null}

      {/* ============ שלב 2 — עיר ============ */}
      {step === 2 && slot ? (
        <section className="animate-[fade-up_0.45s_var(--ease-out-soft)_both]">
          <StepHeading
            title={content.wizard.cityTitle}
            subtitle={content.wizard.citySubtitle}
          />
          <CityPicker
            selectedCityId={city?.id ?? null}
            onSelect={setCity}
            messages={content.wizard}
          />

          <NavRow
            onBack={() => goTo(1)}
            backLabel="חזרה למשבצות"
            next={
              <Button disabled={!city} onClick={() => goTo(3)}>
                המשך לפרטים
                <ArrowLeft className="size-4" />
              </Button>
            }
          />
        </section>
      ) : null}

      {/* ============ שלב 3 — פרטים ============ */}
      {step === 3 && slot && city ? (
        <section className="animate-[fade-up_0.45s_var(--ease-out-soft)_both]">
          <StepHeading
            title={content.wizard.detailsTitle}
            subtitle={content.wizard.detailsSubtitle}
          />

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="rounded-lg border border-line bg-surface p-5 shadow-e1">
              <div className="grid gap-x-4 sm:grid-cols-2">
                <Field label="שם מלא *" htmlFor="contactName" error={errors.contactName}>
                  <Input
                    id="contactName"
                    value={form.contactName}
                    autoComplete="name"
                    aria-invalid={!!errors.contactName}
                    onChange={(e) =>
                      setForm({ ...form, contactName: e.target.value })
                    }
                  />
                </Field>

                <Field label="שם העסק" htmlFor="businessName">
                  <Input
                    id="businessName"
                    value={form.businessName}
                    autoComplete="organization"
                    onChange={(e) =>
                      setForm({ ...form, businessName: e.target.value })
                    }
                  />
                </Field>

                <Field label="טלפון *" htmlFor="phone" error={errors.phone}>
                  <Input
                    id="phone"
                    type="tel"
                    dir="ltr"
                    className="text-right"
                    value={form.phone}
                    autoComplete="tel"
                    aria-invalid={!!errors.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </Field>

                <Field label="אימייל *" htmlFor="email" error={errors.email}>
                  <Input
                    id="email"
                    type="email"
                    dir="ltr"
                    className="text-right"
                    value={form.email}
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </Field>
              </div>

              <Field
                label="הערות להזמנה"
                htmlFor="notes"
                hint="בקשות מיוחדות, הערות לעיצוב, או כל דבר שכדאי שנדע."
              >
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </Field>
            </div>

            <OrderSummary slot={slot} city={city} />
          </div>

          <NavRow
            onBack={() => goTo(2)}
            backLabel="חזרה לערים"
            next={
              <Button loading={busy} onClick={createOrder}>
                אישור והמשך להעלאה
                <ArrowLeft className="size-4" />
              </Button>
            }
          />
        </section>
      ) : null}

      {/* ============ שלב 4 — קובץ ============ */}
      {step === 4 && order && slot && city ? (
        <section className="animate-[fade-up_0.45s_var(--ease-out-soft)_both]">
          <StepHeading
            title={content.wizard.uploadTitle}
            subtitle={content.wizard.uploadSubtitle}
          />

          <HoldTimer expiresAt={order.holdExpiresAt} />

          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
            <UploadPanel
              orderId={order.id}
              accessToken={order.accessToken}
              maxUploadMb={maxUploadMb}
              uploaded={uploaded}
              onUploaded={(file) => {
                setUploaded(file);
                toast.success("הקובץ נקלט בהצלחה");
              }}
            />

            <OrderSummary slot={slot} city={city} reference={order.reference} />
          </div>

          <NavRow
            next={
              <Button disabled={!uploaded} onClick={() => goTo(5)}>
                המשך לתשלום
                <ArrowLeft className="size-4" />
              </Button>
            }
          />
        </section>
      ) : null}

      {/* ============ שלב 5 — תשלום ============ */}
      {step === 5 && order && slot && city ? (
        <section className="animate-[fade-up_0.45s_var(--ease-out-soft)_both]">
          <StepHeading
            title={content.wizard.payTitle}
            subtitle={content.wizard.paySubtitle}
          />

          <HoldTimer expiresAt={order.holdExpiresAt} />

          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="rounded-lg border border-line bg-surface p-6 shadow-e1">
              <dl className="divide-y divide-line">
                <SummaryRow label="מספר הזמנה" value={order.reference} mono />
                <SummaryRow label="משבצת" value={slot.name} />
                <SummaryRow label="מק״ט" value={slot.sku} mono />
                <SummaryRow
                  label="מידות"
                  value={formatCm(slot.widthCm, slot.heightCm)}
                />
                <SummaryRow label="עיר" value={city.name} />
                <SummaryRow label="קובץ" value={uploaded?.name ?? "—"} />
                <SummaryRow label="איש קשר" value={form.contactName} />
                <div className="flex items-center justify-between py-4">
                  <dt className="font-display text-lg font-semibold text-ink">
                    לתשלום
                  </dt>
                  <dd className="tnum font-display text-2xl font-bold text-accent">
                    {formatPrice(slot.priceAgorot)}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex items-start gap-2.5 rounded-md bg-surface-2 p-3.5">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />
                <p className="text-[12.5px] leading-relaxed text-ink-2">
                  התשלום מתבצע בעמוד המאובטח של ספק הסליקה. פרטי האשראי
                  אינם עוברים דרך האתר הזה ואינם נשמרים אצלנו.
                </p>
              </div>

              <Button
                size="lg"
                className="mt-5 w-full"
                loading={busy}
                onClick={goToCheckout}
              >
                <CreditCard className="size-4" />
                מעבר לתשלום מאובטח
              </Button>
            </div>

            <OrderSummary slot={slot} city={city} reference={order.reference} />
          </div>

          <NavRow onBack={() => goTo(4)} backLabel="חזרה לקובץ" />
        </section>
      ) : null}

      <TosDialog
        slot={pendingSlot}
        tos={content.tos}
        open={tosOpen}
        onOpenChange={setTosOpen}
        onAccept={handleTosAccept}
      />
    </div>
  );
}

/* =============================================================== */

function Stepper({ current }: { current: number }) {
  const progress = ((current - 1) / (STEPS.length - 1)) * 100;

  return (
    <>
      {/* פס ההתקדמות של האשף — הביטוי המרכזי של קווי המהירות בלוגו */}
      <div
        className="mb-4 h-[3px] overflow-hidden rounded-full bg-surface-3"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-label={`שלב ${current} מתוך ${STEPS.length}`}
      >
        <div
          className="progress-fill h-full rounded-full transition-[width] duration-500 ease-out-soft"
          style={{ width: `${Math.max(6, progress)}%` }}
        />
      </div>

      <ol className="mb-8 flex flex-wrap gap-2">
      {STEPS.map((label, index) => {
        const number = index + 1;
        const state =
          number < current ? "done" : number === current ? "active" : "todo";

        return (
          <li
            key={label}
            className={cn(
              "flex flex-1 items-center gap-2 rounded-md border px-3 py-2.5 text-[13px]",
              "transition-colors duration-200 ease-smooth",
              state === "active" &&
                "border-accent bg-accent-soft font-semibold text-accent-strong",
              state === "done" && "border-line bg-surface text-ink-2",
              state === "todo" && "border-line bg-surface text-muted",
            )}
          >
            <span
              className={cn(
                "tnum grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                state === "active" && "bg-accent text-accent-ink",
                state === "done" && "bg-success text-white",
                state === "todo" && "bg-line-2 text-surface",
              )}
            >
              {number}
            </span>
            <span className="truncate">{label}</span>
          </li>
        );
      })}
      </ol>
    </>
  );
}

function StepHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <header className="mb-6">
      <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
        {title}
      </h2>
      <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-ink-2">
        {subtitle}
      </p>
    </header>
  );
}

function NavRow({
  onBack,
  backLabel,
  next,
}: {
  onBack?: () => void;
  backLabel?: string;
  next?: React.ReactNode;
}) {
  return (
    <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
      {onBack ? (
        <Button variant="quiet" onClick={onBack}>
          <ArrowRight className="size-4" />
          {backLabel ?? "חזרה"}
        </Button>
      ) : (
        <span />
      )}
      {next}
    </div>
  );
}

/**
 * אינדיקטור מלאי אמיתי — נשען על הספירה בפועל מול הקיבולת.
 * הוא מוצג רק כשהמלאי באמת נמוך; דחיפות מזויפת שורפת אמון.
 */
function ScarcityNote({ city }: { city: CityAvailability }) {
  if (city.remaining > 5) return null;

  return (
    <p className="mt-3 flex items-start gap-2 rounded-md border border-warn/40 bg-[color-mix(in_srgb,var(--color-warn)_10%,transparent)] p-3 text-[12.5px] leading-snug text-warn">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
      <span>
        נותרו רק{" "}
        <strong className="tnum">{city.remaining}</strong> משבצות פנויות
        בלוח {city.name}
      </span>
    </p>
  );
}

function OrderSummary({
  slot,
  city,
  reference,
}: {
  slot: MockupSlot;
  city: CityAvailability;
  reference?: string;
}) {
  return (
    <aside className="h-fit rounded-lg border border-line bg-surface-2 p-5 shadow-e1 lg:sticky lg:top-24">
      <Eyebrow>ההזמנה שלכם</Eyebrow>

      <p className="mt-2 font-display text-xl font-semibold text-ink">
        {slot.name}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge tone="neutral">{formatCm(slot.widthCm, slot.heightCm)}</Badge>
        <Badge tone="neutral">{slot.sku}</Badge>
        <Badge tone="accent">{city.name}</Badge>
      </div>

      {reference ? (
        <p className="tnum mt-3 text-[12px] text-muted">
          מספר הזמנה: <span className="font-semibold">{reference}</span>
        </p>
      ) : null}

      <div className="mt-4 border-t border-line pt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink-2">סה״כ</span>
          <span className="tnum font-display text-2xl font-bold text-accent">
            {formatPrice(slot.priceAgorot)}
          </span>
        </div>
      </div>

      <ScarcityNote city={city} />
    </aside>
  );
}

function SummaryRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd
        className={cn(
          "truncate text-sm font-medium text-ink",
          mono && "tnum",
        )}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}

/** ספירה לאחור להחזקת המשבצת — יוצרת דחיפות אמיתית, לא מזויפת */
function HoldTimer({ expiresAt }: { expiresAt: string }) {
  const [left, setLeft] = React.useState(() =>
    Math.max(0, new Date(expiresAt).getTime() - Date.now()),
  );
  // הטווח המלא נלכד פעם אחת, כדי שהפס ירד באופן יציב
  const totalRef = React.useRef<number | null>(null);
  if (totalRef.current === null) totalRef.current = Math.max(left, 1);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setLeft(Math.max(0, new Date(expiresAt).getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const minutes = Math.floor(left / 60000);
  const seconds = Math.floor((left % 60000) / 1000);
  const urgent = left < 5 * 60 * 1000;
  const pct = Math.min(100, (left / totalRef.current) * 100);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border",
        urgent
          ? "border-warn/40 bg-[color-mix(in_srgb,var(--color-warn)_10%,transparent)]"
          : "border-line bg-surface-2",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 px-3.5 py-2.5 text-[13px]",
          urgent ? "text-warn" : "text-ink-2",
        )}
      >
        <Clock className="size-4 shrink-0" />
        {left > 0 ? (
          <span>
            המשבצת שמורה עבורכם עוד{" "}
            <span className="tnum font-bold">
              {minutes}:{String(seconds).padStart(2, "0")}
            </span>
          </span>
        ) : (
          <span className="font-semibold">
            זמן השמירה הסתיים. ייתכן שהמשבצת שוחררה — רעננו את העמוד.
          </span>
        )}
      </div>

      {/* הזמן שנותר, כסימון התקדמות — לא טקסט, ולכן מותר לו
          לשאת את הגרדיאנט המלא של הלוגו */}
      <div className="h-[3px] bg-surface-3">
        <div
          className={cn(
            "h-full transition-[width] duration-1000 ease-linear",
            urgent ? "bg-warn" : "progress-fill",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
