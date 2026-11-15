import fs from 'node:fs';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
const db = new PGlite();
try {
 for (const f of fs.readdirSync('migrations').filter(f => /^\d{3}-.+\.sql$/.test(f)).sort()) await db.exec(fs.readFileSync('migrations/' + f, 'utf8'));
 const {rows} = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
 assert.equal(rows.length,34);
 await db.query("INSERT INTO users(id,email,password_hash,role) VALUES ($1,$2,$3,$4)",['test','schema-test@example.invalid','not-a-login','MERCHANT']);
 const result = await db.query("SELECT created_at,status FROM users WHERE id=$1",['test']);
 assert.match(result.rows[0].created_at,/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
 assert.equal(result.rows[0].status,'active');
 await assert.rejects(db.query("INSERT INTO users(id,email,password_hash,role) VALUES ('bad','bad@example.invalid','x','UNKNOWN')"));
 await assert.rejects(db.query("INSERT INTO merchant_profiles(id,user_id,business_name) VALUES ('bad','missing','test')"));
 console.log('PASS: PostgreSQL schema, table count, timestamp defaults, role constraint, foreign key enforcement');
} finally { await db.close(); }
