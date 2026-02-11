
-- Add 'confirmer' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'confirmer';

-- Alter confirmers table: add email, user_id, payment_mode, monthly_salary
ALTER TABLE public.confirmers
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS payment_mode TEXT NOT NULL DEFAULT 'per_order',
  ADD COLUMN IF NOT EXISTS monthly_salary NUMERIC DEFAULT 0;

-- Create confirmation_settings table (single-row global config)
CREATE TABLE IF NOT EXISTS public.confirmation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_mode TEXT NOT NULL DEFAULT 'manual',
  auto_timeout_minutes INTEGER NOT NULL DEFAULT 30,
  max_call_attempts INTEGER NOT NULL DEFAULT 3,
  enable_confirm_chat BOOLEAN NOT NULL DEFAULT false,
  working_hours_start TEXT NOT NULL DEFAULT '08:00',
  working_hours_end TEXT NOT NULL DEFAULT '20:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.confirmation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage confirmation_settings"
  ON public.confirmation_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
