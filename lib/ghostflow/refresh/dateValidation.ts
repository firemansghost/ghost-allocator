/**
 * Shared pure date/timestamp validators for GhostFlow refresh.
 * No I/O, clocks, or side effects.
 */

const ISO_DATE_SHAPE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_TIMESTAMP_SHAPE_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

/** Pure calendar-date check: YYYY-MM-DD shape and real UTC calendar day. */
export function isValidCalendarDate(value: string): boolean {
  if (!ISO_DATE_SHAPE_RE.test(value)) return false;
  const [ys, ms, ds] = value.split('-');
  const year = Number(ys);
  const month = Number(ms);
  const day = Number(ds);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  );
}

/** Pure ISO timestamp check: expected shape, real calendar date, and finite Date.parse. */
export function isValidIsoTimestamp(value: string): boolean {
  if (!ISO_TIMESTAMP_SHAPE_RE.test(value)) return false;
  if (!isValidCalendarDate(value.slice(0, 10))) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}
