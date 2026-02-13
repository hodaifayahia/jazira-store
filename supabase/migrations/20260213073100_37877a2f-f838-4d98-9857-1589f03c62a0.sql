
-- Fix: Update RLS policy to only block telegram secrets, allow payment keys
DROP POLICY IF EXISTS "Public can read non-sensitive settings" ON public.settings;

CREATE POLICY "Public can read non-sensitive settings"
ON public.settings
FOR SELECT
USING (key <> ALL (ARRAY['telegram_bot_token'::text, 'telegram_chat_id'::text]));
