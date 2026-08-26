"use client";

import * as React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { markInquirySubmitted } from "@/lib/popup-session";
import type { SiteContentData } from "@/lib/content";

/* ===============================================================
   15 · טופס פנייה — "בדקו לי התאמה".

   פורט מבני מ-zmanim2-base44/src/components/zmanim/ContactForm.jsx
   (שדות/עיצוב), אבל נשאר מחובר ל-/api/inquiries האמיתי, לא
   ל-SDK של Base44 — וזה לא מסלול הקנייה. מי שכבר יודע מה הוא
   רוצה עובר לאשף ומשלם; הטופס הזה קיים בשביל מי שצריך שנעזור לו
   לבחור, ולכן הוא שולח ל-BusinessInquiry ולא יוצר הזמנה. שדות
   השגיאה (validation אמיתי מול השרת) הם תוספת אמיתית שלנו על
   המוקאפ — נשארים, בעיצוב של Base44.
   =============================================================== */

function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </label>
  );
}

function fieldClass(invalid?: boolean) {
  return `w-full h-11 rounded-xl border ${
    invalid ? "border-destructive" : "border-border"
  } bg-background px-4 text-sm transition focus:border-primary focus:outline-none`;
}

const PHONE = /^[0-9+\-\s()]{9,20}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type FormState = {
  businessName: string;
  category: string;
  location: string;
  contactName: string;
  phone: string;
  email: string;
  monthGuess: string;
  note: string;
};

const EMPTY: FormState = {
  businessName: "",
  category: "",
  location: "",
  contactName: "",
  phone: "",
  email: "",
  monthGuess: "",
  note: "",
};

export function InquiryForm({ content }: { content: SiteContentData }) {
  const copy = content.landing.inquiry;
  const status = content.landing.status;

  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const bind = (key: keyof FormState) => ({
    value: form[key],
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => setForm((prev) => ({ ...prev, [key]: event.target.value })),
  });

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const next: Partial<Record<keyof FormState, string>> = {};
    if (form.businessName.trim().length < 2) next.businessName = "נא למלא את שם העסק";
    if (form.category.trim().length < 2) next.category = "נא לפרט מה העסק מציע";
    if (form.contactName.trim().length < 2) next.contactName = "נא למלא שם ליצירת קשר";
    if (!PHONE.test(form.phone.trim())) next.phone = "מספר טלפון לא תקין";
    if (!EMAIL.test(form.email.trim())) next.email = "כתובת מייל לא תקינה";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    setServerError(null);

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          source: "FORM",
          businessName: form.businessName.trim(),
          category: form.category.trim(),
          location: form.location.trim(),
          contactName: form.contactName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          monthGuess: form.monthGuess.trim(),
          note: form.note.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setServerError(body?.error?.message ?? "השליחה נכשלה. נסו שוב בעוד רגע.");
        return;
      }

      markInquirySubmitted();
      setSent(true);
      setForm(EMPTY);
    } catch {
      setServerError("שגיאת רשת. נסו שוב.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="contact" className="scroll-mt-20 py-20 lg:py-28">
      <div className="mx-auto max-w-2xl px-5 lg:px-8">
        <div className="mb-10 text-center">
          <div className="mb-5 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-primary" />
            <span className="text-xs font-semibold tracking-wide text-primary">
              {copy.eyebrow}
            </span>
            <span className="h-px w-8 bg-primary" />
          </div>
          <h2 className="text-balance font-heading text-[clamp(1.8rem,4vw,3rem)] font-extrabold leading-[1.1] tracking-tight text-foreground">
            {copy.title}
          </h2>
          <p className="mt-4 text-sm leading-[1.7] text-muted-foreground">{copy.intro}</p>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center soft-shadow">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mb-2 font-heading text-xl font-bold">{status.inquiryReceived}</h3>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mx-auto mt-1 block text-sm font-semibold text-primary underline underline-offset-4"
            >
              לשליחת פנייה נוספת
            </button>
          </div>
        ) : (
          <form
            onSubmit={submit}
            noValidate
            className="space-y-4 rounded-2xl border border-border bg-card p-6 soft-shadow lg:p-8"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={copy.businessNameLabel} htmlFor="inq-business" error={errors.businessName}>
                <input
                  id="inq-business"
                  autoComplete="organization"
                  placeholder={copy.businessNamePlaceholder}
                  aria-invalid={!!errors.businessName}
                  className={fieldClass(!!errors.businessName)}
                  {...bind("businessName")}
                />
              </Field>

              <Field label={copy.categoryLabel} htmlFor="inq-category" error={errors.category}>
                <input
                  id="inq-category"
                  placeholder={copy.categoryPlaceholder}
                  aria-invalid={!!errors.category}
                  className={fieldClass(!!errors.category)}
                  {...bind("category")}
                />
              </Field>

              <Field label={copy.locationLabel} htmlFor="inq-location">
                <input
                  id="inq-location"
                  autoComplete="address-level2"
                  className={fieldClass()}
                  {...bind("location")}
                />
              </Field>

              <Field label={copy.contactNameLabel} htmlFor="inq-contact" error={errors.contactName}>
                <input
                  id="inq-contact"
                  autoComplete="name"
                  aria-invalid={!!errors.contactName}
                  className={fieldClass(!!errors.contactName)}
                  {...bind("contactName")}
                />
              </Field>

              <Field label={copy.phoneLabel} htmlFor="inq-phone" error={errors.phone}>
                <input
                  id="inq-phone"
                  type="tel"
                  dir="ltr"
                  autoComplete="tel"
                  aria-invalid={!!errors.phone}
                  className={`text-right ${fieldClass(!!errors.phone)}`}
                  {...bind("phone")}
                />
              </Field>

              <Field label={copy.emailLabel} htmlFor="inq-email" error={errors.email}>
                <input
                  id="inq-email"
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  className={`text-right ${fieldClass(!!errors.email)}`}
                  {...bind("email")}
                />
              </Field>
            </div>

            <Field label={copy.monthGuessLabel} htmlFor="inq-month" hint={copy.optionalHint}>
              <input id="inq-month" className={fieldClass()} {...bind("monthGuess")} />
            </Field>

            <Field label={copy.noteLabel} htmlFor="inq-note" hint={copy.optionalHint}>
              <textarea
                id="inq-note"
                rows={3}
                className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm transition focus:border-primary focus:outline-none"
                {...bind("note")}
              />
            </Field>

            {serverError ? (
              <p className="text-sm text-destructive">{serverError}</p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary font-bold text-primary-foreground shadow-sm transition hover:brightness-105 disabled:opacity-50"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> שולח…
                </>
              ) : (
                copy.submitLabel
              )}
            </button>

            <p className="text-center text-xs text-muted-foreground">{copy.microcopy}</p>
            <p className="text-center text-[11px] leading-relaxed text-muted-foreground/80">
              {copy.privacyNote}
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
