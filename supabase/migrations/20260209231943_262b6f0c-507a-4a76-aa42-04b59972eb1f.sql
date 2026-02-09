
CREATE TABLE public.telegram_bot_state (
  chat_id text PRIMARY KEY,
  state jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE telegram_bot_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON telegram_bot_state
  FOR ALL USING (false);
