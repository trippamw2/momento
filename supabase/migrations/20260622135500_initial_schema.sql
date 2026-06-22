-- ============================================================================
-- MOMENTO — Full Database Schema
-- PostgreSQL + Supabase
-- ============================================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. ENUMS
-- ============================================================================
CREATE TYPE user_role AS ENUM ('user', 'partner', 'admin');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE experience_status AS ENUM ('draft', 'published', 'archived', 'paused');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'refunded', 'no_show');
CREATE TYPE gift_card_status AS ENUM ('active', 'partially_redeemed', 'redeemed', 'expired', 'cancelled', 'refunded');
CREATE TYPE gift_card_delivery AS ENUM ('email', 'whatsapp', 'sms', 'print');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded');
CREATE TYPE review_status AS ENUM ('approved', 'pending', 'rejected');
CREATE TYPE flag_status AS ENUM ('pending', 'reviewed', 'dismissed');
CREATE TYPE cancellation_policy AS ENUM ('flexible', 'moderate', 'strict');

-- ============================================================================
-- 2. CORE TABLES
-- ============================================================================

-- 2a. PROFILES (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'user',
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  country TEXT DEFAULT 'Malawi',
  city TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_role ON profiles(role);

-- 2b. PARTNER PROFILES
CREATE TABLE partner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_description TEXT,
  business_logo TEXT,
  business_cover TEXT,
  business_email TEXT,
  business_phone TEXT,
  business_website TEXT,
  business_address TEXT,
  business_city TEXT,
  business_country TEXT DEFAULT 'Malawi',
  categories TEXT[] DEFAULT '{}'::text[],
  verification_status verification_status DEFAULT 'pending',
  verification_document TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  commission_rate NUMERIC(3,2) DEFAULT 0.10,
  payout_method TEXT,
  payout_details JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_partner_profiles_verification ON partner_profiles(verification_status);
CREATE INDEX idx_partner_profiles_active ON partner_profiles(is_active) WHERE is_active = true;

-- ============================================================================
-- 3. EXPERIENCES
-- ============================================================================

-- 3a. CATEGORIES
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0
);

-- 3b. MOODS
CREATE TABLE moods (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL UNIQUE,
  emoji TEXT NOT NULL,
  description TEXT
);

-- 3c. EXPERIENCES
CREATE TABLE experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MWK',
  location TEXT NOT NULL,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  duration TEXT NOT NULL,
  duration_minutes INTEGER,
  capacity INTEGER DEFAULT 1,
  max_guests INTEGER DEFAULT 10,
  includes TEXT[] DEFAULT '{}'::text[],
  what_to_bring TEXT[] DEFAULT '{}'::text[],
  requirements TEXT[] DEFAULT '{}'::text[],
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}'::text[],
  status experience_status DEFAULT 'draft',
  featured BOOLEAN DEFAULT false,
  rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  booking_count INTEGER DEFAULT 0,
  cancellation_policy cancellation_policy DEFAULT 'flexible',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_experiences_partner ON experiences(partner_id);
CREATE INDEX idx_experiences_status ON experiences(status);
CREATE INDEX idx_experiences_category ON experiences(category);
CREATE INDEX idx_experiences_featured ON experiences(featured) WHERE featured = true;
CREATE INDEX idx_experiences_rating ON experiences(rating DESC);
CREATE INDEX idx_experiences_price ON experiences(price);
CREATE INDEX idx_experiences_tags ON experiences USING GIN(tags);
CREATE INDEX idx_experiences_search ON experiences USING GIN(to_tsvector('english', title || ' ' || subtitle || ' ' || description));

-- 3d. EXPERIENCE IMAGES
CREATE TABLE experience_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT,
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_experience_images_experience ON experience_images(experience_id);
CREATE INDEX idx_experience_images_primary ON experience_images(experience_id, is_primary) WHERE is_primary = true;

-- 3e. EXPERIENCE MOODS (many-to-many)
CREATE TABLE experience_moods (
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  mood_id INTEGER NOT NULL REFERENCES moods(id) ON DELETE CASCADE,
  PRIMARY KEY (experience_id, mood_id)
);

CREATE INDEX idx_experience_moods_mood ON experience_moods(mood_id);

-- 3f. EXPERIENCE AVAILABILITY
CREATE TABLE experience_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  available_slots INTEGER NOT NULL DEFAULT 1,
  total_slots INTEGER NOT NULL DEFAULT 1,
  is_available BOOLEAN DEFAULT true,
  price_override INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(experience_id, date, start_time)
);

CREATE INDEX idx_availability_experience ON experience_availability(experience_id);
CREATE INDEX idx_availability_date ON experience_availability(date);
CREATE INDEX idx_availability_available ON experience_availability(is_available) WHERE is_available = true;

-- ============================================================================
-- 4. BOOKINGS
-- ============================================================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  experience_id UUID NOT NULL REFERENCES experiences(id),
  availability_id UUID REFERENCES experience_availability(id),
  status booking_status DEFAULT 'pending',
  guests_count INTEGER NOT NULL DEFAULT 1,
  total_price INTEGER NOT NULL,
  currency TEXT DEFAULT 'MWK',
  notes TEXT,
  special_requests TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  booking_date TIMESTAMPTZ DEFAULT now(),
  experience_date DATE,
  experience_time TIME,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_experience ON bookings(experience_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(experience_date);
CREATE INDEX idx_bookings_partner ON bookings(experience_id);

-- ============================================================================
-- 5. GIFT CARDS
-- ============================================================================
CREATE TABLE gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  issuer_id UUID NOT NULL REFERENCES profiles(id),
  recipient_email TEXT,
  recipient_name TEXT,
  sender_name TEXT,
  message TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'MWK',
  balance INTEGER NOT NULL,
  delivery_method gift_card_delivery DEFAULT 'email',
  delivery_status TEXT DEFAULT 'pending',
  status gift_card_status DEFAULT 'active',
  occasion TEXT,
  design TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  redeemed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gift_cards_code ON gift_cards(code);
CREATE INDEX idx_gift_cards_issuer ON gift_cards(issuer_id);
CREATE INDEX idx_gift_cards_status ON gift_cards(status);
CREATE INDEX idx_gift_cards_recipient ON gift_cards(recipient_email);

CREATE TABLE gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),
  type TEXT NOT NULL CHECK (type IN ('purchase', 'redemption', 'refund', 'top_up')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gct_gift_card ON gift_card_transactions(gift_card_id);

-- ============================================================================
-- 6. PAYMENTS
-- ============================================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  gift_card_id UUID REFERENCES gift_cards(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'MWK',
  method TEXT NOT NULL,
  provider TEXT,
  provider_reference TEXT,
  status payment_status DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_provider_ref ON payments(provider_reference);

-- ============================================================================
-- 7. SAVED ITEMS & COLLECTIONS
-- ============================================================================
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_collections_user ON collections(user_id);

CREATE TABLE saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, experience_id)
);

CREATE INDEX idx_saved_items_user ON saved_items(user_id);
CREATE INDEX idx_saved_items_collection ON saved_items(collection_id);

-- ============================================================================
-- 8. NOTIFICATIONS
-- ============================================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  email_bookings BOOLEAN DEFAULT true,
  email_promotions BOOLEAN DEFAULT false,
  email_reviews BOOLEAN DEFAULT true,
  push_bookings BOOLEAN DEFAULT true,
  push_promotions BOOLEAN DEFAULT false,
  push_reviews BOOLEAN DEFAULT true,
  sms_bookings BOOLEAN DEFAULT true,
  sms_promotions BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 9. REVIEWS
-- ============================================================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT,
  images TEXT[] DEFAULT '{}'::text[],
  is_verified BOOLEAN DEFAULT false,
  status review_status DEFAULT 'pending',
  partner_response TEXT,
  partner_responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(booking_id, user_id)
);

CREATE INDEX idx_reviews_experience ON reviews(experience_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Flagged reviews (admin moderation)
CREATE TABLE review_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  flagged_by UUID NOT NULL REFERENCES profiles(id),
  reason TEXT NOT NULL,
  status flag_status DEFAULT 'pending',
  resolved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_review_flags_status ON review_flags(status);

-- ============================================================================
-- 10. ANALYTICS
-- ============================================================================
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  session_id TEXT,
  page TEXT,
  referrer TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  device TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);

CREATE TABLE analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  metric_name TEXT NOT NULL,
  metric_value INTEGER NOT NULL DEFAULT 0,
  dimension JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, metric_name, dimension)
);

CREATE INDEX idx_analytics_daily_date ON analytics_daily(date);
CREATE INDEX idx_analytics_daily_metric ON analytics_daily(metric_name);

-- ============================================================================
-- 11. SEED DATA
-- ============================================================================
INSERT INTO moods (label, emoji, description) VALUES
  ('Romantic', '🌹', 'Perfect for two'),
  ('Relax', '🧘', 'Unwind and recharge'),
  ('Celebrate', '🎉', 'Make it special'),
  ('Escape', '🌴', 'Get away from it all'),
  ('Treat Myself', '✨', 'You deserve it');

INSERT INTO categories (name, slug, description, icon, sort_order) VALUES
  ('Food & Drink', 'food-drink', 'Culinary experiences and tastings', '🍽️', 1),
  ('Adventure', 'adventure', 'Thrilling outdoor activities', '🏔️', 2),
  ('Wellness', 'wellness', 'Relaxation and self-care', '🧘', 3),
  ('Arts & Culture', 'arts-culture', 'Creative and cultural experiences', '🎨', 4),
  ('Music & Nightlife', 'music-nightlife', 'Live events and nightlife', '🎵', 5),
  ('Nature & Outdoors', 'nature-outdoors', 'Nature exploration', '🌿', 6),
  ('Workshops', 'workshops', 'Learn something new', '📚', 7),
  ('Luxury', 'luxury', 'Premium exclusive experiences', '💎', 8);


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
