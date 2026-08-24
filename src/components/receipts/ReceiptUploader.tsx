"use client";

import * as React from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileUp,
  Gift,
  MapPin,
  Store,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Badge,
  EmptyState,
  Eyebrow,
  Field,
  Input,
} from "@/components/ui/primitives";
import { cn, formatFileSize, formatPrice } from "@/lib/utils";
import { ALLOWED_RECEIPT_EXTENSIONS } from "@/lib/file-check";
import type { ReceiptBusiness, ReceiptCity, ReceiptEdition } from "@/lib/receipts";

const STEPS = ["עיר", "עסק", "הקבלה"] as const;

type Props = { maxUploadMb: number };

export function ReceiptUploader({ maxUploadMb }: Props) {
  const [step, setStep] = React.useState(1);

  const [cities, setCities] = React.useState<ReceiptCity[] | null>(null);
  const [citiesError, setCitiesError] = React.useState<string | null>(null);
  const [city, setCity] = React.useState<ReceiptCity | null>(null);

  const [editions, setEditions] = React.useState<ReceiptEdition[] | null>(null);
  const [editionId, setEditionId] = React.useState<string | null>(null);
  const [business, setBusiness] = React.useState<ReceiptBusiness | null>(null);

  const [form, setForm] = React.useState({
    submitterName: "",
    phone: "",
    amountShekels: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<{ businessName: string } | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const topRef = React.useRef<HTMLDivElement>(null);

  const goTo = (next: number) => {
    setStep(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* --- הערים שיש בהן החודש למי להעלות --- */
  React.useEffect(() => {
    let cancelled = false;

    fetch("/api/receipts/cities", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) throw new Error(data.error.message);
        setCities(data.cities);
      })
      .catch((err) => {
        if (!cancelled) setCitiesError(err.message ?? "טעינת הערים נכשלה");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* --- בחירת עיר טוענת את החודשים הפתוחים ואת העסקים שבהם --- */
  React.useEffect(() => {
    if (!city) {
      setEditions(null);
      setEditionId(null);
      return;
    }

    let cancelled = false;
    setEditions(null);

    fetch(`/api/receipts/cities/${city.id}/editions`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const list: ReceiptEdition[] = data.editions ?? [];
        setEditions(list);
        setEditionId(list[0]?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setEditions([]);
      });

    return () => {
      cancelled = true;
    };
  }, [city]);

  const edition = editions?.find((e) => e.id === editionId) ?? null;

  const validate = () => {
    const next: Record<string, string> = {};

    if (form.submitterName.trim().length < 2) next.submitterName = "מה השם שלכם?";
    if (!/^[0-9+\-\s()]{9,20}$/.test(form.phone.trim()))
      next.phone = "מספר טלפון לא תקין";

    const amount = Number(form.amountShekels.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0)
      next.amountShekels = "מה היה סכום הקנייה?";
    else if (amount > 100000) next.amountShekels = "סכום גבוה מדי — בדקו את הספרות";

    if (!file) next.file = "צרפו צילום של הקבלה";
    else if (file.size > maxUploadMb * 1024 * 1024)
      next.file = `הקובץ גדול מדי. המגבלה היא ${maxUploadMb} מ״ב.`;

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!business || !file || !validate()) return;

    setBusy(true);
    setSubmitError(null);

    try {
      const body = new FormData();
      body.append("orderId", business.orderId);
      body.append("submitterName", form.submitterName.trim());
      body.append("phone", form.phone.trim());
      body.append(
        "amountShekels",
        form.amountShekels.replace(",", ".").trim(),
      );
      body.append("file", file);

      const res = await fetch("/api/receipts", { method: "POST", body });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data?.error?.message ?? "ההגשה נכשלה. נסו שוב.");
        return;
      }

      setDone({ businessName: data.businessName });
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setSubmitError("שגיאת רשת. בדקו את החיבור ונסו שוב.");
    } finally {
      setBusy(false);
    }
  };

  /* ============ אחרי הגשה ============ */
  if (done) {
    return (
      <div ref={topRef} className="scroll-mt-24">
        <div className="border border-line-2 bg-surface p-7 sm:p-9">
          <div className="grid size-14 place-items-center border border-line-2 bg-accent-soft text-accent">
            <CheckCircle2 className="size-7" />
          </div>

          <h2 className="mt-5 font-display text-3xl font-bold text-ink">
            הקבלה התקבלה
          </h2>

          <p className="mt-3 max-w-xl leading-relaxed text-ink-2">
            הקבלה שלכם נשלחה אל{" "}
            <strong className="text-ink">{done.businessName}</strong>. אחרי
            בדיקה קצרה היא תיכנס להגרלה של החודש, ואם תזכו — נתקשר למספר
            שהשארתם. אין צורך לעשות שום דבר נוסף.
          </p>

          <Button
            variant="ghost"
            className="mt-7"
            onClick={() => {
              setDone(null);
              setBusiness(null);
              setFile(null);
              setForm({ submitterName: "", phone: "", amountShekels: "" });
              setErrors({});
              goTo(2);
            }}
          >
            העלאת קבלה נוספת
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={topRef} className="scroll-mt-24">
      <Stepper current={step} />

      {/* ============ שלב 1 — עיר ============ */}
      {step === 1 ? (
        <section className="animate-[fade-up_0.45s_var(--ease-out-soft)_both]">
          <StepHeading
            title="באיזו עיר קיבלתם את הלוח?"
            subtitle="הלוח מחולק בכל עיר בנפרד, ולכן העסקים שמפרסמים בו שונים מעיר לעיר."
          />

          {citiesError ? (
            <EmptyState
              icon={<AlertCircle className="size-6" />}
              title="לא הצלחנו לטעון את רשימת הערים"
              body={citiesError}
            />
          ) : !cities ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="skeleton h-[92px]" />
              ))}
            </div>
          ) : cities.length === 0 ? (
            <EmptyState
              icon={<MapPin className="size-6" />}
              title="אין כרגע חודש פתוח להעלאת קבלות"
              body="ההגרלה נפתחת עם תחילת כל חודש פרסום. שווה לנסות שוב בעוד כמה ימים."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cities.map((option, index) => (
                <button
                  key={option.id}
                  type="button"
                  style={{ animationDelay: `${index * 35}ms` }}
                  onClick={() => {
                    setCity(option);
                    setBusiness(null);
                    goTo(2);
                  }}
                  className={cn(
                    "flex flex-col items-start gap-1.5 border p-4 text-right",
                    "animate-[fade-up_0.45s_var(--ease-out-soft)_both]",
                    "transition-colors duration-200 ease-smooth",
                    city?.id === option.id
                      ? "border-line-2 bg-accent-soft"
                      : "border-line bg-surface hover:border-line-2 hover:bg-surface-2",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="size-4 text-accent" />
                    <span className="font-display text-lg font-semibold text-ink">
                      {option.name}
                    </span>
                  </span>

                  {option.region ? (
                    <span className="text-[12px] text-muted">{option.region}</span>
                  ) : null}

                  <span className="tnum mono-label mt-1 text-[11.5px] text-muted">
                    {option.businessCount} עסקים משתתפים
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {/* ============ שלב 2 — חודש ועסק ============ */}
      {step === 2 && city ? (
        <section className="animate-[fade-up_0.45s_var(--ease-out-soft)_both]">
          <StepHeading
            title="אצל איזה עסק קניתם?"
            subtitle="הקבלה נספרת רק אצל העסק שממנו קניתם בפועל — בחרו אותו מהרשימה."
          />

          {!editions ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="skeleton h-[120px]" />
              ))}
            </div>
          ) : editions.length === 0 ? (
            <EmptyState
              icon={<Store className="size-6" />}
              title={`אין כרגע עסקים פתוחים להגרלה בלוח ${city.name}`}
              body="ייתכן שההגרלה של החודש כבר נסגרה. אפשר לבחור עיר אחרת."
              action={
                <Button variant="ghost" onClick={() => goTo(1)}>
                  בחירת עיר אחרת
                </Button>
              }
            />
          ) : (
            <>
              {editions.length > 1 ? (
                <div className="mb-5">
                  <Eyebrow>חודש הפרסום</Eyebrow>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {editions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setEditionId(option.id);
                          setBusiness(null);
                        }}
                        className={cn(
                          "border px-4 py-2 text-[13px] font-semibold",
                          "transition-colors duration-200 ease-smooth",
                          option.id === editionId
                            ? "border-line-2 bg-ink text-canvas"
                            : "border-line bg-surface text-ink-2 hover:border-line-2",
                        )}
                      >
                        {option.hebrewLabel}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {edition ? (
                <>
                  <p className="mb-4 text-[13px] text-muted">
                    לוח {city.name} · {edition.hebrewLabel} · אפשר להעלות עד{" "}
                    <strong className="text-ink-2">
                      {new Date(edition.receiptsLastDay).toLocaleDateString(
                        "he-IL",
                        { day: "numeric", month: "long" },
                      )}
                    </strong>
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {edition.businesses.map((option, index) => (
                      <button
                        key={option.orderId}
                        type="button"
                        style={{ animationDelay: `${index * 35}ms` }}
                        onClick={() => {
                          setBusiness(option);
                          goTo(3);
                        }}
                        className={cn(
                          "flex flex-col items-start gap-2 border p-4 text-right",
                          "animate-[fade-up_0.45s_var(--ease-out-soft)_both]",
                          "transition-colors duration-200 ease-smooth",
                          business?.orderId === option.orderId
                            ? "border-line-2 bg-accent-soft"
                            : "border-line bg-surface hover:border-line-2 hover:bg-surface-2",
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <Store className="size-4 text-accent" />
                          <span className="font-display text-lg font-semibold text-ink">
                            {option.businessName}
                          </span>
                        </span>

                        {option.monthlyBenefit ? (
                          <span className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-2">
                            <Gift className="mt-0.5 size-3.5 shrink-0 text-accent" />
                            {option.monthlyBenefit}
                          </span>
                        ) : (
                          <span className="text-[13px] text-muted">
                            ההטבה של החודש תפורסם על ידי העסק.
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </>
          )}

          <NavRow onBack={() => goTo(1)} backLabel="חזרה לבחירת עיר" />
        </section>
      ) : null}

      {/* ============ שלב 3 — הקבלה והפרטים ============ */}
      {step === 3 && city && business && edition ? (
        <section className="animate-[fade-up_0.45s_var(--ease-out-soft)_both]">
          <StepHeading
            title="הקבלה והפרטים שלכם"
            subtitle="ארבעה פרטים וסיימנו. הפרטים משמשים רק ליצירת קשר אם תזכו בהגרלה."
          />

          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="relative overflow-hidden border border-line bg-surface p-5 sm:p-6">
              {busy ? (
                <>
                  <div
                    className="curtain-bg pointer-events-none absolute inset-0 z-10 opacity-70"
                    aria-hidden
                  />
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-canvas/60 text-center">
                    <div className="size-8 animate-spin rounded-full border-2 border-ink/25 border-t-ink" />
                    <p className="font-semibold text-ink">שולח את הקבלה…</p>
                    <p className="max-w-[220px] text-[12.5px] text-ink-2">
                      רגע אחד, לא לרענן את הדף ולא ללחוץ שוב.
                    </p>
                  </div>
                </>
              ) : null}

              <div className="grid gap-x-4 sm:grid-cols-2">
                <Field
                  label="השם שלכם *"
                  htmlFor="submitterName"
                  error={errors.submitterName}
                >
                  <Input
                    id="submitterName"
                    value={form.submitterName}
                    autoComplete="name"
                    aria-invalid={!!errors.submitterName}
                    onChange={(e) =>
                      setForm({ ...form, submitterName: e.target.value })
                    }
                  />
                </Field>

                <Field
                  label="טלפון *"
                  htmlFor="phone"
                  error={errors.phone}
                  hint="לכאן נתקשר אם תזכו"
                >
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
              </div>

              <Field
                label="סכום הקנייה בשקלים *"
                htmlFor="amountShekels"
                error={errors.amountShekels}
                hint="הסכום שמופיע על הקבלה"
              >
                <Input
                  id="amountShekels"
                  type="text"
                  inputMode="decimal"
                  dir="ltr"
                  className="tnum text-right"
                  placeholder="149.90"
                  value={form.amountShekels}
                  aria-invalid={!!errors.amountShekels}
                  onChange={(e) =>
                    setForm({ ...form, amountShekels: e.target.value })
                  }
                />
              </Field>

              <Field
                label="הקבלה או החשבונית *"
                error={errors.file}
                hint={`צילום מהטלפון מספיק לגמרי · עד ${maxUploadMb} מ״ב`}
              >
                {file ? (
                  <div className="flex items-start gap-3 border border-line-2 bg-accent-soft p-4">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-accent" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink" title={file.name}>
                        {file.name}
                      </p>
                      <p className="tnum mt-0.5 text-xs text-muted">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <Button
                      variant="quiet"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      החלפה
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "flex w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-line-2 bg-surface-2 p-8 text-center",
                      "transition-colors duration-200 ease-smooth hover:bg-accent-soft",
                    )}
                  >
                    <FileUp className="size-6 text-accent" />
                    <span className="font-semibold text-ink">
                      לחצו כדי לצלם או לבחור קובץ
                    </span>
                    <span className="text-[12.5px] text-muted">
                      תמונה או PDF
                    </span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  className="sr-only"
                  accept={[...ALLOWED_RECEIPT_EXTENSIONS, "image/*"].join(",")}
                  onChange={(event) => {
                    const picked = event.target.files?.[0];
                    if (picked) {
                      setFile(picked);
                      setErrors({ ...errors, file: "" });
                    }
                    event.target.value = "";
                  }}
                />
              </Field>

              {submitError ? (
                <div className="mt-1 flex items-start gap-2 border border-danger/40 bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] p-3">
                  <X className="mt-0.5 size-4 shrink-0 text-danger" />
                  <p className="text-[13px] leading-snug text-danger">
                    {submitError}
                  </p>
                </div>
              ) : null}
            </div>

            <aside className="h-fit border border-line bg-surface-2 p-5 lg:sticky lg:top-24">
              <Eyebrow>ההגשה שלכם</Eyebrow>

              <p className="mt-2 font-display text-xl font-semibold text-ink">
                {business.businessName}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge tone="neutral">{city.name}</Badge>
                <Badge tone="accent">{edition.hebrewLabel}</Badge>
              </div>

              {business.monthlyBenefit ? (
                <p className="mt-4 border-t border-line pt-4 text-[13px] leading-relaxed text-ink-2">
                  {business.monthlyBenefit}
                </p>
              ) : null}

              {Number(form.amountShekels.replace(",", ".")) > 0 ? (
                <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
                  <span className="text-sm text-ink-2">סכום הקנייה</span>
                  <span className="tnum font-display text-xl font-bold text-accent">
                    {formatPrice(
                      Math.round(
                        Number(form.amountShekels.replace(",", ".")) * 100,
                      ),
                    )}
                  </span>
                </div>
              ) : null}

              <p className="mt-4 border-t border-line pt-4 text-[12px] leading-relaxed text-muted">
                הקבלה עוברת בדיקה קצרה לפני שהיא נכנסת להגרלה. הפרטים
                שלכם נשמרים אצלנו בלבד ומשמשים רק ליצירת קשר אם תזכו.
              </p>
            </aside>
          </div>

          <NavRow
            onBack={() => goTo(2)}
            backLabel="חזרה לבחירת עסק"
            next={
              <Button loading={busy} onClick={submit} className="shine-cta">
                שליחת הקבלה
                <ArrowLeft className="size-4" />
              </Button>
            }
          />
        </section>
      ) : null}
    </div>
  );
}

/* =============================================================== */

function Stepper({ current }: { current: number }) {
  const progress = ((current - 1) / (STEPS.length - 1)) * 100;

  return (
    <>
      <div
        className="mb-4 h-[3px] overflow-hidden bg-surface-3"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-label={`שלב ${current} מתוך ${STEPS.length}`}
      >
        <div
          className="progress-fill h-full transition-[width] duration-500 ease-out-soft"
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
                "flex flex-1 items-center gap-2 border px-3 py-2.5 text-[13px]",
                state === "active" &&
                  "border-line-2 bg-accent-soft font-semibold text-accent-strong",
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

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
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
