"use client";

import * as React from "react";
import { toast } from "sonner";
import { KeyRound, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Field, Input } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/utils";

type TeamMember = {
  id: string;
  email: string;
  name: string | null;
  role: "OWNER" | "ADMIN";
  lastLoginAt: string | null;
  createdAt: string;
  hasPassword: boolean;
};

export function TeamTab() {
  const [users, setUsers] = React.useState<TeamMember[] | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [removingId, setRemovingId] = React.useState<string | null>(null);
  const [passwordEditId, setPasswordEditId] = React.useState<string | null>(
    null,
  );

  const load = React.useCallback(async () => {
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data?.error?.message ?? "טעינת רשימת הצוות נכשלה");
      setUsers([]);
      return;
    }
    setUsers(data.users);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const addUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setAdding(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: data.get("email"),
        name: data.get("name") || null,
        password: data.get("password") || null,
      }),
    });
    const body = await res.json();
    setAdding(false);

    if (!res.ok) {
      toast.error(body?.error?.message ?? "הוספת המייל נכשלה");
      return;
    }

    toast.success(`${body.user.email} נוסף/ה לצוות הניהול`);
    form.reset();
    load();
  };

  const removeUser = async (user: TeamMember) => {
    if (!confirm(`להסיר את ${user.email} מהרשאות הניהול?`)) return;

    setRemovingId(user.id);
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    const body = await res.json();
    setRemovingId(null);

    if (!res.ok) {
      toast.error(body?.error?.message ?? "ההסרה נכשלה");
      return;
    }

    toast.success(`${user.email} הוסר/ה`);
    load();
  };

  if (users === null) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="skeleton h-16" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 rounded-xl border border-border bg-secondary/40 p-4">
        <p className="text-[13.5px] leading-relaxed text-muted-foreground">
          <strong className="text-foreground">כניסה לניהול אפשרית עם Google או עם סיסמה.</strong>{" "}
          רק מי שמופיע/ה ברשימה למטה יכול/ה להתחבר — הוספה כאן היא הדרך
          היחידה לתת גישה, אין הרשמה עצמאית. סיסמה היא אופציונלית: בלעדיה
          אפשר להתחבר רק דרך Google.
        </p>
      </div>

      <form
        onSubmit={addUser}
        className="mb-6 grid gap-x-4 gap-y-1 rounded-2xl border border-border bg-card p-5 soft-shadow sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
      >
        <Field label="אימייל" htmlFor="new-email">
          <Input
            id="new-email"
            name="email"
            type="email"
            dir="ltr"
            required
            placeholder="name@gmail.com"
          />
        </Field>

        <Field label="שם (אופציונלי)" htmlFor="new-name">
          <Input id="new-name" name="name" />
        </Field>

        <Field label="סיסמה (אופציונלי)" htmlFor="new-password">
          <Input
            id="new-password"
            name="password"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            placeholder="לפחות 10 תווים, אות וספרה"
          />
        </Field>

        <Button type="submit" loading={adding} className="mb-4">
          <UserPlus className="size-4" />
          הוספה
        </Button>
      </form>

      <div className="grid gap-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="rounded-2xl border border-border bg-card p-4 soft-shadow"
          >
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground" dir="ltr">
                  {user.email}
                </p>
                <p className="text-[12.5px] text-muted-foreground">
                  {user.name ?? "—"}
                  {user.lastLoginAt
                    ? ` · כניסה אחרונה ${formatDateTime(user.lastLoginAt)}`
                    : " · טרם התחבר/ה"}
                </p>
              </div>

              <Badge tone={user.role === "OWNER" ? "accent" : "neutral"}>
                {user.role === "OWNER" ? "בעל/ת חשבון" : "אדמין"}
              </Badge>

              <Badge tone={user.hasPassword ? "success" : "neutral"}>
                {user.hasPassword ? "Google + סיסמה" : "Google בלבד"}
              </Badge>

              <Button
                variant="quiet"
                size="sm"
                onClick={() =>
                  setPasswordEditId(passwordEditId === user.id ? null : user.id)
                }
              >
                <KeyRound className="size-3.5" />
                {user.hasPassword ? "איפוס סיסמה" : "קביעת סיסמה"}
              </Button>

              {user.role !== "OWNER" ? (
                <Button
                  variant="quiet"
                  size="sm"
                  loading={removingId === user.id}
                  onClick={() => removeUser(user)}
                >
                  <Trash2 className="size-3.5" />
                  הסרה
                </Button>
              ) : null}
            </div>

            {passwordEditId === user.id ? (
              <PasswordEditor
                user={user}
                onDone={() => {
                  setPasswordEditId(null);
                  load();
                }}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function PasswordEditor({
  user,
  onDone,
}: {
  user: TeamMember;
  onDone: () => void;
}) {
  const [saving, setSaving] = React.useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "").trim();

    setSaving(true);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: password || null }),
    });
    const body = await res.json();
    setSaving(false);

    if (!res.ok) {
      toast.error(body?.error?.message ?? "עדכון הסיסמה נכשל");
      return;
    }

    toast.success(
      password ? `סיסמה עודכנה עבור ${user.email}` : `הסיסמה הוסרה עבור ${user.email}`,
    );
    onDone();
  };

  const removePassword = async () => {
    if (!confirm(`להסיר את הסיסמה של ${user.email}? הכניסה תישאר אפשרית רק דרך Google.`))
      return;

    setSaving(true);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: null }),
    });
    const body = await res.json();
    setSaving(false);

    if (!res.ok) {
      toast.error(body?.error?.message ?? "הסרת הסיסמה נכשלה");
      return;
    }

    toast.success(`הסיסמה הוסרה עבור ${user.email}`);
    onDone();
  };

  return (
    <form
      onSubmit={submit}
      className="mt-4 flex flex-wrap items-end gap-3 border-t border-border pt-4"
    >
      <div className="min-w-[220px] flex-1">
        <Field label="סיסמה חדשה" htmlFor={`password-${user.id}`}>
          <Input
            id={`password-${user.id}`}
            name="password"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            placeholder="לפחות 10 תווים, אות וספרה"
            required
          />
        </Field>
      </div>
      <Button type="submit" size="sm" loading={saving} className="mb-4">
        שמירה
      </Button>
      {user.hasPassword ? (
        <Button
          type="button"
          variant="quiet"
          size="sm"
          className="mb-4"
          onClick={removePassword}
        >
          הסרת סיסמה
        </Button>
      ) : null}
    </form>
  );
}
