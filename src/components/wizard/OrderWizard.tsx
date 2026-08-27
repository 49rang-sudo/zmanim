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
  Loader2,
  Mail,
  Search,
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
import {
  StepDot,
  WBadge as Badge,
  WCard,
  WField as Field,
  WInput as Input,
  WTextarea as Textarea,
} from "./ui";
import { cn, formatCm, formatPrice } from "@/lib/utils";
import { boardForMonth } from "@/lib/board";
import { categoryMatches } from "@/lib/landing-shared";
import {
  AD_PACKAGES,
  sumWithPackageDiscount,
  TIER_LABELS,
} from "@/lib/packages";
import { markPopupShown, popupAlreadyShown } from "@/lib/popup-session";
import {
  clearOrderDraft,
  DRAFT_VERSION,
  readOrderDraft,
  writeOrderDraft,
} from "@/lib/order-draft";
import {
  ORDER_INTENT_EVENT,
  setOrderInProgress,
  type OrderIntentDetail,
} from "@/lib/order-focus";
import type { SiteContentData } from "@/lib/content";
import type { CityAvailability, EditionAvailability } from "@/lib/availability";
import type { PresenceTier } from "@/lib/packages";

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

const STEPS = ["מהדורה", "משבצת", "פרטים", "קובץ", "תשלום"] as const;

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
  /**
   * הדרגה שכפתור בעמוד הנחיתה הבטיח ("לבחירת חודש ונוכחות עוגן").
   * משמשת רק כדי לומר בשלב 2 מה בדיוק חיפשנו — ומתאפסת ברגע
   * שנבחר מקום בפועל, כי אז המסך כבר מספר את הסיפור לבדו.
   */
  const [intentTier, setIntentTier] = React.useState<PresenceTier | null>(null);

  const topRef = React.useRef<HTMLDivElement>(null);

  /** החודש שהיה מוצג בטיוטה שהתאוששה — מוחזר אחרי טעינת המהדורות */
  const restoredViewedEditionRef = React.useRef<string | null>(null);

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

        // אחרי שחזור טיוטה חוזרים לחודש שבו הלקוח באמת עמד, ולא
        // לחודש הראשון — אלא אם החודש ההוא כבר לא פתוח.
        const restored = restoredViewedEditionRef.current;
        restoredViewedEditionRef.current = null;
        const keep =
          restored && list.some((edition) => edition.id === restored)
            ? restored
            : null;

        setViewedEditionId(keep ?? list[0]?.id ?? null);
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

  /* ===============================================================
     תיאום עם כפתורי עמוד הנחיתה — ראו src/lib/order-focus.ts
     =============================================================== */

  /** "יש הזמנה בתהליך" — מרגע שנבחרה עיר ועד שההזמנה נשלחה */
  const inProgress = !!city || !!anchorSlot || !!order;

  React.useEffect(() => {
    setOrderInProgress(inProgress);
    return () => setOrderInProgress(false);
  }, [inProgress]);

  // כפתור בעמוד שהבטיח דרגה מסוימת ("לבחירת חודש ונוכחות עוגן")
  // מודיע עליה לכאן, כדי שמה שנוחת יהיה מה שהובטח.
  React.useEffect(() => {
    const onIntent = (event: Event) => {
      const { tier } = (event as CustomEvent<OrderIntentDetail>).detail ?? {};
      if (!tier) return;
      // באמצע בחירה קיימת אין מה "להבטיח" — המסך כבר מציג חבילה
      // בתהליך, והחלפת דרגה נעשית ב"בחירה מחדש" ולא בכפתור בעמוד.
      if (anchorSlot) return;
      setIntentTier(tier);
    };

    window.addEventListener(ORDER_INTENT_EVENT, onIntent);
    return () => window.removeEventListener(ORDER_INTENT_EVENT, onIntent);
  }, [anchorSlot]);

  /* ===============================================================
     טיוטה — ראו src/lib/order-draft.ts

     בלי זה כל טעינה מחדש של הדף (F5, לחיצה על הלוגו בסרגל העליון,
     "חזרה" בדפדפן) מחקה את העיר, את המשבצת ואת מה שהוקלד והחזירה
     לשלב 1 — מה שנראה בדיוק כמו "נזרקתי לעמוד הבית".
     =============================================================== */

  /** נדלק אחרי ניסיון השחזור — לפניו אסור לכתוב ולדרוס טיוטה קיימת */
  const draftReadyRef = React.useRef(false);

  React.useEffect(() => {
    const draft = readOrderDraft();
    draftReadyRef.current = true;

    if (draft) {
      restoredViewedEditionRef.current = draft.viewedEditionId;
      setCity(draft.city);
      setAnchorSlot(draft.anchorSlot);
      setTargetEditionsCount(draft.targetEditionsCount);
      setSelections(draft.selections);
      setForm(draft.form);
      // בלי גלילה: המשתמש לא ביקש לקפוץ לכאן, הוא רק רענן דף
      setStep(draft.step);
      return;
    }

    // ---------------------------------------------------------------
    // אין טיוטה לשחזר — בדיקת "מהדורה פתוחה אחת בלבד".
    //
    // בקשה מפורשת של הלקוחה: "השנה יש רק מהדורה אחת. אין צורך
    // לבחור עיר. כשייפתחו עוד ערים, יבחרו מבין המהדורות הפתוחות".
    // כל עוד יש בדיוק עיר פתוחה אחת (מהדורה אחת רלוונטית), מדלגים
    // על שלב הבחירה לגמרי וקופצים ישר לדפדוף חודשים/משבצת. ברגע
    // שתיפתח עיר שנייה, השלב הזה יחזור להופיע מעצמו (התנאי כאן
    // כבר לא יתקיים) — בלי צורך בשינוי קוד נוסף.
    //
    // חייב לקרות כאן ולא באפקט נפרד: state כמו city/step עדיין לא
    // התעדכן בפועל בזמן שרשימת אפקטי ה-mount רצה (setState בתוך
    // אפקט קודם לא נקרא סינכרונית), אז אפקט נפרד היה קורא ערכים
    // ישנים ועלול לדרוס טיוטה שכן שוחזרה. כאן, בהיעדר טיוטה, אין
    // מה לדרוס.
    fetch("/api/cities", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        // /api/cities מחזיר תמיד את כל הערים (גם מלאות/סגורות, עם
        // available:false) כדי ש-CityPicker יוכל להציג אותן כאפורות —
        // "מהדורה אחת" אומר עיר פנויה אחת, לא שורה אחת בתשובה. תוקן
        // אחרי בדיקה אמיתית בדפדפן שגילתה שהתנאי הישן (cities.length)
        // אף פעם לא היה אמת בפועל.
        const cities: CityAvailability[] = data.cities ?? [];
        const openCities = cities.filter((c) => c.available);
        if (openCities.length === 1) {
          handleCitySelect(openCities[0]);
          goTo(2);
        }
      })
      .catch(() => {
        // כשל שקט — שלב 1 עדיין עובד כרגיל עם CityPicker הרגיל
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!draftReadyRef.current) return;

    // משלב 4 ההזמנה כבר קיימת בשרת עם החזקה וטוקן — לא טיוטה
    if (order || step > 3) {
      clearOrderDraft();
      return;
    }

    writeOrderDraft({
      version: DRAFT_VERSION,
      step,
      city,
      viewedEditionId,
      anchorSlot,
      targetEditionsCount,
      selections,
      form,
    });
  }, [
    step,
    city,
    viewedEditionId,
    anchorSlot,
    targetEditionsCount,
    selections,
    form,
    order,
  ]);

  // מוקפצת רק בכוונת יציאה (Exit-Intent) — לא מיד עם הכניסה לאתר ולא
  // חוסמת את מסלול ההזמנה. בדסקטופ: הסמן יוצא דרך חלק העליון של
  // החלון (לכיוון סגירת לשונית / שורת הכתובת). במובייל: לחיצה על
  // "חזרה". מזוינת רק 4 שניות אחרי הטעינה כדי לא לתפוס גלישה חולפת.
  // מושתקת בשלב התשלום (5) — הרגע הכי קריטי בקנייה, לא המקום להפריע.
  // בקשת לקוחה מפורשת לאיסוף לידים ממי שעוזב בלי להזמין.
  // ...ובלבד שלא קפצה כבר חלונית אחרת בביקור הזה. פופאפ "בדקו לי
  // מקום" בעמוד הנחיתה מזוין באותה כוונת-יציאה, ושתי חלוניות ברצף
  // הן סיבה לסגור לשונית ולא עוד ליד. ראו src/lib/popup-session.ts.
  React.useEffect(() => {
    if (mailingListStatus !== "pending") return;
    if (popupAlreadyShown()) return;

    let armed = false;
    const armTimer = setTimeout(() => {
      armed = true;
    }, 4000);

    const trigger = () => {
      if (!armed || mailingModalShown.current || stepRef.current === 5) return;
      mailingModalShown.current = true;
      markPopupShown();
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
    setIntentTier(null);

    if (!anchorSlot) {
      setAnchorSlot(clicked);
      setSelections({});
      setTargetEditionsCount(null);
      return;
    }

    // עוד לא נבחרה חבילה — כלומר עוד לא הובטח דבר. לחיצה על מקום
    // אחר היא פשוט "התחרטתי, זה מה שאני רוצה", והיא מחליפה את
    // הבחירה. קודם היא הוציאה הודעת שגיאה שהפנתה לכפתור "בחירה
    // מחדש" שכלל לא היה על המסך בשלב הזה — מבוי סתום, ובדיוק
    // הרגע שבו הלקוחה יצאה לחפש כפתור אחר בעמוד.
    if (!targetEditionsCount) {
      setAnchorSlot(clicked);
      setSelections({});
      return;
    }

    if (!isSameType(anchorSlot, clicked)) {
      toast.error(
        anchorSlot.tier !== clicked.tier
          ? `החבילה שלכם היא ${TIER_LABELS[anchorSlot.tier]} — לחצו "בחירה מחדש" כדי לעבור ל${TIER_LABELS[clicked.tier]}`
          : 'המקום הזה בגודל אחר — לחצו "בחירה מחדש" כדי להתחיל עם גודל חדש',
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

    // ירידה לחבילה קטנה יותר מוותרת על חודשים שכבר נבחרו. זה מה
    // שהתבקש, אבל בשקט זה נראה כמו תקלה — אז אומרים את זה. מחושב
    // כאן ולא בתוך מעדכן ה-state, שנקרא יותר מפעם אחת ב-StrictMode.
    const dropped = Math.max(0, Object.keys(selections).length - editionsCount);
    if (dropped > 0) {
      toast.info(
        dropped === 1
          ? "חודש אחד שנבחר הוסר מהחבילה — היא קטנה יותר עכשיו"
          : `${dropped} חודשים שנבחרו הוסרו מהחבילה — היא קטנה יותר עכשיו`,
      );
    }

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

  /**
   * החלפת עיר מאפסת את הבחירה — חובה, לא נימוס.
   *
   * המשבצות והמהדורות שייכות לעיר. עד עכשיו רק הכפתור "חזרה
   * לבחירת עיר" איפס אותן, אבל קפיצה לשלב 1 דרך פס השלבים לא —
   * וכך אפשר היה לבחור משבצת בבני ברק, לקפוץ אחורה, לעבור
   * לירושלים ולהמשיך הלאה עם בחירה של עיר אחרת. הכפתור "המשך"
   * נשאר פעיל, והתקלה התגלתה רק אחרי מילוי כל טופס הפרטים —
   * ואז עם הודעה שקרית ("העיר הזו מלאה לאחת המהדורות שבחרתם"),
   * כי reserveSlot מחפש את המהדורות תחת cityId החדש ולא מוצא.
   */
  const handleCitySelect = (next: CityAvailability) => {
    if (city?.id !== next.id) handleResetSelection();
    setCity(next);
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
            onSelect={handleCitySelect}
            messages={content.wizard}
          />

          <NavRow
            next={
              <Button variant="pill" disabled={!city} onClick={() => goTo(2)} className="shine-cta">
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

          {/* חיפוש תחום עסק — מדלג אוטומטית לחודש המתאים, לפני שבוחרים
              מקום. נעלם ברגע שנבחר מקום, בדיוק כמו הודעת ה-intentTier
              למטה: זו עזרה למציאת החודש, לא רלוונטית יותר אחרי הבחירה. */}
          {!anchorSlot ? (
            <CategorySearch
              board={board}
              editions={editions ?? []}
              content={content}
              onJump={setViewedEditionId}
            />
          ) : null}

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

          {/* הכפתור בעמוד הבטיח דרגה — נאמר כאן במפורש מה חיפשנו,
              כדי שהנחיתה תתאים למה שהיה כתוב על הכפתור. נעלם
              ברגע שנבחר מקום, כי אז המסך מספר את הסיפור לבדו. */}
          {!anchorSlot && intentTier ? (
            <p className="mt-4 rounded-2xl border border-primary/30 bg-secondary/60 px-4 py-3 text-[13px] leading-relaxed text-primary">
              אתם מחפשים <strong>{TIER_LABELS[intentTier]}</strong> — בחרו מקום
              שמסומן <strong>{TIER_LABELS[intentTier]}</strong> על הסצנה של
              החודש.
            </p>
          ) : null}

          {anchorSlot ? (
            <>
              <TierPicker
                slot={anchorSlot}
                selectedEditionsCount={targetEditionsCount}
                onSelect={handleTierSelect}
              />

              {/* מוצג מרגע שנבחר מקום, גם לפני בחירת חבילה: זה
                  הכפתור היחיד שמאפשר להתחרט על הגודל/הדרגה, והוא
                  זה שהודעות השגיאה מפנות אליו. כשהוא לא היה על
                  המסך, ההודעה "לחצו בחירה מחדש" הפנתה לשום מקום. */}
              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-border bg-secondary/40 px-4 py-3">
                <p className="text-[13px] text-foreground/80">
                  {!targetEditionsCount
                    ? `נבחר ${TIER_LABELS[anchorSlot.tier]}: ${anchorSlot.name} — בחרו כמה חודשים לפרסם`
                    : Object.keys(selections).length === targetEditionsCount
                      ? `נבחרו ${targetEditionsCount} חודשים ✓ — דפדפו בין החודשים כדי לראות/לשנות`
                      : `נבחרו ${Object.keys(selections).length} מתוך ${targetEditionsCount} חודשים — דפדפו בין החודשים ולחצו על משבצת מודגשת`}
                </p>
                <button
                  type="button"
                  onClick={handleResetSelection}
                  className="shrink-0 text-[12.5px] font-semibold text-primary underline underline-offset-2 hover:brightness-90"
                >
                  בחירה מחדש
                </button>
              </div>
            </>
          ) : null}

          <NavRow
            onBack={() => {
              setCity(null);
              handleResetSelection();
              goTo(1);
            }}
            backLabel="חזרה לבחירת מהדורה"
            next={
              <Button
                variant="pill"
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
            <WCard>
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
                      <CheckCircle2 className="size-4 shrink-0 text-primary" />
                      <span className="text-foreground/80">נרשמת לרשימת התפוצה</span>
                    </>
                  ) : (
                    <>
                      <Mail className="size-4 shrink-0 text-muted-foreground" />
                      <span className="text-foreground/80">לא הצטרפת לרשימת התפוצה</span>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setMailingModalOpen(true)}
                    className="text-primary underline underline-offset-2 hover:brightness-90"
                  >
                    שינוי
                  </button>
                </div>
              ) : null}
            </WCard>

            <OrderSummary
              slot={anchorSlot}
              city={city}
              priceAgorot={sumWithPackageDiscount(
                Object.values(selections).map((s) => s.priceAgorot),
                anchorSlot.tier,
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
              <Button variant="pill" loading={busy} onClick={createOrder} className="shine-cta">
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
              <Button variant="pill" disabled={!uploaded} onClick={() => goTo(5)}>
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
            <WCard className="relative overflow-hidden">
              {busy ? (
                <div
                  className="curtain-bg pointer-events-none absolute inset-0 z-10 opacity-80"
                  aria-hidden
                />
              ) : null}
              {busy ? (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-card/70 text-center backdrop-blur-[1px]">
                  <div className="size-8 animate-spin rounded-full border-2 border-foreground/25 border-t-foreground" />
                  <p className="font-semibold text-foreground">מעבד את התשלום…</p>
                  <p className="max-w-[220px] text-[12.5px] text-foreground/70">
                    רגע אחד, לא לרענן את הדף ולא ללחוץ שוב.
                  </p>
                </div>
              ) : null}

              <dl className="divide-y divide-border">
                <SummaryRow label="מספר הזמנה" value={order.reference} mono />
                <SummaryRow
                  label="דרגת נוכחות"
                  value={TIER_LABELS[anchorSlot.tier]}
                />
                <SummaryRow label="המקום" value={anchorSlot.name} />
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
                  <dt className="font-heading text-lg font-semibold text-foreground">
                    לתשלום
                  </dt>
                  <dd className="tnum font-heading text-2xl font-bold text-primary">
                    {formatPrice(order.priceAgorot)}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-secondary/50 p-3.5">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-[12.5px] leading-relaxed text-foreground/70">
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
                  <p className="rounded-2xl border border-warn/40 bg-[color-mix(in_srgb,var(--color-warn)_10%,transparent)] p-3.5 text-[13px] leading-relaxed text-warn">
                    תשלום מקוון אינו זמין כרגע. נא לפנות אלינו כדי להשלים את
                    ההזמנה — מספר ההזמנה שלכם הוא {order.reference}.
                  </p>
                )}
              </div>
            </WCard>

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
          // לפני הבחירה הראשונה אין דרגה, ואז הסכום הוא 0 ממילא
          anchorSlot?.tier ?? "COMPLEMENTARY",
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
        className="mb-4 h-[3px] overflow-hidden rounded-full bg-muted"
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

      {/* מסלול השלבים — דפוס ה-StepDot/תווית של Base44
          (ReservationModal.jsx), עם אפשרות קפיצה חזרה לשלב שכבר בוצע */}
      <ol className="mb-8 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
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
            <StepDot state={state} n={number} />
            <span
              className={cn("truncate", state === "active" && "text-foreground")}
            >
              {label}
            </span>
          </>
        );

        return (
          <React.Fragment key={label}>
            <li>
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onJump(number)}
                  className="flex items-center gap-2 rounded-full px-1 py-1 transition-colors hover:text-foreground"
                >
                  {content}
                </button>
              ) : (
                <span className="flex items-center gap-2 px-1 py-1">
                  {content}
                </span>
              )}
            </li>
            {index < STEPS.length - 1 ? (
              <span className="h-px w-4 shrink-0 bg-border" aria-hidden />
            ) : null}
          </React.Fragment>
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
      <h2 className="font-heading text-2xl font-extrabold text-foreground sm:text-3xl">
        {title}
      </h2>
      <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
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
    <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
      {onBack ? (
        <Button variant="pill-quiet" onClick={onBack}>
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
    <p className="mt-3 flex items-start gap-2 rounded-2xl border border-warn/40 bg-[color-mix(in_srgb,var(--color-warn)_10%,transparent)] p-3 text-[12.5px] leading-snug text-warn">
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
    <aside className="h-fit rounded-2xl border border-border bg-secondary/40 p-5 soft-shadow lg:sticky lg:top-24">
      <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        ההזמנה שלכם
      </p>

      <p className="mt-2 font-heading text-xl font-semibold text-foreground">
        {slot.name}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {/* הדרגה קודמת למידות: היא מה שקובע גם את הנוכחות בלוח וגם
            את המחירון, ולכן היא הדבר הראשון שצריך להיות מאושר. */}
        <Badge tone={slot.tier === "ANCHOR" ? "primary" : "neutral"}>
          {TIER_LABELS[slot.tier]}
        </Badge>
        <Badge tone="neutral">{formatCm(slot.widthCm, slot.heightCm)}</Badge>
        <Badge tone="neutral">{slot.sku}</Badge>
        <Badge tone="primary">{city.name}</Badge>
        {packageLabel ? <Badge tone="primary">חבילת {packageLabel}</Badge> : null}
      </div>

      {reference ? (
        <p className="tnum mt-3 text-[12px] text-muted-foreground">
          מספר הזמנה: <span className="font-semibold">{reference}</span>
        </p>
      ) : null}

      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-foreground/70">סה״כ</span>
          <span className="tnum font-heading text-2xl font-bold text-primary">
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
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "truncate text-sm font-medium text-foreground",
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
        "overflow-hidden rounded-2xl border",
        urgent
          ? "border-warn/40 bg-[color-mix(in_srgb,var(--color-warn)_10%,transparent)]"
          : "border-border bg-secondary/40",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 px-3.5 py-2.5 text-[13px]",
          urgent ? "text-warn" : "text-foreground/80",
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
      <div className="h-[3px] bg-muted">
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

/* ===============================================================
   חיפוש תחום עסק בתוך שלב 2 — "בחירת מהדורה + הקלדת תחום, המערכת
   מתמקדת אוטומטית בעמוד הרלוונטי, ואם לא נמצא — משאירים פנייה"
   (בקשת הלקוחה). אותו כלל התאמה בדיוק כמו בעמוד הנחיתה
   (categoryMatches, src/lib/landing-shared.ts) ואותה תבנית גיבוי
   (boardForMonth) שמזינה את ספירת המלאי בשרת — בלי לשכפל לוגיקה.
   =============================================================== */

type CategoryMatch = {
  editionId: string;
  hebrewLabel: string;
  category: string;
  taken: boolean;
};

function CategorySearch({
  board,
  editions,
  content,
  onJump,
}: {
  board: BoardImage[];
  editions: EditionAvailability[];
  content: SiteContentData;
  onJump: (editionId: string) => void;
}) {
  const [query, setQuery] = React.useState("");
  const [showInquiry, setShowInquiry] = React.useState(false);

  const trimmed = query.trim();
  const searching = trimmed.length >= 2;

  const matches = React.useMemo<CategoryMatch[]>(() => {
    if (!searching) return [];
    const out: CategoryMatch[] = [];
    for (const edition of editions) {
      const occupied = new Set(edition.occupiedSlotIds);
      const monthBoard = boardForMonth(board, edition.gregorianMonth);
      for (const image of monthBoard) {
        for (const spot of image.hotspots) {
          if (categoryMatches(spot.category, trimmed)) {
            out.push({
              editionId: edition.id,
              hebrewLabel: edition.hebrewLabel,
              category: spot.category,
              taken: occupied.has(spot.slot.id),
            });
          }
        }
      }
    }
    return out;
  }, [board, editions, trimmed, searching]);

  // מעדיפים התאמה פנויה על תפוסה, אבל לא מתעלמים מתפוסה — עדיף
  // להראות "התאמה נמצאה, אבל תפוסה" מאשר "שום התאמה" שקרי.
  const bestMatch = matches.find((m) => !m.taken) ?? matches[0] ?? null;

  // קופצים לחודש של ההתאמה הכי טובה — פעם אחת לכל תוצאה חדשה, לא
  // בכל רינדור (אחרת דפדוף ידני של המשתמש בין החודשים אחרי הקפיצה
  // היה נדרס בחזרה על כל הקלדה נוספת של אותה תוצאה).
  const jumpedEditionIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!bestMatch || jumpedEditionIdRef.current === bestMatch.editionId) {
      return;
    }
    jumpedEditionIdRef.current = bestMatch.editionId;
    onJump(bestMatch.editionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bestMatch?.editionId]);

  React.useEffect(() => {
    if (!searching) setShowInquiry(false);
  }, [searching]);

  const noMatch = searching && matches.length === 0;

  return (
    <div className="mb-6 rounded-2xl border border-border bg-secondary/30 p-4">
      <label
        htmlFor="wizard-category-search"
        className="mb-2 block text-[13.5px] font-semibold text-foreground"
      >
        מה העסק שלכם עושה?
      </label>
      <div className="flex items-center rounded-full border border-border bg-card">
        <Search className="ms-3.5 size-4 shrink-0 text-muted-foreground" />
        <input
          id="wizard-category-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="הקלידו תחום, ונדלג ישר לחודש המתאים"
          className="w-full bg-transparent px-3 py-3 text-[14.5px] text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      {bestMatch ? (
        <p className="mt-2.5 text-[13px] leading-relaxed text-foreground/80">
          נמצא <strong className="text-foreground">{bestMatch.category}</strong>{" "}
          ב<strong className="text-foreground">{bestMatch.hebrewLabel}</strong> —
          עברנו לשם.{" "}
          {bestMatch.taken
            ? "שימו לב: המקום הזה עצמו כבר תפוס, אבל אולי יש מקום פנוי נוסף באותו חודש."
            : "בחרו את המקום המסומן בגיליון למטה."}
        </p>
      ) : null}

      {noMatch ? (
        <div className="mt-3">
          <p className="text-[13px] leading-relaxed text-foreground/80">
            לא מצאנו התאמה ל&quot;{trimmed}&quot; באף חודש פתוח כרגע. אל
            תוותרו — נשמח לבדוק לכם התאמה בעצמנו.
          </p>
          {!showInquiry ? (
            <button
              type="button"
              onClick={() => setShowInquiry(true)}
              className="mt-2 text-[13px] font-semibold text-primary underline underline-offset-2 hover:brightness-90"
            >
              נשאיר פנייה ונמצא התאמה
            </button>
          ) : (
            <InlineInquiryFallback
              content={content}
              initialCategory={trimmed}
              onDone={() => setShowInquiry(false)}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

/**
 * גרסה מצומצמת של טופס הפנייה — לא שכפול לוגי: אותו /api/inquiries,
 * אותה סכמה (source: "FORM"), אותם שדות חובה בדיוק כמו ב-InquiryForm
 * המלא (src/components/landing/InquiryForm.tsx). ההבדל היחיד הוא
 * העיצוב — קטע מלא ברוחב עמוד עם ריווח py-24 לא מתאים בתוך שלב
 * באשף שיושב בתוך מודל, וגם היה יוצר התנגשות מזהה id="contact" עם
 * הקטע המקביל בעמוד הנחיתה שמאחורי המודל. תחום העסק ממולא מראש
 * ממה שכבר הוקלד בחיפוש למעלה, כדי לא להקליד את זה פעמיים.
 */
function InlineInquiryFallback({
  content,
  initialCategory,
  onDone,
}: {
  content: SiteContentData;
  initialCategory: string;
  onDone: () => void;
}) {
  const [form, setForm] = React.useState({
    businessName: "",
    category: initialCategory,
    contactName: "",
    phone: "",
    email: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const next: Record<string, string> = {};
    if (form.businessName.trim().length < 2) next.businessName = "נא למלא את שם העסק";
    if (form.category.trim().length < 2) next.category = "נא לפרט מה העסק מציע";
    if (form.contactName.trim().length < 2) next.contactName = "נא למלא שם ליצירת קשר";
    if (!/^[0-9+\-\s()]{9,20}$/.test(form.phone.trim())) next.phone = "מספר טלפון לא תקין";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) next.email = "כתובת מייל לא תקינה";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          source: "FORM",
          businessName: form.businessName.trim(),
          category: form.category.trim(),
          contactName: form.contactName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error?.message ?? "השליחה נכשלה. נסו שוב בעוד רגע.");
        return;
      }

      setSent(true);
    } catch {
      toast.error("שגיאת רשת. נסו שוב.");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="mt-3 flex items-center gap-2.5 rounded-2xl border border-border bg-card p-4">
        <CheckCircle2 className="size-5 shrink-0 text-primary" />
        <div>
          <p className="text-[13.5px] font-semibold text-foreground">
            {content.landing.status.inquiryReceived}
          </p>
          <button
            type="button"
            onClick={onDone}
            className="mt-1 text-[12.5px] font-semibold text-primary underline underline-offset-2 hover:brightness-90"
          >
            סגירה, וחזרה לדפדוף בחודשים
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mt-3 grid gap-2.5 rounded-2xl border border-border bg-card p-4"
    >
      <div className="grid gap-2.5 sm:grid-cols-2">
        <Field label="שם העסק *" error={errors.businessName}>
          <Input
            value={form.businessName}
            aria-invalid={!!errors.businessName}
            onChange={(e) => setForm({ ...form, businessName: e.target.value })}
          />
        </Field>
        <Field label="תחום הפעילות *" error={errors.category}>
          <Input
            value={form.category}
            aria-invalid={!!errors.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </Field>
        <Field label="שם ליצירת קשר *" error={errors.contactName}>
          <Input
            value={form.contactName}
            autoComplete="name"
            aria-invalid={!!errors.contactName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
          />
        </Field>
        <Field label="טלפון *" error={errors.phone}>
          <Input
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
      <Field label="אימייל *" error={errors.email}>
        <Input
          type="email"
          dir="ltr"
          className="text-right"
          value={form.email}
          autoComplete="email"
          aria-invalid={!!errors.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </Field>

      <Button type="submit" variant="pill" loading={busy} className="mt-1 justify-self-start">
        {busy ? <Loader2 className="size-4 animate-spin" /> : null}
        שליחת הפנייה
      </Button>
    </form>
  );
}
