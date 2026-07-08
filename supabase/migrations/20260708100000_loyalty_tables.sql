-- ============================================================================
-- MOMENTO — Loyalty Tables
-- ============================================================================

-- Loyalty points table
CREATE TABLE IF NOT EXISTS loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'vip')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Loyalty history table
CREATE TABLE IF NOT EXISTS loyalty_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired', 'bonus')),
  description TEXT,
  booking_id UUID REFERENCES bookings(id),
  experience_id UUID REFERENCES experiences(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_loyalty_points_user ON loyalty_points(user_id);
CREATE INDEX idx_loyalty_history_user ON loyalty_history(user_id);
CREATE INDEX idx_loyalty_history_created ON loyalty_history(created_at DESC);

-- RLS
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "loyalty_points_select_own" ON loyalty_points
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "loyalty_points_insert_own" ON loyalty_points
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "loyalty_points_update_own" ON loyalty_points
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "loyalty_history_select_own" ON loyalty_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "loyalty_history_insert_admin" ON loyalty_history
  FOR INSERT WITH CHECK (public.is_admin());

-- Seed: Auto-create loyalty points on user signup via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_loyalty()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.loyalty_points (user_id, balance, lifetime_points, tier)
  VALUES (NEW.id, 100, 100, 'bronze')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on profiles insert
CREATE OR REPLACE TRIGGER on_profile_created_loyalty
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_loyalty();
