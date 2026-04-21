const fs = require('fs');
const { Client } = require('pg');

const pooler = fs.readFileSync('supabase/.temp/pooler-url', 'utf8').trim();
const projectRef = process.env.VITE_SUPABASE_PROJECT_ID || fs.readFileSync('supabase/.temp/project-ref', 'utf8').trim();
const password = process.env.SUPABASE_DB_PASSWORD;
const adminEmail = process.env.ADMIN_EMAIL || 'admin@solutionshub.com';

if (!password) {
  console.error('Missing SUPABASE_DB_PASSWORD');
  process.exit(1);
}

const host = pooler.split('@')[1].split('/')[0];
const dbUser = `postgres.${projectRef}`;
const connectionString = `postgresql://${dbUser}:${encodeURIComponent(password)}@${host}/postgres`;

const sql = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'app_role' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user'::public.app_role,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_roles'
      AND policyname = 'Users can read own roles'
  ) THEN
    CREATE POLICY "Users can read own roles" ON public.user_roles
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END
$$;

DROP FUNCTION IF EXISTS public.has_role(uuid, text);
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean AS $$
DECLARE
  role_count int;
BEGIN
  SELECT count(*)
  INTO role_count
  FROM public.user_roles
  WHERE user_roles.user_id = has_role._user_id
    AND user_roles.role = has_role._role::public.app_role;

  RETURN role_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
`;

(async () => {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    await client.query(sql);

    const insertResult = await client.query(
      `INSERT INTO public.user_roles (user_id, role)
       SELECT id, 'admin'::public.app_role
       FROM auth.users
       WHERE lower(email) = lower($1)
       ON CONFLICT (user_id, role) DO NOTHING
       RETURNING user_id, role`,
      [adminEmail]
    );

    const checkResult = await client.query(
      `SELECT u.id, u.email,
              EXISTS (
                SELECT 1 FROM public.user_roles r
                WHERE r.user_id = u.id AND r.role = 'admin'::public.app_role
              ) AS is_admin
       FROM auth.users u
       WHERE lower(u.email) = lower($1)
       LIMIT 1`,
      [adminEmail]
    );

    console.log('MIGRATION_OK');
    console.log(`ROLE_ROWS_INSERTED:${insertResult.rowCount}`);
    console.log(`CHECK:${JSON.stringify(checkResult.rows[0] || null)}`);
  } finally {
    await client.end();
  }
})().catch((error) => {
  console.error(`MIGRATION_FAIL:${error.message}`);
  process.exit(1);
});
