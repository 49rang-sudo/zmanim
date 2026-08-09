import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "כניסה לניהול" };

export default async function AdminLoginPage() {
  const session = await auth();
  if (session?.user) redirect("/admin");

  return (
    <main className="mesh-glow grid min-h-dvh place-items-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <h1 className="font-display text-3xl font-bold text-ink">
            ניהול הלוח
          </h1>
          <p className="mt-1.5 text-sm text-ink-2">
            הכניסה מיועדת לצוות בלבד
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
