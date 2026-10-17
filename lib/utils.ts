/** Joins class names, skipping falsy values. */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * "2026-10-06T…" -> "6 Oct 2026" (or "6 October 2026" with month = "long").
 * Built by hand in UTC so server and client always render identical text.
 */
export function formatDate(iso: string | null | undefined, month: "short" | "long" = "short") {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const monthName = MONTH_NAMES[date.getUTCMonth()];
  return `${date.getUTCDate()} ${month === "short" ? monthName.slice(0, 3) : monthName} ${date.getUTCFullYear()}`;
}
