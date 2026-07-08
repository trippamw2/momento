-- ============================================================================
-- MOMENTO — Loyalty Tables (idempotent, compatible with existing schema)
-- ============================================================================
-- Note: loyalty_points + loyalty_transactions already exist from
-- 20260624140000_loyalty_triggers.sql AND loyalty_history exists as a VIEW.
-- This migration:
--   1. Drops VIEW loyalty_history, creates TABLE instead
--   2. Migrates existing loyalty_transactions into loyalty_history
--   3. Adds RLS to loyalty_transactions + loyalty_history
--   4. Updates the existing handle_new_user() signup trigger to seed 100 pts
-- ============================================================================

-- 1. LOYALTY HISTORY TABLE (replaces existing VIEW)
DROP VIEW IF EXISTS public.loyalty_history CASCADE;

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

CREATE INDEX IF NOT EXISTS idx_loyalty_history_user ON loyalty_history(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_history_created ON loyalty_history(created_at DESC);

-- 2. MIGRATE existing loyalty_transactions into loyalty_history
INSERT INTO loyalty_history (user_id, points, type, description, created_at)
SELECT
  lt.user_id, lt.points,
  CASE lt.type
    WHEN 'earn'   THEN 'earned'
    WHEN 'redeem' THEN 'redeemed'
    WHEN 'bonus'  THEN 'bonus'
    WHEN 'expire' THEN 'expired'
    ELSE 'earned'
  END,
  COALESCE(lt.description, 'Migrated from loyalty_transactions'),
  lt.created_at
FROM loyalty_transactions lt
WHERE NOT EXISTS (
  SELECT 1 FROM loyalty_history lh
  WHERE lh.user_id = lt.user_id AND lh.points = lt.points AND lh.created_at = lt.created_at
)
ON CONFLICT DO NOTHING;

-- 3. RLS for loyalty_history
ALTER TABLE loyalty_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'loyalty_history_select_own' AND tablename = 'loyalty_history') THEN
    CREATE POLICY "loyalty_history_select_own" ON loyalty_history FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'loyalty_history_insert_admin' AND tablename = 'loyalty_history') THEN
    CREATE POLICY "loyalty_history_insert_admin" ON loyalty_history FOR INSERT WITH CHECK (public.is_admin());
  END IF;
END $$;

-- 4. Enable RLS on loyalty_transactions (was missing from prev migration)
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'loyalty_transactions_select_own' AND tablename = 'loyalty_transactions') THEN
    CREATE POLICY "loyalty_transactions_select_own" ON loyalty_transactions FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'loyalty_transactions_insert_system' AND tablename = 'loyalty_transactions') THEN
    CREATE POLICY "loyalty_transactions_insert_system" ON loyalty_transactions FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- 5. Add missing columns to loyalty_points
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loyalty_points' AND column_name = 'created_at') THEN
    ALTER TABLE loyalty_points ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- 6. UPDATE the existing signup trigger to seed 100 bonus points
--    (Existing handle_new_user() function inserts loyalty_points with 0.
--     We replace it to also insert loyalty_history and grant 100 bonus.)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', COALESCE(NEW.raw_user_meta_data->>'role', 'user'));

  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id);

  INSERT INTO public.loyalty_points (user_id, balance, lifetime_points, tier)
  VALUES (NEW.id, 100, 100, 'bronze')
  ON CONFLICT (user_id) DO UPDATE SET
    balance = GREATEST(loyalty_points.balance, 100),
    lifetime_points = GREATEST(loyalty_points.lifetime_points, 100);

  INSERT INTO public.loyalty_history (user_id, points, type, description)
  VALUES (NEW.id, 100, 'bonus', 'Welcome bonus — 100 points')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
