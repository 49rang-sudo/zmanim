"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import {
  CalendarMockup,
  isSameType,
  type BoardImage,
  type MockupSlot,
} from "./CalendarMockup";
import { CityPicker } from "./CityPicker";
import { TierPicker } from "./TierPicker";
import { TosDialog } from "./TosDialog";
import { MailingListDialog } from "./MailingListDialog";
import { UploadPanel } from "./UploadPanel";
import { SumitCardForm } from "./SumitCardForm";
import { Button } from "@/components/ui/button";
import { Badge, Eyebrow, Field, Input, Textarea } from "@/components/ui/primitives";
import { cn, formatCm, formatPrice } from "@/lib/utils";
import { AD_PACKAGES, sumWithPackageDiscount } from "@/lib/packages";
import type { SiteContentData } from "@/lib/content";
import type { CityAvailability, EditionAvailability } from "@/lib/availability";

type OrderState = {
  id: string;
  reference: string;
  accessToken: string;
  holdExpiresAt: string;
  priceAgorot: number;
  packageTier: string | null;
  packageEditions: number;
};

type Props = {
  /** תמונות ההשראה והחלונות שעליהן — שטח המכירה של הלוח */
  board: BoardImage[];
  content: SiteContentData;
  maxUploadMb: number;
  /** null כשעדיין לא הוגדרו credentials אמיתיים מ-sumit */
  sumitCompanyId: number | null;
  sumitApiPublicKey: string | null;
};

const STEPS = ["עיר", "משבצת", "פרטים", "קובץ", "תשלום"] as const;

const STORAGE_KEY = "luach:order";

export function OrderWizard({
  board,
  content,
  maxUploadMb,
  sumitCompanyId,
  sumitApiPublicKey,
}: Props) {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  /** המשבצת שקבעה את "הסוג" (גודל) הנרכש בהזמנה הנוכחית */
  const [anchorSlot, setAnchorSlot] = React.useState<MockupSlot | null>(null);
  const [tosOpen, setTosOpen] = React.useState(false);
  const [mailingModalOpen, setMailingModalOpen] = React.useState(false);
  const [mailingListStatus, setMailingListStatus] = React.useState<
    "pending" | "joined" | "skipped"
  >("pending");
  const mailingModalShown = React.useRef(false);
  const [city, setCity] = React.useState<CityAvailability | null>(null);
  const [editions, setEditions] = React.useState<EditionAvailability[] | null>(
    null,
  );
  const [viewedEditionId, setViewedEditionId] = React.useState<string | null>(
    null,
  );
  /** הבחירה בפועל לכל מהדורה: editionId -> המשבצת שנבחרה בה (יכולה
   * להיות משבצת אחרת בכל חודש, כל עוד היא מאותו סוג/גודל כמו העוגן) */
  const [selections, setSelections] = React.useState<
    Record<string, MockupSlot>
  >({});
  /** null = עדיין לא נבחרה דרגה (בודד/חבילה) עבור המשבצת הנוכחית */
  const [targetEditionsCount, setTargetEditionsCount] = React.useState<
    number | null
  >(null);
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
    /** ההטבה שהעסק מציע לקוני הלוח — הבסיס להגרלה החודשית */
    monthlyBenefit: "",
    notes: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const topRef = React.useRef<HTMLDivElement>(null);

  // בחירת עיר טוענת את המהדורות הפתוחות שלה — זה מה שמניע את
  // דפדוף החודשים ואת צביעת התפוסה בשלב הבא.
  React.useEffect(() => {
    if (!city) {
      setEditions(null);
      setViewedEditionId(null);
      return;
    }

    let cancelled = false;
    fetch(`/api/cities/${city.id}/editions`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const list: EditionAvailability[] = data.editions ?? [];
        setEditions(list);
        setViewedEditionId(list[0]?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) toast.error("טעינת המהדורות נכשלה");
      });

    return () => {
      cancelled = true;
    };
  }, [city]);

  // שלב נוכחי דרך ref כדי לא לפרק ולבנות מחדש את מאזיני היציאה (ואת
  // "בליעת" ההיסטוריה) בכל מעבר שלב — רק כדי לקרוא את הערך העדכני.
  const stepRef = React.useRef(step);
  React.useEffect(() => {
    stepRef.current = step;
  }, [step]);

  // מוקפצת רק בכוונת יציאה (Exit-Intent) — לא מיד עם הכניסה לאתר ולא
  // חוסמת את מסלול ההזמנה. בדסקטופ: הסמן יוצא דרך חלק העליון של
  // החלון (לכיוון סגירת לשונית / שורת הכתובת). במובייל: לחיצה על
  // "חזרה". מזוינת רק 4 שניות אחרי הטעינה כדי לא לתפוס גלישה חולפת.
  // מושתקת בשלב התשלום (5) — הרגע הכי קריטי בקנייה, לא המקום להפריע.
  // בקשת לקוחה מפורשת לאיסוף לידים ממי שעוזב בלי להזמין.
  React.useEffect(() => {
    if (mailingListStatus !== "pending") return;

    let armed = false;
    const armTimer = setTimeout(() => {
      armed = true;
    }, 4000);

    const trigger = () => {
      if (!armed || mailingModalShown.current || stepRef.current === 5) return;
      mailingModalShown.current = true;
      setMailingModalOpen(true);
    };

    const onMouseLeave = (event: MouseEvent) => {
      if (event.clientY <= 0) trigger();
    };

    // "בולען" ערך היסטוריה אחד כדי לתפוס לחיצת "חזרה" יחידה במובייל,
    // בלי לתקוע לצמיתות את כפתור החזרה — לחיצה שנייה עוזבת כרגיל.
    history.pushState(null, "", location.href);
    const onPopState = () => {
      window.removeEventListener("popstate", onPopState);
      trigger();
    };

    document.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("popstate", onPopState);

    return () => {
      clearTimeout(armTimer);
      document.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("popstate", onPopState);
    };
  }, [mailingListStatus]);

  const goTo = (next: number) => {
    setStep(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* --- לחיצה על משבצת פותחת את התנאים לפני כל התחייבות --- */
  /**
   * לחיצה על משבצת בגריד. הלחיצה הראשונה קובעת את "הסוג" (גודל)
   * הנרכש ופותחת את TierPicker — בלי תנאי התקשרות בשלב הזה, הם
   * מוצגים רק פעם אחת בסוף, אחרי שמכסת החודשים התמלאה. לחיצות
   * הבאות (אחרי שנבחרה דרגה) מסמנות/מבטלות את הבחירה לחודש הנצפה.
   */
  const handleGridSelect = (clicked: MockupSlot) => {
    if (!anchorSlot) {
      setAnchorSlot(clicked);
      setSelections({});
      setTargetEditionsCount(null);
      return;
    }

    if (!isSameType(anchorSlot, clicked)) {
      toast.error(
        'המשבצת הזו מסוג אחר — לחצו "בחירה מחדש" כדי להתחיל עם גודל חדש',
      );
      return;
    }

    if (!targetEditionsCount || !viewedEditionId) return;

    setSelections((prev) => {
      const current = prev[viewedEditionId];
      if (current?.id === clicked.id) {
        const next = { ...prev };
        delete next[viewedEditionId];
        return next;
      }
      if (!current && Object.keys(prev).length >= targetEditionsCount) {
        toast.error(
          `כבר נבחרו ${targetEditionsCount} חודשים — בטלו בחירה בחודש אחר קודם`,
        );
        return prev;
      }
      return { ...prev, [viewedEditionId]: clicked };
    });
  };

  const handleTierSelect = (editionsCount: number) => {
    setTargetEditionsCount(editionsCount);
    setSelections((prev) => {
      const entries = Object.entries(prev).slice(0, editionsCount);
      if (entries.length === 0 && viewedEditionId && anchorSlot) {
        entries.push([viewedEditionId, anchorSlot]);
      }
      return Object.fromEntries(entries);
    });
  };

  const handleResetSelection = () => {
    setAnchorSlot(null);
    setSelections({});
    setTargetEditionsCount(null);
  };

  /** נפתח רק אחרי שמכסת החודשים התמלאה — תנאי ההתקשרות מכסים את כל החבילה */
  const handleTosAccept = () => {
    goTo(3);
  };

  const handleMailingDecision = (joined: boolean) => {
    setMailingListStatus(joined ? "joined" : "skipped");
    setMailingModalOpen(false);
  };

  /* --- יצירת ההזמנה ותפיסת המשבצת --- */
  const createOrder = async () => {
    const entries = Object.entries(selections);
    if (
      !anchorSlot ||
      !city ||
      !targetEditionsCount ||
      entries.length !== targetEditionsCount
    ) {
      return;
    }

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
          cityId: city.id,
          selections: entries.map(([editionId, s]) => ({
            editionId,
            slotId: s.id,
          })),
          tosAccepted: true,
          contactName: form.contactName.trim(),
          businessName: form.businessName.trim() || null,
          phone: form.phone.trim(),
          email: form.email.trim(),
          monthlyBenefit: form.monthlyBenefit.trim() || null,
          notes: form.notes.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // המשבצת/מהדורה התמלאה בזמן מילוי הטופס — מרעננים תפוסה
        // ומחזירים לשלב בחירת המשבצת
        if (
          data?.error?.code === "SLOT_TAKEN" ||
          data?.error?.code === "EDITION_FULL"
        ) {
          toast.error(data.error.message);
          try {
            const res2 = await fetch(`/api/cities/${city.id}/editions`, {
              cache: "no-store",
            });
            const d2 = await res2.json();
            setEditions(d2.editions ?? []);
          } catch {
            // אם הרענון עצמו נכשל, פשוט משאירים את המצב הישן —
            // הלקוח עדיין יכול לנסות שוב מהשלב הקודם
          }
          handleResetSelection();
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
        priceAgorot: data.priceAgorot,
        packageTier: data.packageTier,
        packageEditions: data.packageEditions,
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

  /* --- חיוב בפועל דרך sumit --- */
  const chargeOrder = async (singleUseToken: string) => {
    if (!order) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/charge`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-order-token": order.accessToken,
        },
        body: JSON.stringify({ singleUseToken }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error?.message ?? "התשלום נכשל");
        return;
      }

      router.push(`/order/${order.reference}`);
    } catch {
      toast.error("שגיאת רשת. נסו שוב.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={topRef} className="scroll-mt-24">
      <Stepper current={step} onJump={goTo} />


      {/* ============ שלב 1 — עיר ============ */}
      {step === 1 ? (
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
            next={
              <Button disabled={!city} onClick={() => goTo(2)} className="shine-cta">
                המשך לבחירת משבצת
                <ArrowLeft className="size-4" />
              </Button>
            }
          />
        </section>
      ) : null}

      {/* ============ שלב 2 — משבצת ============ */}
      {step === 2 && city ? (
        <section className="animate-[fade-up_0.45s_var(--ease-out-soft)_both]">
          <StepHeading
            title={content.wizard.chooseTitle}
            subtitle={content.wizard.chooseSubtitle}
          />
          <CalendarMockup
            board={board}
            calendar={content.calendar}
            editions={editions ?? []}
            viewedEditionId={viewedEditionId}
            onViewedEditionChange={setViewedEditionId}
            anchorSlot={anchorSlot}
            targetCount={targetEditionsCount}
            selections={selections}
            onSelect={handleGridSelect}
          />

          {anchorSlot ? (
            <>
              <TierPicker
                slot={anchorSlot}
                selectedEditionsCount={targetEditionsCount}
                onSelect={handleTierSelect}
              />

              {targetEditionsCount ? (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-line bg-surface-2 px-4 py-3">
                  <p className="text-[13px] text-ink-2">
                    {Object.keys(selections).length === targetEditionsCount
                      ? `נבחרו ${targetEditionsCount} חודשים ✓ — דפדפו בין החודשים כדי לראות/לשנות`
                      : `נבחרו ${Object.keys(selections).length} מתוך ${targetEditionsCount} חודשים — דפדפו בין החודשים ולחצו על משבצת מודגשת`}
                  </p>
                  <button
                    type="button"
                    onClick={handleResetSelection}
                    className="shrink-0 text-[12.5px] font-semibold text-accent underline underline-offset-2 hover:text-accent-strong"
                  >
                    בחירה מחדש
                  </button>
                </div>
              ) : null}
            </>
          ) : null}

          <NavRow
            onBack={() => {
              setCity(null);
              handleResetSelection();
              goTo(1);
            }}
            backLabel="חזרה לבחירת עיר"
            next={
              <Button
                disabled={
                  !anchorSlot ||
                  !targetEditionsCount ||
                  Object.keys(selections).length !== targetEditionsCount
                }
                onClick={() => setTosOpen(true)}
                className="shine-cta"
              >
                המשך לתנאי ההתקשרות
                <ArrowLeft className="size-4" />
              </Button>
            }
          />
        </section>
      ) : null}

      {/* ============ שלב 3 — פרטים ============ */}
      {step === 3 && anchorSlot && city ? (
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
                label="ההטבה החודשית שלכם"
                htmlFor="monthlyBenefit"
                hint="ההטבה שתוצע לקוני הלוח, ועליה תתבצע ההגרלה החודשית. לדוגמה: בין כל הקונים עגלה החודש יוגרל כיסוי גשם לעגלה."
              >
                <Textarea
                  id="monthlyBenefit"
                  value={form.monthlyBenefit}
                  onChange={(e) =>
                    setForm({ ...form, monthlyBenefit: e.target.value })
                  }
                />
              </Field>

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

              {mailingListStatus !== "pending" ? (
                <div className="mt-1 flex items-center gap-2 text-[13px]">
                  {mailingListStatus === "joined" ? (
                    <>
                      <CheckCircle2 className="size-4 shrink-0 text-accent" />
                      <span className="text-ink-2">נרשמת לרשימת התפוצה</span>
                    </>
                  ) : (
                    <>
                      <Mail className="size-4 shrink-0 text-muted" />
                      <span className="text-ink-2">לא הצטרפת לרשימת התפוצה</span>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setMailingModalOpen(true)}
                    className="text-accent underline underline-offset-2 hover:text-accent-strong"
                  >
                    שינוי
                  </button>
                </div>
              ) : null}
            </div>

            <OrderSummary
              slot={anchorSlot}
              city={city}
              priceAgorot={sumWithPackageDiscount(
                Object.values(selections).map((s) => s.priceAgorot),
              )}
              packageLabel={
                AD_PACKAGES.find(
                  (p) =>
                    p.editions === Object.keys(selections).length &&
                    p.id !== "SINGLE",
                )?.label
              }
            />
          </div>

          <NavRow
            onBack={() => goTo(2)}
            backLabel="חזרה למשבצת"
            next={
              <Button loading={busy} onClick={createOrder} className="shine-cta">
                אישור והמשך להעלאה
                <ArrowLeft className="size-4" />
              </Button>
            }
          />
        </section>
      ) : null}

      {/* ============ שלב 4 — קובץ ============ */}
      {step === 4 && order && anchorSlot && city ? (
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

            <OrderSummary
              slot={anchorSlot}
              city={city}
              reference={order.reference}
              priceAgorot={order.priceAgorot}
              packageLabel={AD_PACKAGES.find((p) => p.id === order.packageTier)?.label}
            />
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
      {step === 5 && order && anchorSlot && city ? (
        <section className="animate-[fade-up_0.45s_var(--ease-out-soft)_both]">
          <StepHeading
            title={content.wizard.payTitle}
            subtitle={content.wizard.paySubtitle}
          />

          <HoldTimer expiresAt={order.holdExpiresAt} />

          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="relative overflow-hidden rounded-lg border border-line bg-surface p-6 shadow-e1">
              {busy ? (
                <div
                  className="curtain-bg pointer-events-none absolute inset-0 z-10 opacity-80"
                  aria-hidden
                />
              ) : null}
              {busy ? (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-canvas/55 text-center backdrop-blur-[1px]">
                  <div className="size-8 animate-spin rounded-full border-2 border-ink/25 border-t-ink" />
                  <p className="font-semibold text-ink">מעבד את התשלום…</p>
                  <p className="max-w-[220px] text-[12.5px] text-ink-2">
                    רגע אחד, לא לרענן את הדף ולא ללחוץ שוב.
                  </p>
                </div>
              ) : null}

              <dl className="divide-y divide-line">
                <SummaryRow label="מספר הזמנה" value={order.reference} mono />
                <SummaryRow label="גודל משבצת" value={anchorSlot.name} />
                <SummaryRow
                  label="מידות"
                  value={formatCm(anchorSlot.widthCm, anchorSlot.heightCm)}
                />
                <SummaryRow label="עיר" value={city.name} />
                <SummaryRow label="קובץ" value={uploaded?.name ?? "—"} />
                <SummaryRow label="איש קשר" value={form.contactName} />
                {order.packageTier ? (
                  <SummaryRow
                    label="חבילה"
                    value={`${AD_PACKAGES.find((p) => p.id === order.packageTier)?.label ?? order.packageTier} · ${order.packageEditions} מהדורות`}
                  />
                ) : null}
                <div className="flex items-center justify-between py-4">
                  <dt className="font-display text-lg font-semibold text-ink">
                    לתשלום
                  </dt>
                  <dd className="tnum font-display text-2xl font-bold text-accent">
                    {formatPrice(order.priceAgorot)}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex items-start gap-2.5 rounded-md bg-surface-2 p-3.5">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />
                <p className="text-[12.5px] leading-relaxed text-ink-2">
                  פרטי האשראי מוצפנים ונשלחים ישירות ל-sumit דרך טופס
                  מאובטח. הם אינם עוברים דרך השרת שלנו ואינם נשמרים אצלנו.
                </p>
              </div>

              <div className="mt-5">
                {sumitCompanyId && sumitApiPublicKey ? (
                  <SumitCardForm
                    companyId={sumitCompanyId}
                    apiPublicKey={sumitApiPublicKey}
                    busy={busy}
                    onToken={chargeOrder}
                    onError={(message) => toast.error(message)}
                  />
                ) : (
                  <p className="rounded-md border border-warn/40 bg-[color-mix(in_srgb,var(--color-warn)_10%,transparent)] p-3.5 text-[13px] leading-relaxed text-warn">
                    תשלום מקוון אינו זמין כרגע. נא לפנות אלינו כדי להשלים את
                    ההזמנה — מספר ההזמנה שלכם הוא {order.reference}.
                  </p>
                )}
              </div>
            </div>

            <OrderSummary
              slot={anchorSlot}
              city={city}
              reference={order.reference}
              priceAgorot={order.priceAgorot}
              packageLabel={AD_PACKAGES.find((p) => p.id === order.packageTier)?.label}
            />
          </div>

          <NavRow onBack={() => goTo(4)} backLabel="חזרה לקובץ" />
        </section>
      ) : null}

      <TosDialog
        slot={anchorSlot}
        tos={content.tos}
        open={tosOpen}
        onOpenChange={setTosOpen}
        onAccept={handleTosAccept}
        editionsCount={Object.keys(selections).length}
        totalPriceAgorot={sumWithPackageDiscount(
          Object.values(selections).map((s) => s.priceAgorot),
        )}
      />

      <MailingListDialog
        open={mailingModalOpen}
        onOpenChange={setMailingModalOpen}
        onDecide={handleMailingDecision}
      />
    </div>
  );
}

/* =============================================================== */

function Stepper({
  current,
  onJump,
}: {
  current: number;
  onJump: (step: number) => void;
}) {
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

        // אותו כלל שהחצים "חזרה" כבר אוכפים: אחרי שההזמנה נוצרת
        // (משלב 4 והלאה) אי אפשר לקפוץ לשלבי משבצת/עיר/פרטים —
        // שום דבר לא באמת יעדכן את ההזמנה שכבר נוצרה עם הפרטים ההם.
        const clickable = state === "done" && (number <= 3 ? current <= 3 : true);

        const content = (
          <>
            <span
              className={cn(
                "tnum grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                "transition-[background-color,transform] duration-200 ease-smooth",
                state === "active" && "bg-accent text-accent-ink",
                state === "done" && "bg-success text-white",
                state === "todo" && "bg-line-2 text-surface",
                clickable && "group-hover:scale-110",
              )}
            >
              {number}
            </span>
            <span className="truncate">{label}</span>
          </>
        );

        const itemClassName = cn(
          "group flex flex-1 items-center gap-2 rounded-md border px-3 py-2.5 text-[13px]",
          "transition-colors duration-200 ease-smooth",
          state === "active" &&
            "border-accent bg-accent-soft font-semibold text-accent-strong",
          state === "done" && "border-line bg-surface text-ink-2",
          state === "todo" && "border-line bg-surface text-muted",
          clickable && "cursor-pointer hover:border-accent hover:bg-accent-soft",
        );

        return clickable ? (
          <li key={label} className="flex-1">
            <button type="button" onClick={() => onJump(number)} className={cn(itemClassName, "w-full")}>
              {content}
            </button>
          </li>
        ) : (
          <li key={label} className={itemClassName}>
            {content}
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
  priceAgorot,
  packageLabel,
}: {
  slot: MockupSlot;
  city: CityAvailability;
  reference?: string;
  /** ברירת מחדל: מחיר המשבצת הרגיל. אחרי בחירת חבילה/יצירת הזמנה — הסכום הכולל בפועל */
  priceAgorot?: number;
  packageLabel?: string;
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
        {packageLabel ? <Badge tone="accent">חבילת {packageLabel}</Badge> : null}
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
            {formatPrice(priceAgorot ?? slot.priceAgorot)}
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
