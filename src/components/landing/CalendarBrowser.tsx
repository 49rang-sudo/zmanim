"use client";

import * as React from "react";
import { ArrowLeft, Search } from "lucide-react";
import { OrderCta } from "./OrderCta";
import { SectionEyebrow } from "./Landing";
import { cn, formatPrice } from "@/lib/utils";
import { TIER_LABELS, type PresenceTier } from "@/lib/packages";
import { categoryMatches, type LandingMonth } from "@/lib/landing-shared";
import {
  CalendarMockup,
  type BoardImage,
  type MockupSlot,
} from "@/components/wizard/CalendarMockup";
import { openOrderModal } from "@/lib/order-focus";
import type { SiteContentData } from "@/lib/content";
import type { EditionAvailability } from "@/lib/availability";

/* ===============================================================
   5 · לוח השנה הגדול — האזור המרכזי באתר.

   עד עכשיו כאן ישבה רשת של כרטיסי-חודש קטנים. הלקוחה, אחרי
   שראתה את המוקאפ של Base44 לצד האתר החי, אמרה במפורש: "שם הלוח
   שנה גדול וניתן לדפדף בו. וכאן זה כרטיסיות" — והחלטנו על כך
   שהמגבלה על הבורר הזה בפריסות הקודמות (כרום בלבד, בלי לגעת
   במבנה) מוסרת עכשיו.

   הגיליון הגדול עצמו (התמונה + חלונות הפרסום עליה, החצים,
   הדפדוף) הוא CalendarMockup הקיים — אותו רכיב בדיוק שמשמש את שלב
   2 באשף ההזמנה, עם אותו מודל נתונים אמיתי (Hotspot/AdSlot,
   תפוסה/מכירה אמיתית). הוא לא משוכפל כאן: זהו מצב "תצוגה מקדימה"
   שלו (anchorSlot=null, selections={}) שמוביל בלחיצה על חלון פנוי
   לפתיחת אשף ההזמנה האמיתי במודל — בדיוק כמו שכפתור ה-CTA הישן
   הוביל (קודם בגלילה ל-#order, עכשיו בפתיחת המודל — ראו
   src/lib/order-focus.ts / OrderModalHost.tsx).

   שני כללים שאסור לשבור כאן (ירשו מהגרסה הקודמת):

   1. כל סטטוס מגיע מ-LandingMonth/EditionAvailability, כלומר
      ממסד הנתונים. "התחום נתפס" נכתב אך ורק כשיש שורת תפיסה
      אמיתית.

   2. הבורר עצמו לא משוכפל. לחיצה על חלון/CTA פותחת את מודל
      ההזמנה — שם, ורק שם, בוחרים מקום ומשלמים.
   =============================================================== */

const TIER_ORDER: PresenceTier[] = ["ANCHOR", "COMPLEMENTARY"];

type StatusCopy = SiteContentData["landing"]["status"];

/**
 * הסטטוס של דרגה אחת בחודש אחד, בניסוח של הלקוחה (סעיף 17).
 * null = לדרגה הזו אין בכלל מקומות בסצנה של החודש, ואז עדיף לא
 * להזכיר אותה מאשר להכריז "נתפס" על משהו שמעולם לא הוצע.
 */
function tierStatus(
  tier: { capacity: number; remaining: number },
  copy: StatusCopy,
): { label: string; tone: "free" | "low" | "gone" } | null {
  if (tier.capacity === 0) return null;
  if (tier.remaining === 0) return { label: copy.taken, tone: "gone" };

  if (tier.remaining < tier.capacity) {
    return tier.remaining === 1
      ? { label: copy.lastSpot, tone: "low" }
      : { label: copy.fillingUp, tone: "low" };
  }

  return { label: copy.available, tone: "free" };
}

const TONE_CLASS = {
  free: "bg-secondary text-foreground/70",
  low: "bg-primary text-primary-foreground",
  gone: "bg-muted text-muted-foreground line-through decoration-1",
} as const;

/* ---------------------------------------------------------------
   ניסוח תוצאות החיפוש. הקהל כאן לא טכני, ו"נמצאו 1 חודשים" נקרא
   כמו תקלה. עברית מבחינה בין יחיד, זוגי ורבים — אז גם אנחנו.
   --------------------------------------------------------------- */

function foundLine(count: number, query: string): string {
  if (count === 1) return `נמצא חודש אחד שבו "${query}" יכול להשתלב.`;
  if (count === 2) return `נמצאו שני חודשים שבהם "${query}" יכול להשתלב.`;
  return `נמצאו ${count} חודשים שבהם "${query}" יכול להשתלב.`;
}

function showOthersLine(count: number): string {
  if (count === 1) return "להציג גם את החודש הנוסף";
  if (count === 2) return "להציג גם את שני החודשים האחרים";
  return `להציג גם את ${count} החודשים האחרים`;
}

export function CalendarBrowser({
  content,
  board,
  months,
  editions,
}: {
  content: SiteContentData;
  board: BoardImage[];
  months: LandingMonth[];
  editions: EditionAvailability[];
}) {
  const copy = content.landing.months;
  const status = content.landing.status;

  const [query, setQuery] = React.useState("");
  const [showAll, setShowAll] = React.useState(false);
  const [viewedEditionId, setViewedEditionId] = React.useState<string | null>(
    months[0]?.editionId ?? null,
  );

  const trimmed = query.trim();
  const searching = trimmed.length >= 2;

  /** לכל חודש — אילו מהתחומים שלו מתאימים למה שהוקלד */
  const matchesByMonth = React.useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (!searching) return map;

    for (const month of months) {
      const hits = new Set<string>();
      for (const category of month.categories) {
        if (categoryMatches(category.name, trimmed)) hits.add(category.slotId);
      }
      if (hits.size > 0) map.set(month.editionId, hits);
    }
    return map;
  }, [months, trimmed, searching]);

  const matchedMonths = searching
    ? months.filter((month) => matchesByMonth.has(month.editionId))
    : months;

  const hiddenCount = searching ? months.length - matchedMonths.length : 0;
  /** רשימת ה-pills לדפדוף — כברירת מחדל רק מה שמתאים לחיפוש */
  const pagerMonths = searching && !showAll ? matchedMonths : months;

  /** חיפשו משהו שאין לו אח ורע באף חודש פתוח */
  const noMatch = searching && matchedMonths.length === 0 && months.length > 0;

  // כשהחיפוש מצמצם את הרשימה והחודש שמוצג כרגע נפל ממנה — קופצים
  // אוטומטית לחודש הראשון שכן מתאים, כדי שהגיליון הגדול לא יישאר
  // תקוע על חודש שאינו ברשימת התוצאות.
  React.useEffect(() => {
    if (!searching || matchedMonths.length === 0) return;
    if (matchedMonths.some((m) => m.editionId === viewedEditionId)) return;
    setViewedEditionId(matchedMonths[0].editionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searching, matchedMonths]);

  const currentMonth =
    months.find((m) => m.editionId === viewedEditionId) ?? months[0] ?? null;

  const matched = currentMonth
    ? (matchesByMonth.get(currentMonth.editionId) ?? null)
    : null;
  const matchedTaken =
    matched && currentMonth
      ? currentMonth.categories.filter((c) => matched.has(c.slotId) && c.taken)
      : [];
  const matchedFree =
    matched && currentMonth
      ? currentMonth.categories.filter((c) => matched.has(c.slotId) && !c.taken)
      : [];

  /** לחיצה על חלון פנוי בגיליון — פותחת את אשף ההזמנה האמיתי במודל, עם כוונת הדרגה */
  const handleHotspotSelect = (slot: MockupSlot) => {
    openOrderModal(slot.tier);
  };

  return (
    <section
      id="months"
      className="scroll-mt-20 border-y border-border bg-card/60 py-20 lg:py-28"
    >
      <div className="mx-auto max-w-[120rem] px-5 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <SectionEyebrow text={copy.eyebrow} />
          <h2 className="text-balance font-heading text-[clamp(1.9rem,4.5vw,3.25rem)] font-extrabold leading-[1.1] tracking-tight text-foreground">
            {copy.title}
          </h2>
          <p className="mt-4 text-base leading-[1.7] text-foreground/80">
            {copy.subtitle}
          </p>
          {/* מוסתר כשהחיפוש לא מצא כלום — אז אותו משפט עצמו מוצג
              בכרטיס התוצאה למטה, במקום שבו הוא באמת נחוץ. */}
          {noMatch ? null : (
            <p className="mt-4 whitespace-pre-line border-e-2 border-primary pe-4 text-[15px] leading-relaxed text-foreground">
              {copy.hint}
            </p>
          )}
        </div>

        {/* --- שדה החיפוש --- */}
        <div className="mx-auto mb-10 max-w-xl">
          <label
            htmlFor="category-filter"
            className="mb-2 block font-heading text-[17px] font-extrabold tracking-tight text-foreground"
          >
            {copy.filterLabel}
          </label>

          <div className="flex items-center rounded-full border border-border bg-card soft-shadow">
            <Search className="ms-4 size-4 shrink-0 text-muted-foreground" />
            <input
              id="category-filter"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setShowAll(false);
              }}
              placeholder={copy.filterPlaceholder}
              className="w-full bg-transparent px-3.5 py-3.5 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>

          {searching ? (
            <p className="mt-2.5 text-[13.5px] text-foreground/70">
              {matchedMonths.length === 0
                ? `לא מצאנו את "${trimmed}" ברשימת התחומים של החודשים הפתוחים.`
                : foundLine(matchedMonths.length, trimmed)}
              {hiddenCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setShowAll((value) => !value)}
                  className="ms-2 font-semibold text-primary underline underline-offset-2 hover:brightness-90"
                >
                  {showAll
                    ? "להציג רק את החודשים המתאימים"
                    : showOthersLine(hiddenCount)}
                </button>
              ) : null}
            </p>
          ) : null}
        </div>

        {months.length === 0 ? (
          <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-background p-8 text-center soft-shadow">
            <p className="mx-auto max-w-lg text-[16px] leading-relaxed text-foreground/80">
              {copy.emptyState}
            </p>
            <a
              href="#contact"
              className="mt-5 inline-flex items-center rounded-full bg-primary px-6 py-3.5 text-[15px] font-bold text-primary-foreground transition hover:brightness-105"
            >
              {copy.takenCta}
            </a>
          </div>
        ) : (
          <>
            {/* --- שורת דפדוף חודשים (pills), מעל הגיליון --- */}
            <div className="mb-8 flex flex-wrap justify-center gap-2">
              {pagerMonths.map((month) => {
                const active = month.editionId === viewedEditionId;
                return (
                  <button
                    key={month.editionId}
                    type="button"
                    onClick={() => setViewedEditionId(month.editionId)}
                    aria-current={active}
                    className={cn(
                      "whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-semibold transition",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground/70 hover:border-primary/60",
                    )}
                  >
                    {month.hebrewLabel}
                  </button>
                );
              })}
            </div>

            {/* --- הגיליון הגדול — תצוגה מקדימה חיה של CalendarMockup,
                אותו מודל נתונים בדיוק כמו שלב 2 באשף ההזמנה --- */}
            <CalendarMockup
              board={board}
              calendar={content.calendar}
              editions={editions}
              viewedEditionId={viewedEditionId}
              onViewedEditionChange={setViewedEditionId}
              anchorSlot={null}
              targetCount={null}
              selections={{}}
              onSelect={handleHotspotSelect}
            />

            {/* --- פרטי החודש הנצפה כרגע --- */}
            {currentMonth ? (
              <div className="mx-auto mt-8 max-w-[680px] rounded-2xl border border-border bg-background p-6 soft-shadow xl:max-w-[820px]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="text-[12px] font-semibold text-primary">
                      {currentMonth.hebrewLabel}
                    </span>
                    <h3 className="mt-1 font-heading text-xl font-extrabold tracking-tight text-foreground">
                      {currentMonth.conceptTitle}
                    </h3>
                    {currentMonth.marketingNote ? (
                      <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-foreground/70">
                        {currentMonth.marketingNote}
                      </p>
                    ) : null}
                  </div>

                  {currentMonth.fromPriceAgorot !== null ? (
                    <div className="text-left">
                      <p className="text-[11.5px] font-semibold text-foreground/60">
                        {copy.priceFromLabel}
                      </p>
                      <p className="font-heading text-2xl font-black leading-none text-foreground">
                        {formatPrice(currentMonth.fromPriceAgorot)}
                      </p>
                    </div>
                  ) : null}
                </div>

                {/* --- מתאים בין היתר ל: --- */}
                {currentMonth.categories.length > 0 ? (
                  <>
                    <p className="mt-5 text-[11.5px] font-semibold text-foreground/60">
                      {copy.suitableForLabel}
                    </p>
                    <ul className="mt-2.5 flex flex-wrap gap-1.5">
                      {currentMonth.categories.map((category) => {
                        const isMatch = matched?.has(category.slotId) ?? false;
                        return (
                          <li
                            key={category.slotId}
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-[12.5px] leading-none",
                              category.taken
                                ? "border-border text-muted-foreground line-through decoration-1"
                                : isMatch
                                  ? "border-primary bg-primary/10 font-semibold text-primary"
                                  : "border-border text-foreground/70",
                            )}
                          >
                            {category.name}
                          </li>
                        );
                      })}
                    </ul>
                  </>
                ) : null}

                {/* --- סטטוס דינמי לכל רמת נוכחות --- */}
                <div className="mt-5 grid gap-1.5 sm:max-w-sm">
                  {TIER_ORDER.map((tier) => {
                    const result = tierStatus(currentMonth.tiers[tier], status);
                    if (!result) return null;
                    return (
                      <p
                        key={tier}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-full px-3 py-1.5 text-[13px]",
                          TONE_CLASS[result.tone],
                        )}
                      >
                        <span className="font-bold not-italic no-underline">
                          {TIER_LABELS[tier]}
                        </span>
                        <span>{result.label}</span>
                      </p>
                    );
                  })}
                </div>

                <p className="mt-4 text-[13px] leading-relaxed text-foreground/70">
                  {copy.presenceLabel}
                </p>

                {/* --- תחום שנתפס, כשחיפשו אותו --- */}
                {matchedTaken.length > 0 && matchedFree.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-border bg-secondary/40 p-4">
                    <p className="font-heading text-[15px] font-bold text-foreground">
                      {copy.takenTitle}
                    </p>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-foreground/70">
                      {copy.takenBody}
                    </p>
                    <a
                      href="#contact"
                      className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] font-bold text-primary underline underline-offset-4 hover:brightness-90"
                    >
                      {copy.takenCta}
                      <ArrowLeft className="size-3.5" />
                    </a>
                  </div>
                ) : null}

                {/* --- מחיר החל מ: וכפתור ההזמנה --- */}
                <OrderCta
                  href="#order"
                  className={cn(
                    "mt-6 flex items-center justify-center rounded-full px-5 py-3.5 text-[14.5px] font-bold transition",
                    currentMonth.fromPriceAgorot === null
                      ? "border border-border text-muted-foreground"
                      : "bg-primary text-primary-foreground hover:brightness-105",
                  )}
                >
                  {currentMonth.fromPriceAgorot === null ? status.taken : copy.cta}
                </OrderCta>
              </div>
            ) : null}
          </>
        )}

        {/* לא נמצאה שום התאמה, בשום חודש. */}
        {noMatch ? (
          <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-border bg-background p-7 soft-shadow">
            <p className="whitespace-pre-line text-[16px] font-medium leading-relaxed text-foreground">
              {copy.hint}
            </p>
            <a
              href="#contact"
              className="mt-5 inline-flex items-center rounded-full bg-primary px-6 py-3.5 text-[15px] font-bold text-primary-foreground transition hover:brightness-105"
            >
              {copy.takenCta}
            </a>
          </div>
        ) : null}

        <p className="mx-auto mt-8 max-w-4xl text-[13.5px] leading-relaxed text-foreground/70">
          {copy.microcopy}
        </p>
      </div>
    </section>
  );
}
