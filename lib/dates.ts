const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real calendar date in YYYY-MM-DD form. */
export function isValidDateString(value: string) {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

/** Today's date in the runtime's local timezone. In the browser, that's the user's timezone. */
export function localDateString(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * The latest date that could be "today" for anyone, using the furthest-ahead
 * timezone (UTC+14). The server can't trust the browser's timezone, so it uses
 * this as its limit for future dates.
 */
export function latestPossibleToday(now = new Date()) {
  const fourteenHours = 14 * 60 * 60 * 1000;
  return new Date(now.getTime() + fourteenHours).toISOString().slice(0, 10);
}

/** The earliest date that could be "today" for anyone, using the furthest-behind timezone (UTC-12). */
function earliestPossibleToday(now = new Date()) {
  const twelveHours = 12 * 60 * 60 * 1000;
  return new Date(now.getTime() - twelveHours).toISOString().slice(0, 10);
}

/** Uses the date sent by the browser if it could be today somewhere. Otherwise falls back to today in UTC. */
export function resolveToday(value: unknown, now = new Date()) {
  if (
    typeof value === "string" &&
    isValidDateString(value) &&
    value >= earliestPossibleToday(now) &&
    value <= latestPossibleToday(now)
  ) {
    return value;
  }
  return now.toISOString().slice(0, 10);
}

/**
 * The applied date after a status change. An empty date becomes today when moving
 * to "applied", or from "saved" to "interview" or "offer". Moving from "saved" to
 * "rejected" keeps it empty, because that application was never sent.
 */
export function appliedDateAfterStatusChange(
  change: { from: string; to: string; appliedAt: string | null },
  today: string,
) {
  const { from, to, appliedAt } = change;
  if (appliedAt || from === to) {
    return appliedAt;
  }
  const wasSent =
    to === "applied" || (from === "saved" && (to === "interview" || to === "offer"));
  return wasSent ? today : appliedAt;
}
