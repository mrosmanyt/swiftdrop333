# Database migrations

The app runs on PostgreSQL: Neon in production (`DATABASE_URL`), embedded
PGlite in local development (`./data/pgdata`).

- `001-postgres.sql` — the full schema (34 tables, 25 indexes). Timestamps
  are stored as text and flags as integers, on purpose, to keep the
  application contract that the original SQLite version had.
- `002-sqlite-compat.sql` — `datetime()` helper functions so existing
  queries keep their meaning on PostgreSQL.

`npm run build:schema` compiles these files into `src/lib/schema.ts`.
`src/lib/db.ts` applies any that are missing, in order, the first time a
process connects, and records them in the `schema_migrations` table (under an
advisory lock, so parallel cold starts don't collide).

To change the schema: add `003-something.sql`, run `npm run build:schema`,
commit both. Never edit a migration that has already been applied to a live
database.

Check: `node scripts/validate-postgres-schema.mjs`

`legacy-sqlite-export/` holds the one-time tools and snapshot that were used
to derive `001-postgres.sql` from the old SQLite schema. They are not used
by the app any more.
