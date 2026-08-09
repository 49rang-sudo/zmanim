import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// קובץ זה נטען גם בלקוח — אסור להכניס לכאן ייבוא של node:*

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * כסף נשמר באגורות (מספר שלם) ומוצג בשקלים.
 * לעולם לא לחשב כסף ב-Float.
 */
export function formatPrice(agorot: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: agorot % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(agorot / 100);
}

export function formatDateTime(value: Date | string): string {
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} ב׳`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} ק״ב`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} מ״ב`;
}

export function formatCm(width: number, height: number): string {
  const n = (v: number) => (Number.isInteger(v) ? v.toString() : v.toFixed(1));
  return `${n(width)} × ${n(height)} ס״מ`;
}

export function slugify(input: string): string {
  return input
    .trim()
    .replace(/["'׳״]/g, "")
    .replace(/[\s/\\]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}
