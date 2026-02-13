
-- Allow public read for non-sensitive settings only
CREATE POLICY "Public can read non-sensitive settings"
  ON public.settings
  FOR SELECT
  USING (
    key NOT IN (
      'telegram_bot_token',
      'telegram_chat_id', 
      'ccp_number',
      'ccp_key',
      'flexy_number',
      'baridimob_rip'
    )
  );
