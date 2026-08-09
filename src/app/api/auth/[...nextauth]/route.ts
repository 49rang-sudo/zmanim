import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;

// Auth.js משתמש ב-node:crypto ובגישה ל-Prisma — לא edge
export const runtime = "nodejs";
