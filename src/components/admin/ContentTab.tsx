"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/primitives";
import type { SiteContentData } from "@/lib/content";

/* עוזרי קריאה/כתיבה לפי נתיב מקונן, כדי לא לכתוב onChange לכל שדה */
function getPath(object: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (acc, key) => (acc as Record<string, unknown>)?.[key],
      object,
    );
}

function setPath<T>(object: T, path: string, value: unknown): T {
  const keys = path.split(".");
  const clone = structuredClone(object);
  let cursor = clone as Record<string, unknown>;

  for (const key of keys.slice(0, -1)) {
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[keys.at(-1)!] = value;

  return clone;
}

export function ContentTab() {
  const [content, setContent] = React.useState<SiteContentData | null>(null);
  const [landingEnabled, setLandingEnabled] = React.useState(true);
  const [tosVersion, setTosVersion] = React.useState("1.0");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    const res = await fetch("/api/admin/content", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data?.error?.message ?? "טעינת התוכן נכשלה");
      return;
    }
    setContent(data.content);
    setLandingEnabled(data.landingEnabled);
    setTosVersion(data.tosVersion);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!content) return;
    setSaving(true);

    const res = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content, landingEnabled, tosVersion }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      toast.error(data?.error?.message ?? "השמירה נכשלה");
      return;
    }
    toast.success("התוכן נשמר ופורסם");
  };

  const restore = async () => {
    if (!confirm("לשחזר את כל הטקסטים לברירת המחדל? העריכות שלכם יימחקו.")) {
      return;
    }
    const res = await fetch("/api/admin/content", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data?.error?.message ?? "השחזור נכשל");
      return;
    }
    setContent(data.content);
    toast.success("שוחזר תוכן ברירת המחדל");
  };

  if (!content) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-40" />
        ))}
      </div>
    );
  }

  const bind = (path: string) => ({
    value: String(getPath(content, path) ?? ""),
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => setContent(setPath(content, path, event.target.value)),
  });

  return (
    <div className="pb-24">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* --- כללי --- */}
        <Section title="כללי">
          <label className="mb-4 flex cursor-pointer items-center gap-2.5 rounded-md border border-line bg-surface-2 p-3.5">
            <input
              type="checkbox"
              checked={landingEnabled}
              onChange={(e) => setLandingEnabled(e.target.checked)}
              className="size-4 accent-[var(--color-accent)]"
            />
            <span className="text-[13.5px] text-ink">
              הצגת עמוד נחיתה לפני האשף
              <span className="block text-[12px] text-muted">
                בכיבוי, המבקרים נוחתים ישירות על בחירת המשבצת
              </span>
            </span>
          </label>

          <LogoField
            value={content.brand.logoUrl ?? null}
            onChange={(url) => setContent(setPath(content, "brand.logoUrl", url))}
          />

          <Field label="שם האתר" htmlFor="siteName">
            <Input id="siteName" {...bind("brand.siteName")} />
          </Field>
          <Field label="שורת תיאור" htmlFor="tagline">
            <Input id="tagline" {...bind("brand.tagline")} />
          </Field>
          <Field label="טלפון" htmlFor="phone">
            <Input id="phone" dir="ltr" {...bind("contact.phone")} />
          </Field>
          <Field label="אימייל" htmlFor="email">
            <Input id="email" dir="ltr" {...bind("contact.email")} />
          </Field>
          <Field label="שורת סיום" htmlFor="footerNote">
            <Input id="footerNote" {...bind("footer.note")} />
          </Field>
        </Section>

        {/* --- גיבור --- */}
        <Section title="עמוד הנחיתה">
          <Field label="כותרת עליונה" htmlFor="eyebrow">
            <Input id="eyebrow" {...bind("hero.eyebrow")} />
          </Field>
          <Field label="כותרת ראשית" htmlFor="heroTitle">
            <Textarea id="heroTitle" {...bind("hero.title")} />
          </Field>
          <Field label="תת-כותרת" htmlFor="heroSubtitle">
            <Textarea id="heroSubtitle" {...bind("hero.subtitle")} />
          </Field>

          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field label="כפתור ראשי" htmlFor="cta1">
              <Input id="cta1" {...bind("hero.primaryCta")} />
            </Field>
            <Field label="כפתור משני" htmlFor="cta2">
              <Input id="cta2" {...bind("hero.secondaryCta")} />
            </Field>
          </div>

          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted">
            מספרים בולטים
          </p>
          {content.hero.stats.map((_, index) => (
            <div key={index} className="mb-2 grid grid-cols-[100px_1fr] gap-2">
              <Input {...bind(`hero.stats.${index}.value`)} />
              <Input {...bind(`hero.stats.${index}.label`)} />
            </div>
          ))}
        </Section>

        {/* --- לוח השנה --- */}
        <Section title="לוח השנה במוקאפ">
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field label="שם החודש העברי" htmlFor="monthLabel">
              <Input id="monthLabel" {...bind("calendar.monthLabel")} />
            </Field>
            <Field label="שנה עברית" htmlFor="yearLabel">
              <Input id="yearLabel" {...bind("calendar.yearLabel")} />
            </Field>
            <Field label="חודש לועזי (1-12)" htmlFor="gMonth">
              <Input
                id="gMonth"
                type="number"
                min={1}
                max={12}
                value={content.calendar.gregorianMonth}
                onChange={(e) =>
                  setContent(
                    setPath(
                      content,
                      "calendar.gregorianMonth",
                      Number(e.target.value),
                    ),
                  )
                }
              />
            </Field>
            <Field label="שנה לועזית" htmlFor="gYear">
              <Input
                id="gYear"
                type="number"
                min={2020}
                max={2100}
                value={content.calendar.gregorianYear}
                onChange={(e) =>
                  setContent(
                    setPath(
                      content,
                      "calendar.gregorianYear",
                      Number(e.target.value),
                    ),
                  )
                }
              />
            </Field>
          </div>
          <Field label="הערת שוליים" htmlFor="footnote">
            <Input id="footnote" {...bind("calendar.footnote")} />
          </Field>
        </Section>

        {/* --- טקסטים באשף --- */}
        <Section title="טקסטים באשף ההזמנה">
          {(
            [
              ["chooseTitle", "כותרת — בחירת משבצת"],
              ["chooseSubtitle", "הסבר — בחירת משבצת"],
              ["cityTitle", "כותרת — בחירת מהדורה"],
              ["citySubtitle", "הסבר — בחירת מהדורה"],
              ["detailsTitle", "כותרת — פרטים"],
              ["uploadTitle", "כותרת — העלאת קובץ"],
              ["uploadSubtitle", "הסבר — דרישות הקובץ"],
              ["payTitle", "כותרת — תשלום"],
              ["cityFullMessage", "הודעה — מהדורה מלאה"],
              ["slotTakenMessage", "הודעה — משבצת תפוסה"],
              ["successTitle", "כותרת — הזמנה הושלמה"],
              ["successBody", "הודעה — הזמנה הושלמה"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label} htmlFor={key}>
              <Input id={key} {...bind(`wizard.${key}`)} />
            </Field>
          ))}
        </Section>
      </div>

      {/* --- תנאי התקשרות --- */}
      <Section title="תנאי התקשרות" className="mt-5">
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Field label="כותרת" htmlFor="tosTitle">
            <Input id="tosTitle" {...bind("tos.title")} />
          </Field>
          <Field
            label="גרסת התנאים"
            htmlFor="tosVersion"
            hint="העלאת הגרסה מתועדת בכל הזמנה חדשה"
          >
            <Input
              id="tosVersion"
              value={tosVersion}
              onChange={(e) => setTosVersion(e.target.value)}
            />
          </Field>
        </div>

        <Field label="פסקת פתיחה" htmlFor="tosIntro">
          <Textarea id="tosIntro" {...bind("tos.intro")} />
        </Field>

        <Field label="טקסט תיבת האישור" htmlFor="tosAccept">
          <Input id="tosAccept" {...bind("tos.acceptLabel")} />
        </Field>

        <p className="mb-2 mt-4 text-[12px] font-semibold uppercase tracking-wide text-muted">
          סעיפים
        </p>

        {content.tos.sections.map((_, index) => (
          <div
            key={index}
            className="mb-3 rounded-md border border-line bg-surface-2 p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="tnum grid size-6 place-items-center rounded-full bg-surface-3 text-[11px] font-bold text-ink-2">
                {index + 1}
              </span>
              <Input
                className="flex-1"
                placeholder="כותרת הסעיף"
                {...bind(`tos.sections.${index}.heading`)}
              />
              <Button
                variant="quiet"
                size="icon"
                aria-label="מחיקת סעיף"
                onClick={() =>
                  setContent(
                    setPath(
                      content,
                      "tos.sections",
                      content.tos.sections.filter((_, i) => i !== index),
                    ),
                  )
                }
              >
                <Trash2 className="size-4 text-danger" />
              </Button>
            </div>
            <Textarea {...bind(`tos.sections.${index}.body`)} />
          </div>
        ))}

        <Button
          variant="subtle"
          size="sm"
          onClick={() =>
            setContent(
              setPath(content, "tos.sections", [
                ...content.tos.sections,
                { heading: "סעיף חדש", body: "" },
              ]),
            )
          }
        >
          <Plus className="size-4" />
          הוספת סעיף
        </Button>
      </Section>

      {/* --- הוכחה חברתית --- */}
      <Section title="הוכחה חברתית" className="mt-5">
        <p className="mb-4 text-[12.5px] leading-relaxed text-muted">
          הסקשן מוצג בעמוד הנחיתה רק אחרי שיש לפחות לוגו אחד או ציטוט
          אחד למטה — כל עוד שניהם ריקים הוא נשאר מוסתר לגמרי.
        </p>

        <div className="grid gap-x-4 sm:grid-cols-2">
          <Field label="כותרת עליונה" htmlFor="socialProofEyebrow">
            <Input
              id="socialProofEyebrow"
              {...bind("landing.socialProof.eyebrow")}
            />
          </Field>
          <Field label="כותרת" htmlFor="socialProofHeading">
            <Input
              id="socialProofHeading"
              {...bind("landing.socialProof.heading")}
            />
          </Field>
        </div>

        <p className="mb-2 mt-4 text-[12px] font-semibold uppercase tracking-wide text-muted">
          לוגואים / שמות עסקים
        </p>
        {content.landing.socialProof.logos.map((_, index) => (
          <div key={index} className="mb-2 flex items-center gap-2">
            <Input
              className="flex-1"
              placeholder="שם העסק"
              {...bind(`landing.socialProof.logos.${index}`)}
            />
            <Button
              variant="quiet"
              size="icon"
              aria-label="הסרת לוגו"
              onClick={() =>
                setContent(
                  setPath(
                    content,
                    "landing.socialProof.logos",
                    content.landing.socialProof.logos.filter(
                      (_, i) => i !== index,
                    ),
                  ),
                )
              }
            >
              <Trash2 className="size-4 text-danger" />
            </Button>
          </div>
        ))}
        <Button
          variant="subtle"
          size="sm"
          onClick={() =>
            setContent(
              setPath(content, "landing.socialProof.logos", [
                ...content.landing.socialProof.logos,
                "",
              ]),
            )
          }
        >
          <Plus className="size-4" />
          הוספת לוגו
        </Button>

        <p className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-wide text-muted">
          ציטוטים
        </p>
        {content.landing.socialProof.quotes.map((_, index) => (
          <div
            key={index}
            className="mb-3 rounded-md border border-line bg-surface-2 p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="tnum grid size-6 place-items-center rounded-full bg-surface-3 text-[11px] font-bold text-ink-2">
                {index + 1}
              </span>
              <div className="grid flex-1 gap-2 sm:grid-cols-2">
                <Input
                  placeholder="שם"
                  {...bind(`landing.socialProof.quotes.${index}.name`)}
                />
                <Input
                  placeholder="שם העסק"
                  {...bind(`landing.socialProof.quotes.${index}.business`)}
                />
              </div>
              <Button
                variant="quiet"
                size="icon"
                aria-label="מחיקת ציטוט"
                onClick={() =>
                  setContent(
                    setPath(
                      content,
                      "landing.socialProof.quotes",
                      content.landing.socialProof.quotes.filter(
                        (_, i) => i !== index,
                      ),
                    ),
                  )
                }
              >
                <Trash2 className="size-4 text-danger" />
              </Button>
            </div>
            <Textarea
              placeholder="הציטוט"
              {...bind(`landing.socialProof.quotes.${index}.quote`)}
            />
          </div>
        ))}
        <Button
          variant="subtle"
          size="sm"
          onClick={() =>
            setContent(
              setPath(content, "landing.socialProof.quotes", [
                ...content.landing.socialProof.quotes,
                { quote: "", name: "", business: "" },
              ]),
            )
          }
        >
          <Plus className="size-4" />
          הוספת ציטוט
        </Button>
      </Section>

      {/* --- סרגל שמירה דביק --- */}
      <div className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line">
        <div className="mx-auto flex max-w-7xl items-center justify-end gap-3 px-5 py-3.5">
          <Button variant="quiet" size="sm" onClick={restore}>
            <RotateCcw className="size-3.5" />
            שחזור ברירת מחדל
          </Button>
          <Button loading={saving} onClick={save}>
            <Save className="size-4" />
            שמירה ופרסום
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * העלאת לוגו. הקובץ עולה מיד לאחסון, אבל הכתובת נשמרת רק
 * בלחיצה על "שמירה ופרסום" — כמו כל שאר שדות התוכן.
 */
function LogoField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setBusy(true);
    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/admin/media", { method: "POST", body: form });
    const data = await res.json();
    setBusy(false);

    if (!res.ok) {
      toast.error(data?.error?.message ?? "העלאת הלוגו נכשלה");
      return;
    }

    onChange(data.url);
    toast.success("הלוגו הועלה — אל תשכחו לשמור");
  };

  return (
    <div className="mb-4">
      <p className="mb-1.5 text-[13px] font-medium text-ink-2">לוגו</p>

      <div className="flex items-center gap-4 rounded-md border border-line bg-surface-2 p-3.5">
        <div className="grid h-14 w-24 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-surface">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="הלוגו הנוכחי"
              className="max-h-12 max-w-20 object-contain"
            />
          ) : (
            <span className="text-[11px] text-muted">אין לוגו</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="subtle"
              loading={busy}
              onClick={() => inputRef.current?.click()}
            >
              {value ? "החלפה" : "העלאת לוגו"}
            </Button>

            {value ? (
              <Button
                size="sm"
                variant="quiet"
                onClick={() => onChange(null)}
              >
                הסרה
              </Button>
            ) : null}
          </div>

          <p className="mt-1.5 text-[11.5px] leading-snug text-muted">
            PNG · JPG · WEBP · SVG, עד 3 מ״ב. מומלץ רוחב 400px לפחות,
            רקע שקוף. כשאין לוגו מוצג שם האתר בלבד.
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept=".png,.jpg,.jpeg,.webp,.svg"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-line bg-surface p-5 shadow-e1 ${className ?? ""}`}
    >
      <h3 className="mb-4 font-display text-xl font-semibold text-ink">
        {title}
      </h3>
      {children}
    </section>
  );
}
