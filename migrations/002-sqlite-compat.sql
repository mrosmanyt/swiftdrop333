-- SQLite-compatible date helpers, so the timestamp-as-text contract and the
-- existing queries keep working unchanged on PostgreSQL.
CREATE OR REPLACE FUNCTION datetime(t text) RETURNS text LANGUAGE sql STABLE AS $fn$
  SELECT to_char(
    CASE WHEN t = 'now' THEN (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') ELSE replace(t, 'T', ' ')::timestamp END,
    'YYYY-MM-DD HH24:MI:SS')
$fn$;
CREATE OR REPLACE FUNCTION datetime(t text, m text) RETURNS text LANGUAGE sql STABLE AS $fn$
  SELECT to_char(
    (CASE WHEN t = 'now' THEN (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') ELSE replace(t, 'T', ' ')::timestamp END) + m::interval,
    'YYYY-MM-DD HH24:MI:SS')
$fn$;
