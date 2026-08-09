import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";
export const metadata = { title: "לוח ניהול" };

export default async function AdminPage() {
  const session = await auth();

  // שומר בצד השרת — לא מסתמכים על הסתרה בצד הלקוח
  if (!session?.user) redirect("/admin/login");

  return (
    <AdminShell
      userName={session.user.name ?? session.user.email ?? "מנהל"}
    />
  );
}
