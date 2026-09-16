import moment from 'moment';

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
