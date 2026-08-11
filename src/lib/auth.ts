import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "./prisma";
import { env } from "./env";
import { verifyPassword } from "./password";
import { rateLimit } from "./rate-limit";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// hash תקין-פורמט של ערך שאף אחד לא יודע — משתמשים בו כשאין
// passwordHash אמיתי, כדי ש-verify ירוץ באותו זמן גם אז ולא יסגיר
// (בטיימינג) אם המייל קיים ב-AdminUser או שהוא מנהל Google-בלבד.
const DUMMY_HASH =
  "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // מאחורי Nginx — בלי זה Auth.js לא מזהה נכון את ה-host
  trustHost: true,

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8, // 8 שעות
  },

  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },

  providers: [
    Google({
      clientId: env().GOOGLE_CLIENT_ID,
      clientSecret: env().GOOGLE_CLIENT_SECRET,
    }),

    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "אימייל", type: "email" },
        password: { label: "סיסמה", type: "password" },
      },

      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const normalized = email.toLowerCase().trim();

        // בלימת ניחוש סיסמאות ברמת החשבון
        const limit = rateLimit(`login:${normalized}`, 8, 15 * 60 * 1000);
        if (!limit.ok) return null;

        const user = await prisma.adminUser.findUnique({
          where: { email: normalized },
        });

        // מריצים verify גם כשאין משתמש/סיסמה כדי שזמן התגובה לא
        // יסגיר אם המייל קיים במערכת או שהוא מנהל Google-בלבד
        const valid = await verifyPassword(
          password,
          user?.passwordHash ?? DUMMY_HASH,
        );
        if (!user || !user.passwordHash || !valid) return null;

        await prisma.adminUser.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    /**
     * שער הכניסה היחיד ל-Google: אין הרשמה עצמאית. מייל שלא נמצא
     * מראש ב-AdminUser נדחה כאן, גם אם יש לו חשבון Google תקין —
     * NextAuth ינתב חזרה ל-/admin/login?error=AccessDenied.
     * כניסת credentials כבר עברה בדיקה מלאה ב-authorize() לעיל.
     */
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      if (!user.email) return false;

      const email = user.email.toLowerCase().trim();
      const admin = await prisma.adminUser.findUnique({ where: { email } });
      if (!admin) return false;

      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
      });

      return true;
    },

    async jwt({ token, user, account }) {
      // account קיים רק בכניסה הראשונה של הסשן — לא בכל רענון טוקן.
      if (account?.provider === "google" && user?.email) {
        // user שמגיע מ-Google לא מכיל את ה-id/role שלנו, לכן שולפים
        // מחדש מה-AdminUser (כבר אושר ב-signIn שהמייל קיים שם).
        const admin = await prisma.adminUser.findUnique({
          where: { email: user.email.toLowerCase().trim() },
        });
        if (admin) {
          token.uid = admin.id;
          token.role = admin.role;
        }
      } else if (account?.provider === "credentials" && user) {
        // authorize() כבר החזיר את ה-id/role הנכונים ישירות
        token.uid = user.id as string;
        token.role = (user as { role?: string }).role ?? "ADMIN";
      }
      return token;
    },

    session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});

/** שומר לשימוש במסלולי API — זורק תשובת 401 אם אין סשן מנהל */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

/** כמו requireAdmin, אבל רק ל-OWNER — ניהול מיילים מורשים */
export async function requireOwner() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "OWNER") return null;
  return session.user;
}
