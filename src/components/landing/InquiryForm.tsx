"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/primitives";
import { markInquirySubmitted } from "@/lib/popup-session";
import type { SiteContentData } from "@/lib/content";

/* ===============================================================
   15 · טופס פנייה — "בדקו לי התאמה".

   זה לא מסלול הקנייה. מי שכבר יודע מה הוא רוצה עובר לאשף
   ומשלם; הטופס הזה קיים בשביל מי שצריך שנעזור לו לבחור, ולכן
   הוא שולח ל-BusinessInquiry ולא יוצר הזמנה.
   =============================================================== */

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
    <section
      id="contact"
      className="snap-section scroll-mt-20 border-b border-line-2"
    >
      <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[380px_1fr]">
          <div>
            <div className="mb-5 flex items-center gap-3.5">
              <span className="progress-rule w-14" />
              <span className="mono-label text-[12.5px] text-ink-2">
                {copy.eyebrow}
              </span>
            </div>

            <h2 className="font-display text-[2rem] font-black leading-[1.1] tracking-tight text-ink">
              {copy.title}
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-ink-2">
              {copy.intro}
            </p>
          </div>

          <div className="border border-line-2 bg-surface p-7 lg:p-9">
            {sent ? (
              <div className="flex items-start gap-3.5">
                <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-accent" />
                <div>
                  <p className="font-display text-xl font-extrabold tracking-tight text-ink">
                    {status.inquiryReceived}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSent(false)}
                    className="mt-3 text-[14px] font-semibold text-accent underline underline-offset-4 hover:text-accent-strong"
                  >
                    לשליחת פנייה נוספת
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                <div className="grid gap-x-5 sm:grid-cols-2">
                  <Field
                    label={copy.businessNameLabel}
                    htmlFor="inq-business"
                    error={errors.businessName}
                  >
                    <Input
                      id="inq-business"
                      autoComplete="organization"
                      placeholder={copy.businessNamePlaceholder}
                      aria-invalid={!!errors.businessName}
                      {...bind("businessName")}
                    />
                  </Field>

                  <Field
                    label={copy.categoryLabel}
                    htmlFor="inq-category"
                    error={errors.category}
                  >
                    <Input
                      id="inq-category"
                      placeholder={copy.categoryPlaceholder}
                      aria-invalid={!!errors.category}
                      {...bind("category")}
                    />
                  </Field>

                  <Field label={copy.locationLabel} htmlFor="inq-location">
                    <Input
                      id="inq-location"
                      autoComplete="address-level2"
                      {...bind("location")}
                    />
                  </Field>

                  <Field
                    label={copy.contactNameLabel}
                    htmlFor="inq-contact"
                    error={errors.contactName}
                  >
                    <Input
                      id="inq-contact"
                      autoComplete="name"
                      aria-invalid={!!errors.contactName}
                      {...bind("contactName")}
                    />
                  </Field>

                  <Field
                    label={copy.phoneLabel}
                    htmlFor="inq-phone"
                    error={errors.phone}
                  >
                    <Input
                      id="inq-phone"
                      type="tel"
                      dir="ltr"
                      className="text-right"
                      autoComplete="tel"
                      aria-invalid={!!errors.phone}
                      {...bind("phone")}
                    />
                  </Field>

                  <Field
                    label={copy.emailLabel}
                    htmlFor="inq-email"
                    error={errors.email}
                  >
                    <Input
                      id="inq-email"
                      type="email"
                      dir="ltr"
                      className="text-right"
                      autoComplete="email"
                      aria-invalid={!!errors.email}
                      {...bind("email")}
                    />
                  </Field>
                </div>

                <Field
                  label={copy.monthGuessLabel}
                  htmlFor="inq-month"
                  hint={copy.optionalHint}
                >
                  <Input id="inq-month" {...bind("monthGuess")} />
                </Field>

                <Field
                  label={copy.noteLabel}
                  htmlFor="inq-note"
                  hint={copy.optionalHint}
                >
                  <Textarea id="inq-note" {...bind("note")} />
                </Field>

                {serverError ? (
                  <p className="mb-4 border-e-2 border-danger pe-3 text-[13.5px] text-danger">
                    {serverError}
                  </p>
                ) : null}

                <Button type="submit" loading={busy} className="shine-cta">
                  {copy.submitLabel}
                </Button>

                <p className="mt-4 text-[13.5px] leading-relaxed text-ink-2">
                  {copy.microcopy}
                </p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                  {copy.privacyNote}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
