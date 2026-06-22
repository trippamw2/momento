-- ============================================================================
-- MOMENTO — Row-Level Security Policies
-- Run AFTER schema.sql in the Supabase SQL Editor
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Helper: current user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE SQL STABLE
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'user'::user_role
  );
$$;

-- Helper: is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$
  SELECT public.get_user_role() = 'admin';
$$;

-- Helper: is partner
CREATE OR REPLACE FUNCTION public.is_partner()
RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$
  SELECT public.get_user_role() = 'partner';
$$;

-- Helper: get partner id for current user
CREATE OR REPLACE FUNCTION public.get_partner_id()
RETURNS UUID
LANGUAGE SQL STABLE
AS $$
  SELECT id FROM public.partner_profiles WHERE user_id = auth.uid();
$$;

-- ============================================================================
-- PROFILES
-- ============================================================================
CREATE POLICY "profiles_select_own_or_admin" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR public.is_admin()
  );

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own_or_admin" ON profiles
  FOR UPDATE USING (id = auth.uid() OR public.is_admin());

-- ============================================================================
-- PARTNER PROFILES
-- ============================================================================
CREATE POLICY "partner_profiles_select_public" ON partner_profiles
  FOR SELECT USING (
    verification_status = 'verified' OR user_id = auth.uid() OR public.is_admin()
  );

CREATE POLICY "partner_profiles_insert_own" ON partner_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "partner_profiles_update_own_or_admin" ON partner_profiles
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

-- ============================================================================
-- EXPERIENCES
-- ============================================================================
CREATE POLICY "experiences_select_public" ON experiences
  FOR SELECT USING (
    status = 'published' OR partner_id = public.get_partner_id() OR public.is_admin()
  );

CREATE POLICY "experiences_insert_partner" ON experiences
  FOR INSERT WITH CHECK (
    partner_id = public.get_partner_id() AND (public.is_partner() OR public.is_admin())
  );

CREATE POLICY "experiences_update_own_or_admin" ON experiences
  FOR UPDATE USING (
    partner_id = public.get_partner_id() OR public.is_admin()
  );

CREATE POLICY "experiences_delete_own_or_admin" ON experiences
  FOR DELETE USING (
    partner_id = public.get_partner_id() OR public.is_admin()
  );

-- ============================================================================
-- EXPERIENCE IMAGES
-- ============================================================================
CREATE POLICY "experience_images_select_public" ON experience_images
  FOR SELECT USING (true);

CREATE POLICY "experience_images_insert_partner" ON experience_images
  FOR INSERT WITH CHECK (
    experience_id IN (
      SELECT id FROM experiences WHERE partner_id = public.get_partner_id()
    ) OR public.is_admin()
  );

CREATE POLICY "experience_images_delete_own" ON experience_images
  FOR DELETE USING (
    experience_id IN (
      SELECT id FROM experiences WHERE partner_id = public.get_partner_id()
    ) OR public.is_admin()
  );

-- ============================================================================
-- EXPERIENCE MOODS
-- ============================================================================
CREATE POLICY "experience_moods_select_public" ON experience_moods
  FOR SELECT USING (true);

CREATE POLICY "experience_moods_insert_partner" ON experience_moods
  FOR INSERT WITH CHECK (
    experience_id IN (
      SELECT id FROM experiences WHERE partner_id = public.get_partner_id()
    ) OR public.is_admin()
  );

-- ============================================================================
-- EXPERIENCE AVAILABILITY
-- ============================================================================
CREATE POLICY "availability_select_public" ON experience_availability
  FOR SELECT USING (true);

CREATE POLICY "availability_insert_partner" ON experience_availability
  FOR INSERT WITH CHECK (
    experience_id IN (
      SELECT id FROM experiences WHERE partner_id = public.get_partner_id()
    ) OR public.is_admin()
  );

CREATE POLICY "availability_update_partner" ON experience_availability
  FOR UPDATE USING (
    experience_id IN (
      SELECT id FROM experiences WHERE partner_id = public.get_partner_id()
    ) OR public.is_admin()
  );

-- ============================================================================
-- BOOKINGS
-- ============================================================================
CREATE POLICY "bookings_select_own" ON bookings
  FOR SELECT USING (
    user_id = auth.uid() OR
    experience_id IN (SELECT id FROM experiences WHERE partner_id = public.get_partner_id()) OR
    public.is_admin()
  );

CREATE POLICY "bookings_insert_user" ON bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "bookings_update_own" ON bookings
  FOR UPDATE USING (
    user_id = auth.uid() OR
    experience_id IN (SELECT id FROM experiences WHERE partner_id = public.get_partner_id()) OR
    public.is_admin()
  );

-- ============================================================================
-- GIFT CARDS
-- ============================================================================
CREATE POLICY "gift_cards_select_own" ON gift_cards
  FOR SELECT USING (
    issuer_id = auth.uid() OR recipient_email = auth.email() OR public.is_admin()
  );

CREATE POLICY "gift_cards_insert_user" ON gift_cards
  FOR INSERT WITH CHECK (issuer_id = auth.uid());

CREATE POLICY "gift_cards_update_own" ON gift_cards
  FOR UPDATE USING (
    issuer_id = auth.uid() OR public.is_admin()
  );

-- ============================================================================
-- GIFT CARD TRANSACTIONS
-- ============================================================================
CREATE POLICY "gct_select_own" ON gift_card_transactions
  FOR SELECT USING (
    gift_card_id IN (
      SELECT id FROM gift_cards WHERE issuer_id = auth.uid() OR recipient_email = auth.email()
    ) OR public.is_admin()
  );

-- ============================================================================
-- PAYMENTS
-- ============================================================================
CREATE POLICY "payments_select_own" ON payments
  FOR SELECT USING (
    user_id = auth.uid() OR public.is_admin()
  );

CREATE POLICY "payments_insert_user" ON payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- COLLECTIONS
-- ============================================================================
CREATE POLICY "collections_select_own" ON collections
  FOR SELECT USING (
    user_id = auth.uid() OR (NOT is_private)
  );

CREATE POLICY "collections_insert_own" ON collections
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "collections_update_own" ON collections
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "collections_delete_own" ON collections
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- SAVED ITEMS
-- ============================================================================
CREATE POLICY "saved_items_select_own" ON saved_items
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "saved_items_insert_own" ON saved_items
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "saved_items_delete_own" ON saved_items
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- NOTIFICATION PREFERENCES
-- ============================================================================
CREATE POLICY "notification_prefs_select_own" ON notification_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notification_prefs_insert_own" ON notification_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "notification_prefs_update_own" ON notification_preferences
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- REVIEWS
-- ============================================================================
CREATE POLICY "reviews_select_public" ON reviews
  FOR SELECT USING (
    status = 'approved' OR user_id = auth.uid() OR public.is_admin()
  );

CREATE POLICY "reviews_insert_user" ON reviews
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE USING (
    user_id = auth.uid() OR
    experience_id IN (SELECT id FROM experiences WHERE partner_id = public.get_partner_id())
  );

CREATE POLICY "reviews_delete_admin" ON reviews
  FOR DELETE USING (public.is_admin());

-- ============================================================================
-- REVIEW FLAGS
-- ============================================================================
CREATE POLICY "review_flags_select_admin" ON review_flags
  FOR SELECT USING (public.is_admin());

CREATE POLICY "review_flags_insert_user" ON review_flags
  FOR INSERT WITH CHECK (flagged_by = auth.uid());

CREATE POLICY "review_flags_update_admin" ON review_flags
  FOR UPDATE USING (public.is_admin());

-- ============================================================================
-- ANALYTICS
-- ============================================================================
CREATE POLICY "analytics_events_insert" ON analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "analytics_events_select_admin" ON analytics_events
  FOR SELECT USING (public.is_admin());

CREATE POLICY "analytics_daily_select_admin" ON analytics_daily
  FOR SELECT USING (public.is_admin());

CREATE POLICY "analytics_daily_insert_admin" ON analytics_daily
  FOR INSERT WITH CHECK (public.is_admin());
