# Supabase migration (old project -> new project)

This runbook migrates schema and data from your old Supabase project to the new one.

## 0) Security first

Because keys were shared in chat/logs:

1. Rotate (regenerate) the leaked **secret/service role** key in Supabase Dashboard.
2. Keep only `VITE_SUPABASE_PUBLISHABLE_KEY` in frontend `.env`.
3. Put secret keys only in backend runtime secrets (Edge Functions, CI, server).

## 1) Prerequisites

- Supabase CLI installed
- `psql` installed (Postgres client)
- Logged in: `supabase login`

## 2) Set project refs and DB URLs

In your shell, set these variables (replace placeholders with your real passwords):

```bash
OLD_REF="scqduiwnqbznmygmfcnc"
NEW_REF="nzjcbpkxkyqggckkpdjs"

OLD_DB_URL="postgresql://postgres:<OLD_DB_PASSWORD>@db.${OLD_REF}.supabase.co:5432/postgres?sslmode=require"
NEW_DB_URL="postgresql://postgres:<NEW_DB_PASSWORD>@db.${NEW_REF}.supabase.co:5432/postgres?sslmode=require"
```

## 3) Export schema from old project

```bash
pg_dump --schema-only --no-owner --no-privileges "$OLD_DB_URL" > schema.sql
```

## 4) Export data from old project

```bash
pg_dump --data-only --inserts --column-inserts --no-owner --no-privileges "$OLD_DB_URL" > data.sql
```

## 5) Import into new project

```bash
psql "$NEW_DB_URL" -f schema.sql
psql "$NEW_DB_URL" -f data.sql
```

## 6) Reset sequences (important)

After import, run this on the new DB:

```sql
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      c.relname AS table_name,
      a.attname AS column_name,
      pg_get_serial_sequence(format('%I.%I', n.nspname, c.relname), a.attname) AS seq_name,
      n.nspname AS schema_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid
    WHERE c.relkind = 'r'
      AND a.attnum > 0
      AND NOT a.attisdropped
      AND pg_get_serial_sequence(format('%I.%I', n.nspname, c.relname), a.attname) IS NOT NULL
      AND n.nspname = 'public'
  LOOP
    EXECUTE format(
      'SELECT setval(%L, COALESCE((SELECT MAX(%I) FROM %I.%I), 0) + 1, false);',
      r.seq_name,
      r.column_name,
      r.schema_name,
      r.table_name
    );
  END LOOP;
END $$;
```

## 7) Migrate storage buckets/files (if used)

Use one of:

- Supabase Dashboard export/import for storage
- Script with Storage API to copy objects bucket-by-bucket

## 8) Reconfigure and deploy this repo to new project

```bash
supabase link --project-ref nzjcbpkxkyqggckkpdjs
supabase db push
supabase functions deploy
```

## 9) Verify app

- Login/signup works
- Admin pages load
- Orders/products/suppliers data matches old project
- Edge Functions run and have required secrets configured in new project

## 10) Import Matsy Academy dataset to new DB

This repository includes a ready migration that inserts:

- Academy courses into `products`
- Testimonials into `reviews`
- Core text/settings into `settings`

Migration file:

- `supabase/migrations/20260321133000_seed_matsy_academy_content.sql`

Run it by pushing migrations to the linked new project:

```bash
supabase link --project-ref nzjcbpkxkyqggckkpdjs
supabase db push
```

If you only want this one seed SQL (without pushing all pending migrations), run directly:

```bash
psql "$NEW_DB_URL" -f supabase/migrations/20260321133000_seed_matsy_academy_content.sql
```

Then verify in SQL editor:

```sql
select slug, name, price, is_active from public.products where slug like 'matsy-%' order by slug;
select reviewer_name, rating from public.reviews where reviewer_name in ('آية بن سالم','محمد الأمين','خديجة موساوي');
select key, value from public.settings where key in ('academy_hero_title_ar','academy_hero_subtitle_ar','academy_whatsapp');
```
