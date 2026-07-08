-- ============================================================================
-- MOMENTO — Payouts + Configurable Commission Settings
-- ============================================================================

-- 1. PLATFORM SETTINGS (configurable commission rate)
CREATE TABLE platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default platform commission (10%)
INSERT INTO platform_settings (key, value, description) VALUES
  ('platform_commission_percent', '10', 'Platform commission percentage deducted from each booking'),
  ('min_payout_amount', '5000', 'Minimum amount (MK) before a partner can request a payout'),
  ('payout_schedule', '"weekly"', 'Payout frequency: weekly, biweekly, monthly'),
  ('auto_approve_payouts', 'false', 'Whether payouts are auto-approved or require admin review');

-- 2. PAYOUTS TABLE
CREATE TYPE payout_status AS ENUM ('pending', 'approved', 'processing', 'completed', 'rejected');

CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'MWK',
  status payout_status DEFAULT 'pending',
  payout_method TEXT,
  payout_details JSONB DEFAULT '{}'::jsonb,
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  reference TEXT,
  notes TEXT,
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payouts_partner ON payouts(partner_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_payouts_created ON payouts(created_at DESC);

-- 3. PARTNER EARNINGS (aggregated view per partner)
CREATE TABLE partner_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),
  experience_id UUID REFERENCES experiences(id),
  gross_amount INTEGER NOT NULL,
  commission_percent NUMERIC(3,2) NOT NULL DEFAULT 0.10,
  commission_amount INTEGER NOT NULL,
  net_amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'withdrawn')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_partner_earnings_partner ON partner_earnings(partner_id);
CREATE INDEX idx_partner_earnings_status ON partner_earnings(status);
CREATE INDEX idx_partner_earnings_booking ON partner_earnings(booking_id);

-- 4. Add onboarding_step to track progress
ALTER TABLE partner_profiles ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
ALTER TABLE partner_profiles ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE partner_profiles ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
ALTER TABLE partner_profiles ADD COLUMN IF NOT EXISTS bank_account_name TEXT;
ALTER TABLE partner_profiles ADD COLUMN IF NOT EXISTS id_document_url TEXT;
ALTER TABLE partner_profiles ADD COLUMN IF NOT EXISTS id_document_type TEXT;

-- 5. RLS Policies
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_earnings ENABLE ROW LEVEL SECURITY;

-- Platform settings: admin only
CREATE POLICY "platform_settings_select_admin" ON platform_settings
  FOR SELECT USING (public.is_admin());

CREATE POLICY "platform_settings_update_admin" ON platform_settings
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "platform_settings_insert_admin" ON platform_settings
  FOR INSERT WITH CHECK (public.is_admin());

-- Payouts: partner can see own, admin can see all
CREATE POLICY "payouts_select_own_or_admin" ON payouts
  FOR SELECT USING (
    partner_id IN (SELECT id FROM partner_profiles WHERE user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "payouts_insert_partner" ON payouts
  FOR INSERT WITH CHECK (
    partner_id IN (SELECT id FROM partner_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "payouts_update_admin" ON payouts
  FOR UPDATE USING (public.is_admin());

-- Partner earnings: partner can see own, admin can see all
CREATE POLICY "partner_earnings_select_own_or_admin" ON partner_earnings
  FOR SELECT USING (
    partner_id IN (SELECT id FROM partner_profiles WHERE user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "partner_earnings_insert_admin" ON partner_earnings
  FOR INSERT WITH CHECK (public.is_admin());
