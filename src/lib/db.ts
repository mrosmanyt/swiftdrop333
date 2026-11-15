import { AsyncLocalStorage } from "node:async_hooks";
import path from "node:path";
import { Pool, types } from "@neondatabase/serverless";
import { MIGRATIONS } from "@/lib/schema";

/**
 * PostgreSQL database access.
 *
 *  - Production / Vercel: Neon Postgres over `DATABASE_URL` (the Neon
 *    integration sets it). A serverless host has no writable disk, so a
 *    file database cannot work there — that was the "unable to open
 *    database file" failure behind every sign-up and sign-in.
 *  - Local development: PGlite, a real PostgreSQL engine that runs inside
 *    Node and keeps its files in ./data/pgdata. Nothing to install and no
 *    account needed; `npm run dev` just works. Set DATABASE_URL in
 *    .env.local to point local development at a hosted database instead.
 *
 * The schema lives in migrations/*.sql (compiled into src/lib/schema.ts) and
 * is applied automatically the first time a process touches the database.
 *
 * The `db.prepare(sql).get/all/run(...)` shape is kept from the original
 * SQLite layer so the queries read the same — but every call is async now
 * and must be awaited. `?` placeholders are rewritten to `$1, $2, …`.
 */

type Row = Record<string, any>;
type QueryResult = { rows: Row[]; rowCount: number };
interface Executor {
  query(sql: string, params: unknown[]): Promise<QueryResult>;
  exec(sql: string): Promise<void>;
}
interface Driver extends Executor {
  tx<T>(fn: (ex: Executor) => Promise<T>): Promise<T>;
}

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL_UNPOOLED || "";

// COUNT(*) / SUM() come back as int8 / numeric, which drivers hand over as
// strings by default. Every value in this app fits a JS number comfortably.
const INT8 = 20;
const NUMERIC = 1700;
const toNumber = (v: string) => Number(v);

// ---------------------------------------------------------------------------
// Drivers
// ---------------------------------------------------------------------------

function neonDriver(url: string): Driver {
  types.setTypeParser(INT8, toNumber);
  types.setTypeParser(NUMERIC, toNumber);
  const pool = new Pool({ connectionString: url, max: Number(process.env.DB_POOL_MAX ?? 5) });
  pool.on("error", (err: unknown) => console.error("[db] pool error", err));
  const wrap = (q: { query: (sql: string, params?: any[]) => Promise<any> }): Executor => ({
    async query(sql, params) {
      const r = await q.query(sql, params as any[]);
      return { rows: r.rows as Row[], rowCount: Number(r.rowCount ?? 0) };
    },
    async exec(sql) {
      await q.query(sql);
    },
  });
  // A serverless instance can be frozen between requests, and the database
  // may have dropped the idle socket by the time it thaws. A single query
  // that fails that way is safe to send again on a fresh connection.
  const dropped = (e: any) =>
    /Connection terminated|connection.*closed|ECONNRESET|EPIPE|socket hang up|WebSocket|not queryable/i.test(
      String(e?.message ?? e)
    ) && !e?.code?.match?.(/^[0-9A-Z]{5}$/);
  const pooled = wrap(pool);
  return {
    async query(sql, params) {
      try {
        return await pooled.query(sql, params);
      } catch (e) {
        if (!dropped(e)) throw e;
        return pooled.query(sql, params);
      }
    },
    exec: pooled.exec,
    async tx(fn) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const out = await fn(wrap(client));
        await client.query("COMMIT");
        return out;
      } catch (e) {
        await client.query("ROLLBACK").catch(() => {});
        throw e;
      } finally {
        client.release();
      }
    },
  };
}

async function pgliteDriver(dataDir: string | undefined): Promise<Driver> {
  // Loaded by name at runtime so the production bundle never includes it:
  // PGlite is a development dependency and is not used on Vercel.
  const moduleName = "@electric-sql/pglite";
  let mod: any;
  try {
    mod = await import(/* webpackIgnore: true */ moduleName);
  } catch (e) {
    throw new Error(
      "No DATABASE_URL is set and the local development database (@electric-sql/pglite) is not installed. " +
        "Set DATABASE_URL to a PostgreSQL connection string, or run `npm install` to get the dev dependencies."
    );
  }
  if (dataDir) (await import("node:fs")).mkdirSync(path.dirname(dataDir), { recursive: true });
  const pg = new mod.PGlite(dataDir, { parsers: { [INT8]: toNumber, [NUMERIC]: toNumber } });
  await pg.waitReady;
  const wrap = (q: any): Executor => ({
    async query(sql, params) {
      const r = await q.query(sql, params);
      return { rows: r.rows as Row[], rowCount: Number(r.affectedRows ?? 0) };
    },
    async exec(sql) {
      await q.exec(sql);
    },
  });
  return {
    ...wrap(pg),
    tx: (fn) => pg.transaction((t: any) => fn(wrap(t))),
  };
}

// ---------------------------------------------------------------------------
// Connection + schema bootstrap (once per process)
// ---------------------------------------------------------------------------

const globalForDb = globalThis as unknown as { __swiftdropPg?: Promise<Driver> };

/**
 * Demo seed accounts must never be usable in production.
 *
 * `npm run seed` creates accounts with the public password "password123" —
 * including admin@example.com with full ADMIN rights. On every production
 * boot they are suspended (auth.ts refuses non-active accounts), unless
 * someone explicitly opts in with ALLOW_DEMO_ACCOUNTS=true on a
 * staging/demo deployment.
 */
export const DEMO_ACCOUNT_EMAILS = [
  "merchant@example.com",
  "courier@example.com",
  "admin@example.com",
  "pending-merchant@example.com",
  "pending-courier@example.com",
];

async function migrate(driver: Driver) {
  const latest = MIGRATIONS[MIGRATIONS.length - 1].version;
  let current = -1;
  try {
    const r = await driver.query(`SELECT COALESCE(MAX(version), 0) AS v FROM schema_migrations`, []);
    current = Number(r.rows[0]?.v ?? 0);
  } catch (e: any) {
    // 42P01 = table does not exist yet: a brand-new database.
    if (e?.code !== "42P01" && !/schema_migrations/.test(String(e?.message ?? e))) throw e;
  }
  if (current >= latest) return;

  await driver.tx(async (tx) => {
    // Several serverless instances can cold-start at once; only one applies
    // the schema, the rest wait here and then find it already done.
    await tx.query(`SELECT pg_advisory_xact_lock(7331001)`, []);
    await tx.exec(
      `CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL)`
    );
    const r = await tx.query(`SELECT COALESCE(MAX(version), 0) AS v FROM schema_migrations`, []);
    const done = Number(r.rows[0]?.v ?? 0);
    for (const m of MIGRATIONS) {
      if (m.version <= done) continue;
      await tx.exec(m.sql);
      await tx.query(`INSERT INTO schema_migrations (version, name, applied_at) VALUES ($1, $2, $3)`, [
        m.version,
        m.name,
        new Date().toISOString(),
      ]);
      console.log(`[db] applied migration ${m.name}`);
    }
  });
}

async function connect(): Promise<Driver> {
  let driver: Driver;
  if (isBuildPhase) {
    // `next build` imports every route in parallel worker processes. None of
    // them should touch real data, so each gets a private throwaway database.
    driver = await pgliteDriver(undefined).catch((e) => {
      if (!connectionString) throw e;
      return neonDriver(connectionString);
    });
  } else if (connectionString) {
    driver = neonDriver(connectionString);
  } else if (process.env.VERCEL) {
    throw new Error(
      "DATABASE_URL is not set. Connect a Postgres database (Vercel → Storage → Neon) to this project and redeploy."
    );
  } else {
    driver = await pgliteDriver(process.env.PGLITE_DIR ?? path.join(process.cwd(), "data", "pgdata"));
  }

  await migrate(driver);

  if (!isBuildPhase && process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_ACCOUNTS !== "true") {
    const r = await driver.query(
      `UPDATE users SET status = 'suspended' WHERE email = ANY($1) AND status != 'suspended'`,
      [DEMO_ACCOUNT_EMAILS]
    );
    if (r.rowCount > 0) console.warn(`[security] Suspended ${r.rowCount} demo seed account(s) in production.`);
  }
  return driver;
}

function getDriver(): Promise<Driver> {
  if (!globalForDb.__swiftdropPg) {
    const p = connect();
    globalForDb.__swiftdropPg = p;
    // A failed connection must not be cached forever — let the next request retry.
    p.catch(() => {
      if (globalForDb.__swiftdropPg === p) globalForDb.__swiftdropPg = undefined;
    });
  }
  return globalForDb.__swiftdropPg;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const txStore = new AsyncLocalStorage<Executor>();

async function executor(): Promise<Executor> {
  return txStore.getStore() ?? (await getDriver());
}

/** Rewrites `?` placeholders to `$1, $2, …`, leaving quoted text and comments alone. */
const placeholderCache = new Map<string, string>();
function toPg(sql: string): string {
  const hit = placeholderCache.get(sql);
  if (hit !== undefined) return hit;
  let out = "";
  let n = 0;
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    if (c === "'" || c === '"') {
      let j = i + 1;
      while (j < sql.length && (sql[j] !== c || sql[j + 1] === c)) j += sql[j] === c ? 2 : 1;
      out += sql.slice(i, j + 1);
      i = j;
    } else if (c === "-" && sql[i + 1] === "-") {
      let j = sql.indexOf("\n", i);
      if (j === -1) j = sql.length;
      out += sql.slice(i, j);
      i = j - 1;
    } else if (c === "?") {
      out += `$${++n}`;
    } else {
      out += c;
    }
  }
  if (placeholderCache.size < 2000) placeholderCache.set(sql, out);
  return out;
}

const clean = (params: unknown[]) => params.map((p) => (p === undefined ? null : p));

export interface Statement {
  /** First row, or undefined when nothing matched. */
  get(...params: unknown[]): Promise<any>;
  /** Every row. */
  all(...params: unknown[]): Promise<any[]>;
  /** For INSERT / UPDATE / DELETE — `changes` is the number of rows affected. */
  run(...params: unknown[]): Promise<{ changes: number }>;
}

export const db = {
  prepare(sql: string): Statement {
    const text = toPg(sql);
    return {
      async get(...params) {
        return (await (await executor()).query(text, clean(params))).rows[0];
      },
      async all(...params) {
        return (await (await executor()).query(text, clean(params))).rows;
      },
      async run(...params) {
        return { changes: (await (await executor()).query(text, clean(params))).rowCount };
      },
    };
  },

  /** Runs one or more statements with no parameters. */
  async exec(sql: string): Promise<void> {
    await (await executor()).exec(sql);
  },

  /**
   * Runs `fn` inside a transaction: everything it does through `db` commits
   * together, or rolls back if it throws.
   */
  async tx<T>(fn: () => Promise<T>): Promise<T> {
    if (txStore.getStore()) return fn();
    const driver = await getDriver();
    return driver.tx((ex) => txStore.run(ex, fn));
  },
};
