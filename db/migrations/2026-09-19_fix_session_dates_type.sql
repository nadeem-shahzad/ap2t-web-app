-- session_dates.date was created as DATE in the original migration, but the
-- live column ended up as TIMESTAMPTZ (root cause unclear — possibly a Neon
-- console edit outside this repo). A TIMESTAMPTZ round-tripped through JSON
-- serialization carries a "T00:00:00+00:00" instant, which every frontend
-- moment(new Date(...)) call then re-interprets in the browser's local
-- timezone — shifting the displayed/submitted date back a day for any user
-- west of UTC (i.e. all of the US). Restoring the true DATE type removes the
-- instant/offset entirely; a DATE has no timezone component to misread.
-- Lossless: every value in this column was always inserted as a bare
-- 'YYYY-MM-DD' string, so it only ever held midnight-UTC timestamps.

ALTER TABLE session_dates
  ALTER COLUMN date TYPE DATE USING date::date;
