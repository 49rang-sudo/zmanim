"use client";

import * as React from "react";
import { ArrowLeft, Search } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { TIER_LABELS, type PresenceTier } from "@/lib/packages";
import { categoryMatches, type LandingMonth } from "@/lib/landing-shared";
import type { SiteContentData } from "@/lib/content";

/* ===============================================================
   5 · בחירת חודש — האזור המרכזי באתר.

   שני כללים שאסור לשבור כאן:

   1. כל סטטוס בכרטיס מגיע מ-LandingMonth, כלומר ממסד הנתונים.
      "התחום נתפס" נכתב אך ורק כשיש שורת תפיסה אמיתית, ו"מספר
      המקומות מוגבל" נכתב אך ורק כשמישהו באמת כבר קנה. מחסור
      מומצא הוא שקר שהקהל הזה מזהה.

   2. הבורר עצמו לא משוכפל. הכרטיס הוא תצוגה מקדימה שמובילה
      לאשף ההזמנה (#order) — שם, ורק שם, בוחרים מקום ומשלמים.
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

  // דחיפות רק אחרי שבאמת נגסו במלאי. מלאי מלא של שני מקומות אינו
  // "מוגבל" — הוא פשוט קטן, וזה לא אותו דבר.
  if (tier.remaining < tier.capacity) {
    return tier.remaining === 1
      ? { label: copy.lastSpot, tone: "low" }
      : { label: copy.fillingUp, tone: "low" };
  }

  return { label: copy.available, tone: "free" };
}

const TONE_CLASS = {
  free: "border-line-2 text-ink",
  low: "border-accent text-accent",
  gone: "border-line text-muted line-through decoration-1",
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

export function MonthPicker({
  content,
  months,
}: {
  content: SiteContentData;
  months: LandingMonth[];
}) {
  const copy = content.landing.months;
  const status = content.landing.status;

  const [query, setQuery] = React.useState("");
  const [showAll, setShowAll] = React.useState(false);

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
  const visible = searching && !showAll ? matchedMonths : months;

  /** חיפשו משהו שאין לו אח ורע באף חודש פתוח */
  const noMatch = searching && matchedMonths.length === 0 && months.length > 0;

  return (
    <section
      id="months"
      className="snap-section scroll-mt-20 border-b border-line-2"
    >
      <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8 lg:py-20">
        <div className="mb-5 flex items-center gap-3.5">
          <span className="progress-rule w-14" />
          <span className="mono-label text-[12.5px] text-ink-2">
            {copy.eyebrow}
          </span>
        </div>

        <h2 className="max-w-4xl font-display text-[2rem] font-black leading-[1.1] tracking-tight text-ink sm:text-[2.4rem]">
          {copy.title}
        </h2>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-2">
          {copy.subtitle}
        </p>
        {/* מוסתר כשהחיפוש לא מצא כלום — אז אותו משפט עצמו מוצג בכרטיס
            התוצאה למטה, במקום שבו הוא באמת נחוץ. ראו שם. */}
        {noMatch ? null : (
          <p className="mt-4 max-w-3xl whitespace-pre-line border-e-2 border-accent pe-4 text-[15px] leading-relaxed text-ink">
            {copy.hint}
          </p>
        )}

        {/* --- שדה הסינון --- */}
        <div className="mt-9 max-w-xl">
          <label
            htmlFor="category-filter"
            className="mb-2 block font-display text-[17px] font-extrabold tracking-tight text-ink"
          >
            {copy.filterLabel}
          </label>

          <div className="flex items-center border border-line-2 bg-surface">
            <Search className="ms-4 size-4 shrink-0 text-muted" />
            <input
              id="category-filter"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setShowAll(false);
              }}
              placeholder={copy.filterPlaceholder}
              className="w-full bg-transparent px-3.5 py-3.5 text-[15px] text-ink placeholder:text-muted focus:outline-none"
            />
          </div>

          {searching ? (
            <p className="mt-2.5 text-[13.5px] text-ink-2">
              {matchedMonths.length === 0
                ? `לא מצאנו את "${trimmed}" ברשימת התחומים של החודשים הפתוחים.`
                : foundLine(matchedMonths.length, trimmed)}
              {hiddenCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setShowAll((value) => !value)}
                  className="ms-2 font-semibold text-accent underline underline-offset-2 hover:text-accent-strong"
                >
                  {showAll
                    ? "להציג רק את החודשים המתאימים"
                    : showOthersLine(hiddenCount)}
                </button>
              ) : null}
            </p>
          ) : null}
        </div>

        {/* --- כרטיסי החודשים --- */}
        {months.length === 0 ? (
          <div className="mt-10 border border-line-2 bg-surface p-8">
            <p className="max-w-2xl text-[16px] leading-relaxed text-ink-2">
              {copy.emptyState}
            </p>
            <a
              href="#contact"
              className="brand-cta shine-cta mt-5 inline-flex items-center px-6 py-3.5 text-[15px] font-bold"
            >
              {copy.takenCta}
            </a>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {visible.map((month) => (
              <MonthCard
                key={month.editionId}
                month={month}
                copy={copy}
                status={status}
                matched={matchesByMonth.get(month.editionId) ?? null}
                dimmed={searching && !matchesByMonth.has(month.editionId)}
              />
            ))}
          </div>
        )}

        {/* לא נמצאה שום התאמה, בשום חודש. כאן *אסור* לכתוב "התחום הזה
            כבר בפנים" (takenTitle/takenBody) — זה הניסוח למי שהתחום
            שלו נתפס, ואילו מי שהגיע לכאן התחום שלו כלל לא ברשימה.
            להכריז לו שהתחום נמכר זה פשוט שקר על המלאי.

            מה שכן נכון כאן הוא בדיוק ההערה שהלקוחה כתבה למצב הזה
            ("אם התחום שלכם לא מופיע ברשימה - אל תוותרו עליו"), ולכן
            היא עוברת לכאן — ומוסתרת למעלה — כדי שאותו משפט לא יופיע
            פעמיים על אותו מסך. */}
        {noMatch ? (
          <div className="mt-8 border border-line-2 bg-surface p-7">
            <p className="max-w-2xl whitespace-pre-line text-[16px] font-medium leading-relaxed text-ink">
              {copy.hint}
            </p>
            <a
              href="#contact"
              className="brand-cta shine-cta mt-5 inline-flex items-center px-6 py-3.5 text-[15px] font-bold"
            >
              {copy.takenCta}
            </a>
          </div>
        ) : null}

        <p className="mt-8 max-w-4xl text-[13.5px] leading-relaxed text-ink-2">
          {copy.microcopy}
        </p>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- */

function MonthCard({
  month,
  copy,
  status,
  matched,
  dimmed,
}: {
  month: LandingMonth;
  copy: SiteContentData["landing"]["months"];
  status: StatusCopy;
  /** מזהי המקומות שהתאימו לחיפוש, או null כשלא מחפשים */
  matched: Set<string> | null;
  dimmed: boolean;
}) {
  // תחום שהמשתמש חיפש ושכבר נמכר בחודש הזה — זה בדיוק המצב
  // שהלקוחה כתבה לו קופי משלו ("התחום הזה כבר בפנים").
  const matchedTaken = matched
    ? month.categories.filter((c) => matched.has(c.slotId) && c.taken)
    : [];
  const matchedFree = matched
    ? month.categories.filter((c) => matched.has(c.slotId) && !c.taken)
    : [];

  return (
    <article
      className={cn(
        "flex flex-col border bg-surface transition-opacity duration-300 ease-smooth",
        matched && matchedFree.length > 0
          ? "border-accent"
          : "border-line-2",
        dimmed && "opacity-55",
      )}
    >
      {month.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={month.imageUrl}
          alt={`הקונספט של חודש ${month.hebrewLabel}: ${month.conceptTitle}`}
          className="w-full border-b border-line-2 object-cover"
          style={{ aspectRatio: String(month.aspectRatio) }}
        />
      ) : null}

      <div className="flex flex-1 flex-col p-6">
        <span className="mono-label text-[12px] text-accent">
          {month.hebrewLabel}
        </span>
        <h3 className="mt-1.5 font-display text-xl font-extrabold tracking-tight text-ink">
          {month.conceptTitle}
        </h3>

        {month.marketingNote ? (
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
            {month.marketingNote}
          </p>
        ) : null}

        {/* --- מתאים בין היתר ל: --- */}
        {month.categories.length > 0 ? (
          <>
            <p className="mono-label mt-5 text-[11.5px] text-ink-2">
              {copy.suitableForLabel}
            </p>
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {month.categories.map((category) => {
                const isMatch = matched?.has(category.slotId) ?? false;
                return (
                  <li
                    key={category.slotId}
                    className={cn(
                      "border px-2.5 py-1 text-[12.5px] leading-none",
                      category.taken
                        ? "border-line text-muted line-through decoration-1"
                        : isMatch
                          ? "border-accent bg-accent-soft font-semibold text-accent-strong"
                          : "border-line text-ink-2",
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
        <div className="mt-5 grid gap-1.5">
          {TIER_ORDER.map((tier) => {
            const result = tierStatus(month.tiers[tier], status);
            if (!result) return null;
            return (
              <p
                key={tier}
                className={cn(
                  "flex items-center justify-between gap-3 border-s-2 ps-3 text-[13px]",
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

        <p className="mt-4 text-[13px] leading-relaxed text-ink-2">
          {copy.presenceLabel}
        </p>

        {/* --- תחום שנתפס, כשחיפשו אותו --- */}
        {matchedTaken.length > 0 && matchedFree.length === 0 ? (
          <div className="mt-5 border border-line bg-surface-2 p-4">
            <p className="font-display text-[15px] font-bold text-ink">
              {copy.takenTitle}
            </p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">
              {copy.takenBody}
            </p>
            <a
              href="#contact"
              className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] font-bold text-accent underline underline-offset-4 hover:text-accent-strong"
            >
              {copy.takenCta}
              <ArrowLeft className="size-3.5" />
            </a>
          </div>
        ) : null}

        {/* --- מחיר החל מ: --- */}
        <div className="mt-auto pt-6">
          {month.fromPriceAgorot !== null ? (
            <p className="flex items-baseline gap-2 border-t border-line pt-4">
              <span className="mono-label text-[11.5px] text-ink-2">
                {copy.priceFromLabel}
              </span>
              <span className="tnum font-display text-2xl font-black leading-none text-ink">
                {formatPrice(month.fromPriceAgorot)}
              </span>
            </p>
          ) : null}

          <a
            href="#order"
            className={cn(
              "mt-4 flex items-center justify-center px-5 py-3.5 text-[14.5px] font-bold",
              month.fromPriceAgorot === null
                ? "border border-line text-muted"
                : "brand-cta shine-cta",
            )}
          >
            {month.fromPriceAgorot === null ? status.taken : copy.cta}
          </a>
        </div>
      </div>
    </article>
  );
}
