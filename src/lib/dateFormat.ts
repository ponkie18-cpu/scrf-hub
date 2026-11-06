/**
 * South African date formatting utilities.
 * SA convention: DD/MM/YYYY (e.g. 04/05/2025 = 4 May 2025)
 */

const SA_LOCALE = "en-ZA";

/** Format a date as DD/MM/YYYY */
export function formatDateSA(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(SA_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Format as "4 May 2025" (long form) */
export function formatDateLongSA(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(SA_LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Format as "4 May" (short, no year) */
export function formatDateShortSA(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(SA_LOCALE, {
    day: "numeric",
    month: "short",
  });
}

/** Format time as HH:MM (24h) */
export function formatTimeSA(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
