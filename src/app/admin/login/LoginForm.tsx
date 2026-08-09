"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/primitives";

export function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const data = new FormData(event.currentTarget);

    const result = await signIn("credentials", {
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
      redirect: false,
    });

    setBusy(false);

    // הודעה אחידה בכוונה — לא מגלים אם האימייל קיים במערכת
    if (!result || result.error) {
      setError("אימייל או סיסמה שגויים");
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-line bg-surface p-6 shadow-e2"
    >
      <Field label="אימייל" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          dir="ltr"
          required
          autoComplete="username"
          autoFocus
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

      {error ? (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-danger/40 bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] p-3">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" />
          <p className="text-[13px] text-danger">{error}</p>
        </div>
      ) : null}

      <Button type="submit" className="w-full" loading={busy}>
        <LogIn className="size-4" />
        כניסה
      </Button>
    </form>
  );
}
