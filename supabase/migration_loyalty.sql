-- ============================================================================
-- MOMENTO — Migration: Loyalty Program + Missing Functions + Triggers
-- ============================================================================

-- 1. LOYALTY POINTS TABLE
CREATE TABLE IF NOT EXISTS loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'bronze',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_points_user ON loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_tier ON loyalty_points(tier);

-- 2. LOYALTY TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'bonus', 'expire', 'adjustment')),
  points INTEGER NOT NULL,
  description TEXT,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created ON loyalty_transactions(created_at DESC);

-- 3. AUTO-CREATE PROFILE TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', COALESCE(NEW.raw_user_meta_data->>'role', 'user'));
  
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.loyalty_points (user_id, balance, lifetime_points, tier)
  VALUES (NEW.id, 0, 0, 'bronze');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. INCREMENT EXPERIENCE BOOKING COUNT RPC
CREATE OR REPLACE FUNCTION increment_experience_booking_count(exp_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE experiences
  SET booking_count = booking_count + 1
  WHERE id = exp_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. EARN LOYALTY POINTS ON BOOKING COMPLETION
CREATE OR REPLACE FUNCTION earn_booking_points()
RETURNS TRIGGER AS $$
DECLARE
  points_earned INTEGER;
  current_tier TEXT;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- 1 point per 100 MWK spent
    points_earned := FLOOR(NEW.total_price / 100);
    
    SELECT tier INTO current_tier FROM loyalty_points WHERE user_id = NEW.user_id;
    
    -- Apply tier multiplier
    IF current_tier = 'silver' THEN
      points_earned := FLOOR(points_earned * 1.2);
    ELSIF current_tier = 'gold' THEN
      points_earned := FLOOR(points_earned * 1.5);
    ELSIF current_tier = 'platinum' THEN
      points_earned := FLOOR(points_earned * 2);
    END IF;
    
    INSERT INTO loyalty_points (user_id, balance, lifetime_points, tier)
    VALUES (NEW.user_id, points_earned, points_earned, 'bronze')
    ON CONFLICT (user_id) DO UPDATE SET
      balance = loyalty_points.balance + points_earned,
      lifetime_points = loyalty_points.lifetime_points + points_earned,
      updated_at = now();
    
    INSERT INTO loyalty_transactions (user_id, type, points, description, reference_type, reference_id)
    VALUES (NEW.user_id, 'earn', points_earned, 'Earned from booking', 'booking', NEW.id);
    
    -- Auto-upgrade tier based on lifetime points
    UPDATE loyalty_points
    SET tier = CASE
      WHEN lifetime_points >= 5000 THEN 'platinum'
      WHEN lifetime_points >= 2000 THEN 'gold'
      WHEN lifetime_points >= 500 THEN 'silver'
      ELSE 'bronze'
    END
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_booking_completed ON bookings;
CREATE TRIGGER on_booking_completed
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION earn_booking_points();

-- 6. AUTO-UPDATE PROFILE UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN 
    SELECT table_name FROM information_schema.columns 
    WHERE column_name = 'updated_at' 
      AND table_schema = 'public'
      AND table_name NOT IN ('analytics_daily')
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON %I;
      CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ', t, t);
  END LOOP;
END;
$$ LANGUAGE plpgsql;
