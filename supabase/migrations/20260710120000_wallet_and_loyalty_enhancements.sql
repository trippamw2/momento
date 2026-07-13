-- ============================================================================
-- MOMENTO — Wallet & Loyalty Enhancement Migration
-- Adds: stored-value wallets, wallet transactions, enhanced gift cards,
--       enhanced loyalty (black tier, badges), corporate accounts
-- ============================================================================

-- 0. EXTEND ENUMS
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'partially_refunded';


-- ============================================================================
-- 1. WALLETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency TEXT DEFAULT 'MWK',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'suspended', 'closed')),
  kyc_level TEXT DEFAULT 'unverified' CHECK (kyc_level IN ('unverified', 'basic', 'full')),
  daily_limit INTEGER DEFAULT 500000,
  monthly_limit INTEGER DEFAULT 5000000,
  daily_used INTEGER DEFAULT 0,
  monthly_used INTEGER DEFAULT 0,
  is_auto_create BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_status ON wallets(status);
CREATE INDEX IF NOT EXISTS idx_wallets_balance ON wallets(balance);

-- ============================================================================
-- 2. WALLET TRANSACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN (
    'deposit', 'withdrawal', 'payment', 'refund', 'transfer_in', 'transfer_out',
    'cashback', 'bonus', 'fee', 'adjustment', 'gift_card_redemption'
  )),
  amount INTEGER NOT NULL CHECK (amount > 0),
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  currency TEXT DEFAULT 'MWK',
  description TEXT,
  reference_type TEXT CHECK (reference_type IN ('booking', 'gift_card', 'transfer', 'deposit', 'refund', 'cashback', 'bonus', 'adjustment')),
  reference_id UUID,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_reference ON wallet_transactions(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created ON wallet_transactions(created_at DESC);

-- ============================================================================
-- 3. ENHANCED GIFT CARDS — new columns
-- ============================================================================

ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS card_type TEXT DEFAULT 'digital' CHECK (card_type IN ('digital', 'physical', 'corporate'));
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS pin_code TEXT;
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS qr_code TEXT;
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS is_physical BOOLEAN DEFAULT false;
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS transfer_count INTEGER DEFAULT 0;
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS design TEXT;

-- ============================================================================
-- 4. GIFT CARD TRANSFERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS gift_card_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES profiles(id),
  from_email TEXT,
  to_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  transfer_fee INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gift_transfers_card ON gift_card_transfers(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_gift_transfers_from ON gift_card_transfers(from_user_id);
CREATE INDEX IF NOT EXISTS idx_gift_transfers_to ON gift_card_transfers(to_email);
CREATE INDEX IF NOT EXISTS idx_gift_transfers_status ON gift_card_transfers(status);

-- ============================================================================
-- 5. GIFT CARD DESIGN TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS gift_card_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  gradient_start TEXT NOT NULL,
  gradient_via TEXT,
  gradient_end TEXT NOT NULL,
  accent_color TEXT NOT NULL,
  chip_color TEXT,
  text_color TEXT DEFAULT '#FFFFFF',
  light_text_color TEXT DEFAULT '#666666',
  icon TEXT,
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 6. LOYALTY TIERS (reference table with benefits)
-- ============================================================================

CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  min_lifetime_points INTEGER NOT NULL,
  multiplier NUMERIC(3,1) NOT NULL DEFAULT 1.0,
  color_start TEXT NOT NULL,
  color_end TEXT NOT NULL,
  icon TEXT,
  benefits JSONB DEFAULT '[]'::jsonb,
  cashback_rate NUMERIC(3,2) DEFAULT 0,
  discount_percent INTEGER DEFAULT 0,
  free_shipping BOOLEAN DEFAULT false,
  priority_support BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO loyalty_tiers (name, min_lifetime_points, multiplier, color_start, color_end, icon, benefits, cashback_rate, discount_percent) VALUES
  ('bronze', 0, 1.0, '#8B6914', '#C49B2A', '🥉', '["Welcome bonus", "Birthday reward"]', 0, 0),
  ('silver', 500, 1.2, '#9CA3AF', '#D1D5DB', '🥈', '["Welcome bonus", "Birthday reward", "5% discount on bookings"]', 0.5, 5),
  ('gold', 2000, 1.5, '#F59E0B', '#FCD34D', '🥇', '["Welcome bonus x2", "Birthday reward x2", "5% discount", "Priority booking", "Exclusive experiences"]', 1.0, 5),
  ('platinum', 5000, 2.0, '#06B6D4', '#67E8F9', '💎', '["Welcome bonus x3", "Birthday reward x3", "10% discount", "Priority access", "Exclusive experiences", "Dedicated concierge"]', 1.5, 10),
  ('black', 10000, 2.5, '#1F2937', '#4B5563', '🖤', '["Welcome bonus x5", "Birthday reward x5", "15% discount", "VIP-only experiences", "Personal concierge", "Event invites", "Early access", "Cashback rewards"]', 2.0, 15),
  ('vip', 20000, 3.0, '#A855F7', '#D8B4FE', '👑', '["Welcome bonus x5", "Birthday reward x5", "15% discount", "VIP-only experiences", "Personal concierge", "Event invites", "Early access", "Cashback rewards", "Free luxury upgrades"]', 2.5, 15)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 7. USER BADGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  badge_icon TEXT,
  badge_category TEXT CHECK (badge_category IN ('milestone', 'achievement', 'loyalty', 'special', 'promotional')),
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_category ON user_badges(badge_category);

-- ============================================================================
-- 8. CASHBACK TRANSACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS cashback_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  rate NUMERIC(3,2) NOT NULL,
  tier TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'credited', 'expired', 'cancelled')),
  credited_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cashback_user ON cashback_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_cashback_booking ON cashback_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_cashback_status ON cashback_transactions(status);

-- ============================================================================
-- 9. CORPORATE ACCOUNTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS corporate_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  company_registration TEXT,
  company_email TEXT NOT NULL,
  company_phone TEXT,
  company_address TEXT,
  admin_id UUID NOT NULL REFERENCES profiles(id),
  credit_limit INTEGER DEFAULT 0,
  balance INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'MWK',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'closed')),
  spending_limit_daily INTEGER DEFAULT 0,
  spending_limit_monthly INTEGER DEFAULT 0,
  requires_approval BOOLEAN DEFAULT true,
  approval_threshold INTEGER DEFAULT 100000,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corporate_accounts_admin ON corporate_accounts(admin_id);
CREATE INDEX IF NOT EXISTS idx_corporate_accounts_status ON corporate_accounts(status);

-- ============================================================================
-- 10. CORPORATE MEMBERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS corporate_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_account_id UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member')),
  spending_limit INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(corporate_account_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_corp_members_account ON corporate_members(corporate_account_id);
CREATE INDEX IF NOT EXISTS idx_corp_members_user ON corporate_members(user_id);

-- ============================================================================
-- 11. CORPORATE SPENDING RECORDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS corporate_spending (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_account_id UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES corporate_members(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  amount INTEGER NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'reimbursed')),
  approved_by_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corp_spending_account ON corporate_spending(corporate_account_id);
CREATE INDEX IF NOT EXISTS idx_corp_spending_member ON corporate_spending(member_id);
CREATE INDEX IF NOT EXISTS idx_corp_spending_status ON corporate_spending(status);

-- RLS for corporate_spending
ALTER TABLE corporate_spending ENABLE ROW LEVEL SECURITY;
CREATE POLICY "corp_spending_select_own" ON corporate_spending
  FOR SELECT USING (
    user_id = auth.uid()
    OR corporate_account_id IN (SELECT id FROM corporate_accounts WHERE admin_id = auth.uid())
    OR public.is_admin()
  );
CREATE POLICY "corp_spending_insert_own" ON corporate_spending FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 12. WALLET AUTO-CREATE ON SIGNUP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users (schema_v2 main user table)
  INSERT INTO public.users (id, full_name, email, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert into profiles (legacy — api-helpers.ts still queries this)
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Auto-create wallet
  INSERT INTO public.wallets (user_id, balance, currency)
  VALUES (NEW.id, 0, 'MWK')
  ON CONFLICT (user_id) DO NOTHING;

  -- Notification preferences
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Loyalty points
  INSERT INTO public.loyalty_points (user_id, balance, lifetime_points, tier)
  VALUES (NEW.id, 0, 0, 'bronze')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 12. EARN LOYALTY POINTS ON BOOKING COMPLETION (enhanced with black tier)
-- ============================================================================

CREATE OR REPLACE FUNCTION earn_booking_points()
RETURNS TRIGGER AS $$
DECLARE
  points_earned INTEGER;
  old_tier TEXT;
  current_tier TEXT;
  new_tier TEXT;
  tier_multiplier NUMERIC(3,1);
  cashback_amt INTEGER;
  cashback_rate NUMERIC(3,2);
  current_wallet_id UUID;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status != 'completed' OR OLD.status IS NULL) THEN
    -- 1 point per 100 MWK spent
    points_earned := GREATEST(1, FLOOR(NEW.total_price / 100));

    SELECT tier INTO old_tier FROM loyalty_points WHERE user_id = NEW.user_id;
    IF old_tier IS NULL THEN old_tier := 'bronze'; END IF;
    current_tier := old_tier;

    -- Apply tier multiplier (from loyalty_tiers reference)
    SELECT COALESCE(multiplier, 1.0) INTO tier_multiplier
    FROM loyalty_tiers WHERE name = current_tier;
    points_earned := GREATEST(1, FLOOR(points_earned * tier_multiplier));

    -- Upsert loyalty points
    INSERT INTO loyalty_points (user_id, balance, lifetime_points, tier)
    VALUES (NEW.user_id, points_earned, points_earned, 'bronze')
    ON CONFLICT (user_id) DO UPDATE SET
      balance = loyalty_points.balance + points_earned,
      lifetime_points = loyalty_points.lifetime_points + points_earned,
      updated_at = now();

    -- Record transaction
    INSERT INTO loyalty_transactions (user_id, type, points, description, reference_type, reference_id)
    VALUES (NEW.user_id, 'earn', points_earned, 'Earned from booking', 'booking', NEW.id);

    -- Notify: points earned
    INSERT INTO notifications (user_id, type, title, body, data, created_at)
    VALUES (NEW.user_id, 'points_earned', 'Points earned!',
      format('You earned %s points from your booking.', points_earned),
      jsonb_build_object('points', points_earned, 'booking_id', NEW.id, 'experience_id', NEW.experience_id),
      now());

    -- Award badge for first completed booking
    IF (SELECT COUNT(*) FROM bookings WHERE user_id = NEW.user_id AND status = 'completed') = 1 THEN
      INSERT INTO user_badges (user_id, badge_id, badge_name, badge_description, badge_icon, badge_category)
      VALUES (NEW.user_id, 'first_booking', 'First Adventure', 'Book your first experience', '🎉', 'milestone')
      ON CONFLICT (user_id, badge_id) DO NOTHING;

      INSERT INTO notifications (user_id, type, title, body, data, created_at)
      VALUES (NEW.user_id, 'badge_earned', 'Badge earned: First Adventure!',
        'Congratulations on your first booking! You earned the First Adventure badge.',
        jsonb_build_object('badge_id', 'first_booking', 'badge_name', 'First Adventure'),
        now());
    END IF;

    -- Auto-upgrade tier (using loyalty_tiers reference)
    SELECT name INTO new_tier FROM loyalty_tiers
      WHERE min_lifetime_points <= (SELECT lifetime_points FROM loyalty_points WHERE user_id = NEW.user_id)
      ORDER BY min_lifetime_points DESC
      LIMIT 1;

    UPDATE loyalty_points
    SET tier = new_tier
    WHERE user_id = NEW.user_id;

    -- Notify: tier upgrade
    IF new_tier != old_tier THEN
      INSERT INTO notifications (user_id, type, title, body, data, created_at)
      VALUES (NEW.user_id, 'tier_upgrade', 'Tier upgraded!',
        format('Congratulations! You''ve been upgraded to %s tier.', initcap(new_tier)),
        jsonb_build_object('old_tier', old_tier, 'new_tier', new_tier),
        now());
    END IF;

    -- Cashback: credit wallet with cashback amount
    SELECT cashback_rate INTO cashback_rate FROM loyalty_tiers
      WHERE name = new_tier
      LIMIT 1;

    IF cashback_rate > 0 THEN
      cashback_amt := GREATEST(1, FLOOR(NEW.total_price * cashback_rate / 100));

      INSERT INTO cashback_transactions (user_id, booking_id, amount, rate, tier, status, credited_at)
      VALUES (NEW.user_id, NEW.id, cashback_amt, cashback_rate, current_tier, 'credited', now());

      -- Credit wallet
      SELECT id INTO current_wallet_id FROM wallets WHERE user_id = NEW.user_id;
      IF current_wallet_id IS NOT NULL AND cashback_amt > 0 THEN
        UPDATE wallets SET balance = balance + cashback_amt, updated_at = now()
        WHERE id = current_wallet_id;

        INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, balance_before, balance_after, description, reference_type, reference_id)
        SELECT current_wallet_id, NEW.user_id, 'cashback', cashback_amt, balance, balance + cashback_amt, 'Cashback from booking', 'booking', NEW.id
        FROM wallets WHERE id = current_wallet_id;

        -- Notify: cashback credited
        INSERT INTO notifications (user_id, type, title, body, data, created_at)
        VALUES (NEW.user_id, 'cashback_credited', 'Cashback received!',
          format('MWK %s cashback from your booking has been added to your wallet.', cashback_amt),
          jsonb_build_object('amount', cashback_amt, 'booking_id', NEW.id, 'tier', new_tier),
          now());
      END IF;
    END IF;
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

-- ============================================================================
-- 13. WALLET DAILY/MONTHLY RESET FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_wallet_limits()
RETURNS void AS $$
BEGIN
  -- Reset daily limits
  UPDATE wallets SET daily_used = 0, updated_at = now()
  WHERE daily_used > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 14. GET WALLET BALANCE FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_wallet_balance(user_id UUID)
RETURNS TABLE(balance INTEGER, currency TEXT, status TEXT, kyc_level TEXT, daily_used INTEGER, monthly_used INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT w.balance, w.currency::text, w.status, w.kyc_level, w.daily_used, w.monthly_used
  FROM wallets w
  WHERE w.user_id = get_wallet_balance.user_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- 15. RLS POLICIES FOR NEW TABLES
-- ============================================================================

-- Wallets: user owns their wallet, admin can see all
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallets_select_own" ON wallets FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "wallets_update_own" ON wallets FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

-- Wallet transactions: user sees their own, admin sees all
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet_tx_select_own" ON wallet_transactions FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "wallet_tx_insert_system" ON wallet_transactions FOR INSERT WITH CHECK (true);

-- Gift card transfers: involved users see them
ALTER TABLE gift_card_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gift_transfers_select_own" ON gift_card_transfers
  FOR SELECT USING (
    from_user_id = auth.uid() OR to_email = auth.email() OR public.is_admin()
  );
CREATE POLICY "gift_transfers_insert_own" ON gift_card_transfers FOR INSERT WITH CHECK (from_user_id = auth.uid());
CREATE POLICY "gift_transfers_update_own" ON gift_card_transfers FOR UPDATE USING (from_user_id = auth.uid() OR public.is_admin());

-- Gift card designs: read-only for all
ALTER TABLE gift_card_designs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "designs_select_all" ON gift_card_designs FOR SELECT USING (true);

-- User badges
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges_select_own" ON user_badges FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- Cashback transactions
ALTER TABLE cashback_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cashback_select_own" ON cashback_transactions FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- Corporate accounts
ALTER TABLE corporate_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "corp_select_admin" ON corporate_accounts FOR SELECT USING (admin_id = auth.uid() OR public.is_admin());
CREATE POLICY "corp_insert_admin" ON corporate_accounts FOR INSERT WITH CHECK (admin_id = auth.uid() OR public.is_admin());
CREATE POLICY "corp_update_admin" ON corporate_accounts FOR UPDATE USING (admin_id = auth.uid() OR public.is_admin());

-- Corporate members
ALTER TABLE corporate_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "corp_members_select_own" ON corporate_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR corporate_account_id IN (SELECT id FROM corporate_accounts WHERE admin_id = auth.uid())
    OR public.is_admin()
  );
CREATE POLICY "corp_members_insert_own" ON corporate_members FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "corp_members_update_own" ON corporate_members FOR UPDATE USING (public.is_admin());

-- ============================================================================
-- 16. SEED DATA: Gift Card Designs
-- ============================================================================

INSERT INTO gift_card_designs (name, slug, description, gradient_start, gradient_via, gradient_end, accent_color, chip_color, text_color, light_text_color, icon, is_premium, is_active) VALUES
  ('Midnight Elegance', 'midnight', 'Classic dark premium design', '#0F172A', '#1E293B', '#334155', '#F59E0B', '#FCD34D', '#FFFFFF', '#94A3B8', '🌙', false, true),
  ('Rose Gold', 'rose-gold', 'Warm and romantic rose tones', '#86198F', '#BE185D', '#F43F5E', '#FDF2F8', '#FBCFE8', '#FFFFFF', '#FDA4AF', '🌹', false, true),
  ('Platinum', 'platinum', 'Sleek modern metallic', '#1F2937', '#374151', '#6B7280', '#10B981', '#6EE7B7', '#FFFFFF', '#9CA3AF', '💎', false, true),
  ('Gold', 'gold', 'Warm golden celebration design', '#92400E', '#D97706', '#FCD34D', '#1F2937', '#374151', '#FFFFFF', '#FCD34D', '⭐', false, true),
  ('Ocean Blue', 'ocean', 'Tranquil ocean-inspired gradient', '#1E3A5F', '#0891B2', '#67E8F9', '#FCD34D', '#FDE68A', '#FFFFFF', '#99F6E4', '🌊', false, true),
  ('Signature', 'signature', 'Brand signature burgundy design', '#4C1D95', '#7C3AED', '#A78BFA', '#FCD34D', '#FDE68A', '#FFFFFF', '#C4B5FD', '✨', false, true),
  ('Sunset', 'sunset', 'Vibrant sunset gradient', '#DC2626', '#EA580C', '#FCD34D', '#FFFFFF', '#FEF3C7', '#FFFFFF', '#FCA5A5', '🌅', true, true),
  ('Emerald', 'emerald', 'Lush green premium design', '#064E3B', '#059669', '#34D399', '#FCD34D', '#FDE68A', '#FFFFFF', '#6EE7B7', '💚', true, true),
  ('Royal', 'royal', 'Deep purple royal treatment', '#3B0764', '#7E22CE', '#C084FC', '#FCD34D', '#FDE68A', '#FFFFFF', '#D8B4FE', '👑', true, true),
  ('Crimson', 'crimson', 'Bold red statement design', '#7F1D1D', '#DC2626', '#FCA5A5', '#FFFFFF', '#FECACA', '#FFFFFF', '#FCA5A5', '❤️', true, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 17. SEED DATA: Badge Definitions (inserted into user_badges reference)
-- Create a reference table for badge definitions
-- ============================================================================

CREATE TABLE IF NOT EXISTS badge_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT CHECK (category IN ('milestone', 'achievement', 'loyalty', 'special', 'promotional')),
  requirement_description TEXT,
  sort_order INTEGER DEFAULT 0
);

INSERT INTO badge_definitions (id, name, description, icon, category, requirement_description, sort_order) VALUES
  ('first_booking', 'First Adventure', 'Book your first experience', '🎉', 'milestone', 'Complete your first booking', 1),
  ('five_bookings', 'Explorer', 'Book 5 experiences', '🧭', 'milestone', 'Complete 5 bookings', 2),
  ('ten_bookings', 'Adventurer', 'Book 10 experiences', '🏆', 'milestone', 'Complete 10 bookings', 3),
  ('twentyfive_bookings', 'Trailblazer', 'Book 25 experiences', '🌟', 'milestone', 'Complete 25 bookings', 4),
  ('big_spender', 'Big Spender', 'Spend MK 500,000 total', '💰', 'achievement', 'Spend MK 500,000 on experiences', 5),
  ('big_spender_vip', 'High Roller', 'Spend MK 2,000,000 total', '💎', 'achievement', 'Spend MK 2,000,000 on experiences', 6),
  ('reviewer', 'Critic', 'Leave 3 reviews', '✍️', 'achievement', 'Write 3 experience reviews', 7),
  ('globetrotter', 'Globetrotter', 'Book in 3 different cities', '🌍', 'achievement', 'Book experiences in 3 cities', 8),
  ('variety', 'Variety Seeker', 'Try 4 different categories', '🎯', 'achievement', 'Book experiences in 4 categories', 9),
  ('streak_4', 'Weekend Warrior', 'Book 4 consecutive weeks', '🔥', 'milestone', 'Book 4 weekends in a row', 10),
  ('streak_8', 'Dedicated Explorer', 'Book 8 consecutive weeks', '⚡', 'milestone', 'Book 8 weekends in a row', 11),
  ('streak_12', 'Loyal Legend', 'Book 12 consecutive weeks', '👑', 'milestone', 'Book 12 weekends in a row', 12),
  ('gifter', 'Generous Soul', 'Send 5 gift cards', '🎁', 'achievement', 'Purchase 5 gift cards', 13),
  ('referrer', 'Influencer', 'Refer 3 friends', '🤝', 'achievement', 'Refer 3 friends to Experio', 14),
  ('birthday', 'Birthday Booker', 'Book on your birthday', '🎂', 'special', 'Book an experience on your birthday', 15),
  ('wallet_topup', 'Funded', 'Deposit into your wallet', '💰', 'milestone', 'Make your first wallet deposit', 16),
  ('wallet_100k', 'Stacked', 'Accumulate MK 100,000 in wallet', '🏦', 'milestone', 'Reach MK 100,000 wallet balance', 17),
  ('silver_tier', 'Silver Status', 'Reach Silver loyalty tier', '🥈', 'loyalty', 'Earn 500 lifetime points', 18),
  ('gold_tier', 'Gold Status', 'Reach Gold loyalty tier', '🥇', 'loyalty', 'Earn 2,000 lifetime points', 19),
  ('platinum_tier', 'Platinum Status', 'Reach Platinum loyalty tier', '💎', 'loyalty', 'Earn 5,000 lifetime points', 20),
  ('black_tier', 'Black Status', 'Reach Black loyalty tier', '🖤', 'loyalty', 'Earn 10,000 lifetime points', 21),
  ('vip_tier', 'VIP Status', 'Reach VIP loyalty tier', '👑', 'loyalty', 'Earn 20,000 lifetime points', 22)
ON CONFLICT (id) DO NOTHING;
