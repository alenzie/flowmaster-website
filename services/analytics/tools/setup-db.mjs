import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash, randomBytes } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

process.loadEnvFile('.env.local');
const sql = neon(process.env.DATABASE_URL);
const source = await readFile(new URL('../migrations/001_initial.sql', import.meta.url), 'utf8');
const checksum = createHash('sha256').update(source).digest('hex');
const existing = await sql`SELECT to_regclass('analytics.schema_migrations') AS registry`;
if (!existing[0].registry) {
  const statements = source.split('-- statement-break').map(s => s.trim()).filter(Boolean);
  await sql.transaction([
    ...statements.map(statement => sql.query(statement)),
    sql`CREATE TABLE analytics.schema_migrations(version text PRIMARY KEY, checksum text NOT NULL)`,
    sql`INSERT INTO analytics.schema_migrations VALUES('001',${checksum})`
  ]);
  console.log('Applied analytics migration 001.');
} else {
  const versions = await sql`SELECT checksum FROM analytics.schema_migrations WHERE version='001'`;
  if (versions[0]?.checksum !== checksum) throw new Error('Migration checksum differs; do not silently reapply it.');
  console.log('Migration 001 already applied; checksum verified.');
}

let rolesFileExists = false;
try { await access('.env.roles.local'); rolesFileExists = true; } catch { /* first setup */ }
if (rolesFileExists) {
  console.log('Existing role credentials preserved.');
  process.exit(0);
}
const roles = { WEB_DATABASE_URL: 'alenzie_web_ingest', APP_DATABASE_URL: 'alenzie_app_ingest', REPORT_DATABASE_URL: 'alenzie_report', MAINTENANCE_DATABASE_URL: 'alenzie_maintenance' };
const statements = [], env = {};
for (const [variable, role] of Object.entries(roles)) {
  const password = randomBytes(32).toString('hex');
  // Role identifiers are fixed constants; passwords contain only generated hex.
  statements.push(`CREATE ROLE ${role} LOGIN PASSWORD '${password}'`, `ALTER ROLE ${role} SET statement_timeout='8s'`, `ALTER ROLE ${role} SET lock_timeout='3s'`, `GRANT USAGE ON SCHEMA analytics TO ${role}`);
  const url = new URL(process.env.DATABASE_URL); url.username = role; url.password = password;
  env[variable] = url.toString();
}
statements.push(
  'GRANT EXECUTE ON FUNCTION analytics.collect_web(uuid,text,text,text,text,text,text,text,text) TO alenzie_web_ingest',
  'GRANT INSERT,SELECT ON analytics.app_events TO alenzie_app_ingest',
  'CREATE POLICY app_insert ON analytics.app_events FOR INSERT TO alenzie_app_ingest WITH CHECK (true)',
  'CREATE POLICY app_deduplicate ON analytics.app_events FOR SELECT TO alenzie_app_ingest USING (true)',
  'GRANT SELECT ON analytics.web_events,analytics.web_daily,analytics.app_events TO alenzie_report',
  'CREATE POLICY report_web ON analytics.web_events FOR SELECT TO alenzie_report USING (true)',
  'CREATE POLICY report_daily ON analytics.web_daily FOR SELECT TO alenzie_report USING (true)',
  'CREATE POLICY report_app ON analytics.app_events FOR SELECT TO alenzie_report USING (true)',
  'GRANT EXECUTE ON FUNCTION analytics.retain_web() TO alenzie_maintenance'
);
// Save recoverable credentials before creating roles, without ever printing them.
for (const key of ['APP_INGEST_SECRET','APP_REPORT_SECRET','RATE_HASH_SECRET','CRON_SECRET']) env[key] = randomBytes(32).toString('hex');
const serialized = Object.entries(env).map(([key,value]) => `${key}=${JSON.stringify(value)}`).join('\n') + '\n';
await writeFile('.env.roles.pending.local', serialized, { mode: 0o600, flag: 'wx' });
await sql.transaction(statements.map(statement => sql.query(statement)));
await writeFile('.env.roles.local', serialized, { mode: 0o600, flag: 'wx' });
console.log('Created four restricted database roles; credentials saved in ignored local files.');
