import moment from 'moment';

/**
 * Parses a plain 'YYYY-MM-DD' calendar date (no time/timezone) into a local
 * midnight Date object, without ever going through `new Date(string)` —
 * which the JS spec parses as UTC for date-only ISO strings, silently
 * shifting the displayed day back by one for any timezone behind UTC.
 * Use this (not `new Date(...)`) for `session_dates.date` and anywhere else
 * a value is a pure calendar date, not an instant.
 */
export function parseDateOnly(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

/** Formats a plain calendar date string safely — see {@link parseDateOnly}. */
export function formatDateOnly(value: string | Date | null | undefined, format = 'YYYY-MM-DD') {
  const date = parseDateOnly(value);
  return date ? moment(date).format(format) : '';
}

/** Expands a start/end date range (inclusive) into every 'YYYY-MM-DD' date string in it. */
export function expandDateRange(start: string | Date, end: string | Date): string[] {
  const dates: string[] = [];
  let current = moment(start).startOf('day');
  const last = moment(end).startOf('day');

  while (current.isSameOrBefore(last, 'day')) {
    dates.push(current.format('YYYY-MM-DD'));
    current = current.add(1, 'day');
  }

  return dates;
}

/** Formats a session date range without hiding a changed month or year. */
export function formatSessionDateRange(startDate?: string | Date | null, endDate?: string | Date | null) {
  const start = moment(startDate);
  const end = moment(endDate || startDate);

  if (!start.isValid() || !end.isValid()) return '';
  if (start.isSame(end, 'day')) return start.format('MMM DD, YYYY');

  if (start.isSame(end, 'month')) {
    return `${start.format('MMM DD')}–${end.format('DD, YYYY')}`;
  }

  if (start.isSame(end, 'year')) {
    return `${start.format('MMM DD')} – ${end.format('MMM DD, YYYY')}`;
  }

  return `${start.format('MMM DD, YYYY')} – ${end.format('MMM DD, YYYY')}`;
}
