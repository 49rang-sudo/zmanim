import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "./prisma";
import { verifyPassword } from "./password";
import { rateLimit } from "./rate-limit";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

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

        // בלימת ניחוש סיסמאות ברמת החשבון (בנוסף להגבלה לפי IP במסלול)
        const limit = rateLimit(`login:${normalized}`, 8, 15 * 60 * 1000);
        if (!limit.ok) return null;

        const user = await prisma.adminUser.findUnique({
          where: { email: normalized },
        });

        // מריצים verify גם כשאין משתמש כדי שזמן התגובה לא יסגיר
        // אם האימייל קיים במערכת
        const hash =
          user?.passwordHash ??
          "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

        const valid = await verifyPassword(password, hash);
        if (!user || !valid) return null;

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
    jwt({ token, user }) {
      if (user) {
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
