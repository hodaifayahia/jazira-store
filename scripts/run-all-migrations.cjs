const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const projectRef = process.env.VITE_SUPABASE_PROJECT_ID || fs.readFileSync('supabase/.temp/project-ref', 'utf8').trim();
const pooler = fs.readFileSync('supabase/.temp/pooler-url', 'utf8').trim();
const password = process.env.SUPABASE_DB_PASSWORD;

if (!password) {
  console.error('Missing SUPABASE_DB_PASSWORD');
  process.exit(1);
}

const host = pooler.split('@')[1].split('/')[0];
const dbUser = `postgres.${projectRef}`;
const connectionString = `postgresql://${dbUser}:${encodeURIComponent(password)}@${host}/postgres`;

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

function extractVersion(fileName) {
  const idx = fileName.indexOf('_');
  if (idx === -1) return fileName.replace(/\.sql$/i, '');
  return fileName.slice(0, idx);
}

function isBenignAlreadyAppliedError(message) {
  const lowered = String(message || '').toLowerCase();
  return (
    lowered.includes('already exists') ||
    lowered.includes('duplicate key value violates unique constraint') ||
    lowered.includes('must be owner of')
  );
}

(async () => {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    await client.query('CREATE SCHEMA IF NOT EXISTS supabase_migrations');
    await client.query(`
      CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
        version text PRIMARY KEY
      )
    `);

    await client.query(`
      CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, role_name public.app_role)
      RETURNS boolean AS $$
      DECLARE
        role_count int;
      BEGIN
        SELECT count(*)
        INTO role_count
        FROM public.user_roles
        WHERE user_roles.user_id = has_role.user_id
          AND user_roles.role = has_role.role_name;

        RETURN role_count > 0;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
    `);

    const appliedResult = await client.query('SELECT version FROM supabase_migrations.schema_migrations');
    const applied = new Set(appliedResult.rows.map((row) => String(row.version)));

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.toLowerCase().endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    let appliedNow = 0;
    let skipped = 0;

    for (const file of files) {
      const version = extractVersion(file);
      if (applied.has(version)) {
        skipped += 1;
        continue;
      }

      const fullPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(fullPath, 'utf8');

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO supabase_migrations.schema_migrations(version) VALUES ($1)', [version]);
        await client.query('COMMIT');
        appliedNow += 1;
        console.log(`APPLIED:${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        if (isBenignAlreadyAppliedError(error.message)) {
          await client.query(
            'INSERT INTO supabase_migrations.schema_migrations(version) VALUES ($1) ON CONFLICT (version) DO NOTHING',
            [version]
          );
          skipped += 1;
          console.log(`SKIPPED_AS_APPLIED:${file}`);
          continue;
        }

        console.error(`FAILED:${file}`);
        console.error(`ERROR:${error.message}`);
        process.exit(1);
      }
    }

    const tableCountResult = await client.query(`
      SELECT count(*)::int AS count
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);

    console.log(`DONE:applied=${appliedNow};skipped=${skipped};public_tables=${tableCountResult.rows[0].count}`);
  } finally {
    await client.end();
  }
})().catch((error) => {
  console.error(`MIGRATION_RUNNER_ERROR:${error.message}`);
  process.exit(1);
});
