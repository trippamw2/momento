-- ============================================================================
-- MOMENTO — Row-Level Security Policies (Schema v2)
-- Run AFTER schema_v2.sql in Supabase SQL Editor
-- Three roles: user, partner, admin
-- ============================================================================

-- 0. ENABLE RLS ON ALL TABLES
DO $$ DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'users', 'partners', 'cities', 'venues', 'experience_categories',
      'experiences', 'bookings', 'booking_guests', 'gift_cards', 'gift_redemptions',
      'saved_experiences', 'collections', 'collection_items', 'reviews',
      'payments', 'notifications', 'notification_preferences',
      'analytics_events', 'analytics_daily'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END $$;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE SQL STABLE
AS $$ SELECT COALESCE((SELECT role FROM public.users WHERE id = auth.uid()), 'user'::user_role); $$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$ SELECT public.get_user_role() = 'admin'; $$;

CREATE OR REPLACE FUNCTION public.is_partner()
RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$ SELECT public.get_user_role() = 'partner'; $$;

CREATE OR REPLACE FUNCTION public.get_partner_id()
RETURNS UUID
LANGUAGE SQL STABLE
AS $$ SELECT id FROM public.partners WHERE user_id = auth.uid(); $$;

-- ============================================================================
-- 1. USERS
-- ============================================================================
CREATE POLICY "users_select_own" ON users FOR SELECT USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (id = auth.uid() OR public.is_admin());

-- ============================================================================
-- 2. PARTNERS
-- ============================================================================
CREATE POLICY "partners_select_verified" ON partners
  FOR SELECT USING (verification_status = 'verified' OR user_id = auth.uid() OR public.is_admin());
CREATE POLICY "partners_insert_own" ON partners FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "partners_update_own" ON partners FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "partners_delete_admin" ON partners FOR DELETE USING (public.is_admin());

-- ============================================================================
-- 3. CITIES (read-only for all)
-- ============================================================================
CREATE POLICY "cities_select_all" ON cities FOR SELECT USING (true);

-- ============================================================================
-- 4. VENUES
-- ============================================================================
CREATE POLICY "venues_select_public" ON venues FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "venues_insert_partner" ON venues
  FOR INSERT WITH CHECK (partner_id = public.get_partner_id() OR public.is_admin());
CREATE POLICY "venues_update_own" ON venues
  FOR UPDATE USING (partner_id = public.get_partner_id() OR public.is_admin());
CREATE POLICY "venues_delete_own" ON venues
  FOR DELETE USING (partner_id = public.get_partner_id() OR public.is_admin());

-- ============================================================================
-- 5. EXPERIENCE CATEGORIES (read-only for all)
-- ============================================================================
CREATE POLICY "categories_select_all" ON experience_categories FOR SELECT USING (true);
CREATE POLICY "categories_insert_admin" ON experience_categories FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "categories_update_admin" ON experience_categories FOR UPDATE USING (public.is_admin());

-- ============================================================================
-- 6. EXPERIENCES
-- ============================================================================
CREATE POLICY "experiences_select_public" ON experiences
  FOR SELECT USING (status = 'published' OR partner_id = public.get_partner_id() OR public.is_admin());
CREATE POLICY "experiences_insert_partner" ON experiences
  FOR INSERT WITH CHECK (partner_id = public.get_partner_id() AND (public.is_partner() OR public.is_admin()));
CREATE POLICY "experiences_update_own" ON experiences
  FOR UPDATE USING (partner_id = public.get_partner_id() OR public.is_admin());
CREATE POLICY "experiences_delete_own" ON experiences
  FOR DELETE USING (partner_id = public.get_partner_id() OR public.is_admin());

-- ============================================================================
-- 7. BOOKINGS
-- ============================================================================
CREATE POLICY "bookings_select_own" ON bookings
  FOR SELECT USING (
    user_id = auth.uid()
    OR experience_id IN (SELECT id FROM experiences WHERE partner_id = public.get_partner_id())
    OR public.is_admin()
  );
CREATE POLICY "bookings_insert_user" ON bookings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "bookings_update_own" ON bookings
  FOR UPDATE USING (
    user_id = auth.uid()
    OR experience_id IN (SELECT id FROM experiences WHERE partner_id = public.get_partner_id())
    OR public.is_admin()
  );

-- ============================================================================
-- 8. BOOKING GUESTS
-- ============================================================================
CREATE POLICY "booking_guests_select_own" ON booking_guests
  FOR SELECT USING (
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
    OR booking_id IN (SELECT b.id FROM bookings b JOIN experiences e ON b.experience_id = e.id WHERE e.partner_id = public.get_partner_id())
    OR public.is_admin()
  );
CREATE POLICY "booking_guests_insert" ON booking_guests
  FOR INSERT WITH CHECK (
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
    OR public.is_admin()
  );
CREATE POLICY "booking_guests_update_partner" ON booking_guests
  FOR UPDATE USING (
    booking_id IN (SELECT b.id FROM bookings b JOIN experiences e ON b.experience_id = e.id WHERE e.partner_id = public.get_partner_id())
    OR public.is_admin()
  );

-- ============================================================================
-- 9. GIFT CARDS
-- ============================================================================
CREATE POLICY "gift_cards_select_own" ON gift_cards
  FOR SELECT USING (issuer_id = auth.uid() OR recipient_email = auth.email() OR public.is_admin());
CREATE POLICY "gift_cards_insert_user" ON gift_cards FOR INSERT WITH CHECK (issuer_id = auth.uid());
CREATE POLICY "gift_cards_update_own" ON gift_cards FOR UPDATE USING (issuer_id = auth.uid() OR public.is_admin());

-- ============================================================================
-- 10. GIFT REDEMPTIONS
-- ============================================================================
CREATE POLICY "gift_redemptions_select_own" ON gift_redemptions
  FOR SELECT USING (
    gift_card_id IN (SELECT id FROM gift_cards WHERE issuer_id = auth.uid() OR recipient_email = auth.email())
    OR public.is_admin()
  );
CREATE POLICY "gift_redemptions_insert" ON gift_redemptions
  FOR INSERT WITH CHECK (
    gift_card_id IN (SELECT id FROM gift_cards WHERE issuer_id = auth.uid() OR recipient_email = auth.email())
    OR public.is_admin()
  );

-- ============================================================================
-- 11. SAVED EXPERIENCES
-- ============================================================================
CREATE POLICY "saved_select_own" ON saved_experiences FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "saved_insert_own" ON saved_experiences FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "saved_delete_own" ON saved_experiences FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- 12. COLLECTIONS
-- ============================================================================
CREATE POLICY "collections_select_own" ON collections
  FOR SELECT USING (user_id = auth.uid() OR (NOT is_private));
CREATE POLICY "collections_insert_own" ON collections FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "collections_update_own" ON collections FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "collections_delete_own" ON collections FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- 13. COLLECTION ITEMS
-- ============================================================================
CREATE POLICY "collection_items_select_own" ON collection_items
  FOR SELECT USING (
    collection_id IN (SELECT id FROM collections WHERE user_id = auth.uid() OR (NOT is_private))
  );
CREATE POLICY "collection_items_insert_own" ON collection_items
  FOR INSERT WITH CHECK (
    collection_id IN (SELECT id FROM collections WHERE user_id = auth.uid())
  );
CREATE POLICY "collection_items_delete_own" ON collection_items
  FOR DELETE USING (
    collection_id IN (SELECT id FROM collections WHERE user_id = auth.uid())
  );

-- ============================================================================
-- 14. REVIEWS
-- ============================================================================
CREATE POLICY "reviews_select_public" ON reviews
  FOR SELECT USING (status = 'approved' OR user_id = auth.uid() OR public.is_admin());
CREATE POLICY "reviews_insert_user" ON reviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE USING (
    user_id = auth.uid()
    OR experience_id IN (SELECT id FROM experiences WHERE partner_id = public.get_partner_id())
    OR public.is_admin()
  );
CREATE POLICY "reviews_delete_admin" ON reviews FOR DELETE USING (public.is_admin());

-- ============================================================================
-- 15. PAYMENTS
-- ============================================================================
CREATE POLICY "payments_select_own" ON payments
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "payments_insert_user" ON payments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "payments_update_admin" ON payments FOR UPDATE USING (public.is_admin());

-- ============================================================================
-- 16. NOTIFICATIONS
-- ============================================================================
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_insert_system" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "notification_prefs_select_own" ON notification_preferences FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notification_prefs_insert_own" ON notification_preferences FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "notification_prefs_update_own" ON notification_preferences FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- 17. ANALYTICS
-- ============================================================================
CREATE POLICY "analytics_events_insert" ON analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "analytics_events_select_admin" ON analytics_events FOR SELECT USING (public.is_admin());

CREATE POLICY "analytics_daily_select_admin" ON analytics_daily FOR SELECT USING (public.is_admin());
CREATE POLICY "analytics_daily_insert_admin" ON analytics_daily FOR INSERT WITH CHECK (public.is_admin());
