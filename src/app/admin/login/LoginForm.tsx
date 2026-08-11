"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/primitives";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.28 1.48-1.13 2.73-2.4 3.58v2.98h3.89c2.28-2.1 3.53-5.19 3.53-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.92l-3.89-2.98c-1.08.72-2.46 1.15-4.04 1.15-3.11 0-5.74-2.1-6.68-4.92H1.3v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.32 14.33A7.2 7.2 0 0 1 4.93 12c0-.81.14-1.6.39-2.33V6.58H1.3A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.3 5.42l4.02-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.61 4.58 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.3 6.58l4.02 3.09C6.26 6.85 8.89 4.75 12 4.75z"
      />
    </svg>
  );
}

export function LoginForm({ error }: { error?: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setFormError(null);

    const data = new FormData(event.currentTarget);

    const result = await signIn("credentials", {
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
      redirect: false,
    });

    setBusy(false);

    // הודעה אחידה בכוונה — לא מגלים אם האימייל קיים במערכת
    if (!result || result.error) {
      setFormError("אימייל או סיסמה שגויים");
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-6 shadow-e2">
      {error ? (
        <div className="mb-4 rounded-md border border-danger/40 bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] p-3">
          <p className="text-[13px] text-danger">
            {error === "AccessDenied"
              ? "החשבון הזה אינו מורשה לגשת לניהול."
              : "אירעה שגיאה בהתחברות. נסו שוב."}
          </p>
        </div>
      ) : null}

      <Button
        className="w-full"
        onClick={() => signIn("google", { callbackUrl: "/admin" })}
      >
        <GoogleMark />
        כניסה עם Google
      </Button>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-[12px] text-muted">או</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={submit}>
        <Field label="אימייל" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            dir="ltr"
            required
            autoComplete="username"
          />
        </Field>

        <Field label="סיסמה" htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            dir="ltr"
            required
            autoComplete="current-password"
          />
        </Field>

        {formError ? (
          <div className="mb-4 flex items-start gap-2 rounded-md border border-danger/40 bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] p-3">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" />
            <p className="text-[13px] text-danger">{formError}</p>
          </div>
        ) : null}

        <Button type="submit" variant="subtle" className="w-full" loading={busy}>
          <LogIn className="size-4" />
          כניסה עם סיסמה
        </Button>
      </form>
    </div>
  );
}
