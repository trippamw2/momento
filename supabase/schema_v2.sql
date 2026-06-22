-- ============================================================================
-- MOMENTO — Production Database Schema
-- Designed for scaling across Africa
-- PostgreSQL 16 + Supabase
-- Target: Hotels, Restaurants, Spas, Resorts, Activity Providers
-- ============================================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('user', 'partner', 'admin');
CREATE TYPE partner_verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected', 'suspended');
CREATE TYPE experience_status AS ENUM ('draft', 'published', 'paused', 'archived');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded', 'no_show');
CREATE TYPE gift_card_status AS ENUM ('active', 'partially_redeemed', 'fully_redeemed', 'expired', 'cancelled');
CREATE TYPE gift_card_delivery AS ENUM ('email', 'whatsapp', 'sms');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded');
CREATE TYPE payment_method AS ENUM ('card', 'mobile_money', 'bank_transfer', 'cash', 'gift_card');
CREATE TYPE mobile_money_provider AS ENUM ('airtel_money', 'mpesa', 'tnm_mpamba', 'orange_money', 'mtn_mobile_money', 'vodacom_mpesa');
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');
CREATE TYPE notification_channel AS ENUM ('in_app', 'push', 'email', 'sms', 'whatsapp');
CREATE TYPE currency_code AS ENUM ('MWK', 'ZAR', 'KES', 'TZS', 'UGX', 'RWF', 'USD', 'EUR');

-- ============================================================================
-- 2. USERS
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'user',
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  phone_country_code TEXT DEFAULT '+265',
  email TEXT,
  country TEXT DEFAULT 'Malawi',
  city TEXT,
  preferred_currency currency_code DEFAULT 'MWK',
  preferred_language TEXT DEFAULT 'en',
  is_onboarded BOOLEAN DEFAULT false,
  marketing_consent BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_country ON users(country);
CREATE INDEX idx_users_city ON users(city);
CREATE INDEX idx_users_created ON users(created_at DESC);

-- ============================================================================
-- 3. PARTNERS
-- ============================================================================

CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_description TEXT,
  business_logo TEXT,
  business_cover TEXT,
  business_email TEXT,
  business_phone TEXT,
  business_website TEXT,
  partner_type TEXT NOT NULL CHECK (partner_type IN ('hotel', 'restaurant', 'spa', 'resort', 'activity_provider', 'venue', 'individual')),
  categories TEXT[] DEFAULT '{}'::text[],
  countries TEXT[] DEFAULT ARRAY['Malawi'],
  cities TEXT[] DEFAULT '{}'::text[],
  currencies currency_code[] DEFAULT ARRAY['MWK'],
  verification_status partner_verification_status DEFAULT 'unverified',
  verification_document_url TEXT,
  verification_notes TEXT,
  verified_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT false,
  commission_rate NUMERIC(4,2) DEFAULT 10.00,
  commission_type TEXT DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
  payout_method TEXT,
  payout_details JSONB DEFAULT '{}'::jsonb,
  payout_schedule TEXT DEFAULT 'bi_weekly' CHECK (payout_schedule IN ('weekly', 'bi_weekly', 'monthly')),
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  total_revenue BIGINT DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_partners_verification ON partners(verification_status);
CREATE INDEX idx_partners_active ON partners(is_active) WHERE is_active = true;
CREATE INDEX idx_partners_type ON partners(partner_type);
CREATE INDEX idx_partners_countries ON partners USING GIN(countries);
CREATE INDEX idx_partners_cities ON partners USING GIN(cities);
CREATE INDEX idx_partners_rating ON partners(average_rating DESC);
CREATE INDEX idx_partners_featured ON partners(is_featured) WHERE is_featured = true;

-- ============================================================================
-- 4. CITIES (Africa-focused lookup)
-- ============================================================================

CREATE TABLE cities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  country_code TEXT NOT NULL,
  region TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  timezone TEXT,
  currency currency_code DEFAULT 'MWK',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, country)
);

CREATE INDEX idx_cities_country ON cities(country);
CREATE INDEX idx_cities_active ON cities(is_active) WHERE is_active = true;
CREATE INDEX idx_cities_location ON cities(latitude, longitude);

-- ============================================================================
-- 5. VENUES
-- ============================================================================

CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  venue_type TEXT CHECK (venue_type IN ('restaurant', 'hotel', 'spa', 'resort', 'outdoor', 'studio', 'rooftop', 'lounge', 'beach', 'pool', 'other')),
  address TEXT,
  city_id INTEGER REFERENCES cities(id),
  city TEXT NOT NULL,
  country TEXT DEFAULT 'Malawi',
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  phone TEXT,
  email TEXT,
  website TEXT,
  images TEXT[] DEFAULT '{}'::text[],
  amenities TEXT[] DEFAULT '{}'::text[],
  capacity INTEGER,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_venues_partner ON venues(partner_id);
CREATE INDEX idx_venues_city ON venues(city);
CREATE INDEX idx_venues_active ON venues(is_active) WHERE is_active = true;
CREATE INDEX idx_venues_location ON venues(latitude, longitude);
CREATE INDEX idx_venues_type ON venues(venue_type);

-- ============================================================================
-- 6. EXPERIENCE CATEGORIES
-- ============================================================================

CREATE TABLE experience_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  image_url TEXT,
  parent_id INTEGER REFERENCES experience_categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_categories_parent ON experience_categories(parent_id);
CREATE INDEX idx_categories_active ON experience_categories(is_active) WHERE is_active = true;

-- ============================================================================
-- 7. EXPERIENCES
-- ============================================================================

CREATE TABLE experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT NOT NULL,
  short_description TEXT,
  category_id INTEGER REFERENCES experience_categories(id),
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}'::text[],
  moods TEXT[] DEFAULT '{}'::text[],
  price INTEGER NOT NULL CHECK (price >= 0),
  compare_at_price INTEGER CHECK (compare_at_price >= 0),
  currency currency_code DEFAULT 'MWK',
  location TEXT NOT NULL,
  city_id INTEGER REFERENCES cities(id),
  country TEXT DEFAULT 'Malawi',
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  duration TEXT NOT NULL,
  duration_minutes INTEGER,
  capacity INTEGER DEFAULT 1,
  max_guests INTEGER DEFAULT 10,
  min_guests INTEGER DEFAULT 1,
  includes TEXT[] DEFAULT '{}'::text[],
  what_to_bring TEXT[] DEFAULT '{}'::text[],
  requirements TEXT[] DEFAULT '{}'::text[],
  images TEXT[] DEFAULT '{}'::text[],
  status experience_status DEFAULT 'draft',
  featured BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  cancellation_policy TEXT DEFAULT 'flexible' CHECK (cancellation_policy IN ('flexible', 'moderate', 'strict', 'non_refundable')),
  rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  booking_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_experiences_partner ON experiences(partner_id);
CREATE INDEX idx_experiences_venue ON experiences(venue_id);
CREATE INDEX idx_experiences_status ON experiences(status);
CREATE INDEX idx_experiences_category ON experiences(category);
CREATE INDEX idx_experiences_featured ON experiences(featured) WHERE featured = true;
CREATE INDEX idx_experiences_rating ON experiences(rating DESC);
CREATE INDEX idx_experiences_price ON experiences(price);
CREATE INDEX idx_experiences_location ON experiences(location);
CREATE INDEX idx_experiences_country ON experiences(country);
CREATE INDEX idx_experiences_moods ON experiences USING GIN(moods);
CREATE INDEX idx_experiences_tags ON experiences USING GIN(tags);
CREATE INDEX idx_experiences_search ON experiences USING GIN(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(subtitle, '') || ' ' || coalesce(description, ''))
);
CREATE INDEX idx_experiences_geo ON experiences(latitude, longitude);
CREATE INDEX idx_experiences_created ON experiences(created_at DESC);

-- ============================================================================
-- 8. BOOKINGS
-- ============================================================================

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id),
  experience_id UUID NOT NULL REFERENCES experiences(id),
  venue_id UUID REFERENCES venues(id),
  status booking_status DEFAULT 'pending',
  booking_date DATE NOT NULL,
  booking_time TIME,
  guests_count INTEGER NOT NULL DEFAULT 1 CHECK (guests_count >= 1),
  total_price INTEGER NOT NULL CHECK (total_price >= 0),
  currency currency_code DEFAULT 'MWK',
  base_price INTEGER NOT NULL CHECK (base_price >= 0),
  service_fee INTEGER DEFAULT 0,
  discount_amount INTEGER DEFAULT 0,
  discount_code TEXT,
  partner_payout_amount INTEGER,
  commission_amount INTEGER,
  notes TEXT,
  special_requests TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  is_gift BOOLEAN DEFAULT false,
  gift_card_id UUID,
  source TEXT DEFAULT 'web' CHECK (source IN ('web', 'mobile', 'whatsapp', 'referral', 'partner_portal')),
  reschedule_count INTEGER DEFAULT 0,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  cancelled_by TEXT CHECK (cancelled_by IN ('user', 'partner', 'admin')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_experience ON bookings(experience_id);
CREATE INDEX idx_bookings_venue ON bookings(venue_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_created ON bookings(created_at DESC);
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX idx_bookings_partner ON bookings(experience_id);
CREATE INDEX idx_bookings_source ON bookings(source);

-- ============================================================================
-- 9. BOOKING GUESTS
-- ============================================================================

CREATE TABLE booking_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  age INTEGER,
  id_type TEXT CHECK (id_type IN ('passport', 'national_id', 'driver_license', 'none')),
  id_number TEXT,
  special_requirements TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_booking_guests_booking ON booking_guests(booking_id);
CREATE INDEX idx_booking_guests_email ON booking_guests(email);

-- ============================================================================
-- 10. GIFT CARDS
-- ============================================================================

CREATE TABLE gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  issuer_id UUID NOT NULL REFERENCES users(id),
  recipient_name TEXT NOT NULL,
  recipient_email TEXT,
  recipient_phone TEXT,
  sender_name TEXT NOT NULL,
  sender_message TEXT,
  amount INTEGER NOT NULL CHECK (amount > 0),
  balance INTEGER NOT NULL CHECK (balance >= 0),
  currency currency_code DEFAULT 'MWK',
  delivery_method gift_card_delivery DEFAULT 'email',
  delivery_contact TEXT,
  status gift_card_status DEFAULT 'active',
  occasion TEXT,
  design_template TEXT DEFAULT 'classic',
  expires_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_balance CHECK (balance <= amount)
);

CREATE INDEX idx_gift_cards_code ON gift_cards(code);
CREATE INDEX idx_gift_cards_issuer ON gift_cards(issuer_id);
CREATE INDEX idx_gift_cards_status ON gift_cards(status);
CREATE INDEX idx_gift_cards_recipient ON gift_cards(recipient_email);
CREATE INDEX idx_gift_cards_expiry ON gift_cards(expires_at);
CREATE INDEX idx_gift_cards_active ON gift_cards(id) WHERE status IN ('active', 'partially_redeemed');

-- ============================================================================
-- 11. GIFT REDEMPTIONS
-- ============================================================================

CREATE TABLE gift_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  redeemed_by UUID REFERENCES users(id),
  redeemed_by_email TEXT,
  amount INTEGER NOT NULL CHECK (amount > 0),
  balance_before INTEGER NOT NULL CHECK (balance_before >= 0),
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  redemption_type TEXT NOT NULL CHECK (redemption_type IN ('full', 'partial', 'refund')),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_balance_check CHECK (balance_after = balance_before - amount)
);

CREATE INDEX idx_gift_redemptions_card ON gift_redemptions(gift_card_id);
CREATE INDEX idx_gift_redemptions_booking ON gift_redemptions(booking_id);
CREATE INDEX idx_gift_redemptions_user ON gift_redemptions(redeemed_by);

-- ============================================================================
-- 12. SAVED EXPERIENCES
-- ============================================================================

CREATE TABLE saved_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, experience_id)
);

CREATE INDEX idx_saved_user ON saved_experiences(user_id);
CREATE INDEX idx_saved_experience ON saved_experiences(experience_id);
CREATE INDEX idx_saved_created ON saved_experiences(created_at DESC);

-- ============================================================================
-- 13. COLLECTIONS
-- ============================================================================

CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  is_private BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  icon TEXT DEFAULT '📁',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_collections_user ON collections(user_id);

CREATE TABLE collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(collection_id, experience_id)
);

CREATE INDEX idx_collection_items_collection ON collection_items(collection_id);
CREATE INDEX idx_collection_items_experience ON collection_items(experience_id);

-- ============================================================================
-- 14. REVIEWS
-- ============================================================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT,
  images TEXT[] DEFAULT '{}'::text[],
  is_verified BOOLEAN DEFAULT false,
  is_anonymous BOOLEAN DEFAULT false,
  status review_status DEFAULT 'pending',
  helpful_count INTEGER DEFAULT 0,
  partner_response TEXT,
  partner_responded_at TIMESTAMPTZ,
  flagged_reason TEXT,
  moderated_by UUID REFERENCES users(id),
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(booking_id, user_id)
);

CREATE INDEX idx_reviews_experience ON reviews(experience_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_booking ON reviews(booking_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created ON reviews(created_at DESC);
CREATE INDEX idx_reviews_verified ON reviews(is_verified) WHERE is_verified = true;

-- ============================================================================
-- 15. PAYMENTS
-- ============================================================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  gift_card_id UUID REFERENCES gift_cards(id),
  user_id UUID NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL CHECK (amount >= 0),
  currency currency_code DEFAULT 'MWK',
  amount_local INTEGER,
  currency_local currency_code,
  exchange_rate NUMERIC(10,6),
  method payment_method NOT NULL,
  mobile_provider mobile_money_provider,
  mobile_number TEXT,
  provider TEXT,
  provider_reference TEXT,
  provider_status TEXT,
  status payment_status DEFAULT 'pending',
  fee_amount INTEGER DEFAULT 0,
  net_amount INTEGER,
  refunded_amount INTEGER DEFAULT 0,
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_gift_card ON payments(gift_card_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_method ON payments(method);
CREATE INDEX idx_payments_provider_ref ON payments(provider_reference);
CREATE INDEX idx_payments_created ON payments(created_at DESC);
CREATE INDEX idx_payments_provider ON payments(provider);

-- ============================================================================
-- 16. NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel notification_channel DEFAULT 'in_app',
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  action_url TEXT,
  image_url TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_channel ON notifications(channel);

CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  push_bookings BOOLEAN DEFAULT true,
  push_promotions BOOLEAN DEFAULT false,
  push_reviews BOOLEAN DEFAULT true,
  push_expiring BOOLEAN DEFAULT true,
  email_bookings BOOLEAN DEFAULT true,
  email_promotions BOOLEAN DEFAULT false,
  email_reviews BOOLEAN DEFAULT true,
  email_weekly_digest BOOLEAN DEFAULT true,
  sms_bookings BOOLEAN DEFAULT true,
  sms_promotions BOOLEAN DEFAULT false,
  whatsapp_bookings BOOLEAN DEFAULT true,
  whatsapp_promotions BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 17. ANALYTICS EVENTS
-- ============================================================================

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  session_id TEXT,
  page TEXT,
  referrer TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  device_type TEXT,
  device_os TEXT,
  browser TEXT,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  load_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_country ON analytics_events(country);
CREATE INDEX idx_analytics_events_page ON analytics_events(page);
CREATE INDEX idx_analytics_events_date ON analytics_events((created_at::date));
CREATE INDEX idx_analytics_events_utm ON analytics_events(utm_source, utm_medium);

-- Daily aggregate analytics
CREATE TABLE analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  metric_name TEXT NOT NULL,
  metric_value INTEGER NOT NULL DEFAULT 0,
  dimension TEXT,
  dimension_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, metric_name, dimension, dimension_value)
);

CREATE INDEX idx_analytics_daily_date ON analytics_daily(date);
CREATE INDEX idx_analytics_daily_metric ON analytics_daily(metric_name);

-- ============================================================================
-- SEED DATA: Cities across Africa
-- ============================================================================

INSERT INTO cities (name, country, country_code, region, currency, sort_order) VALUES
  ('Lilongwe', 'Malawi', 'MW', 'Central Region', 'MWK', 1),
  ('Blantyre', 'Malawi', 'MW', 'Southern Region', 'MWK', 2),
  ('Mzuzu', 'Malawi', 'MW', 'Northern Region', 'MWK', 3),
  ('Cape Maclear', 'Malawi', 'MW', 'Southern Region', 'MWK', 4),
  ('Salima', 'Malawi', 'MW', 'Central Region', 'MWK', 5),
  ('Mangochi', 'Malawi', 'MW', 'Southern Region', 'MWK', 6),
  ('Zomba', 'Malawi', 'MW', 'Southern Region', 'MWK', 7),
  ('Nkhata Bay', 'Malawi', 'MW', 'Northern Region', 'MWK', 8),
  ('Dedza', 'Malawi', 'MW', 'Central Region', 'MWK', 9),
  ('Liwonde', 'Malawi', 'MW', 'Southern Region', 'MWK', 10),
  ('Johannesburg', 'South Africa', 'ZA', 'Gauteng', 'ZAR', 11),
  ('Cape Town', 'South Africa', 'ZA', 'Western Cape', 'ZAR', 12),
  ('Nairobi', 'Kenya', 'KE', 'Nairobi County', 'KES', 13),
  ('Dar es Salaam', 'Tanzania', 'TZ', 'Dar es Salaam', 'TZS', 14),
  ('Kampala', 'Uganda', 'UG', 'Central Region', 'UGX', 15),
  ('Kigali', 'Rwanda', 'RW', 'Kigali City', 'RWF', 16),
  ('Lusaka', 'Zambia', 'ZM', 'Lusaka Province', 'ZMW', 17),
  ('Harare', 'Zimbabwe', 'ZW', 'Harare Province', 'USD', 18),
  ('Gaborone', 'Botswana', 'BW', 'South-East District', 'BWP', 19),
  ('Maputo', 'Mozambique', 'MZ', 'Maputo City', 'MZN', 20);

-- Seed data: Experience Categories
INSERT INTO experience_categories (name, slug, description, icon, sort_order) VALUES
  ('Dining', 'dining', 'Curated culinary experiences', '🍽️', 1),
  ('Wellness', 'wellness', 'Relaxation and self-care', '🧘', 2),
  ('Day Out', 'day-out', 'Perfect daytime activities', '☀️', 3),
  ('Nightlife', 'nightlife', 'Evening entertainment', '🌙', 4),
  ('Adventure', 'adventure', 'Thrilling experiences', '🏔️', 5),
  ('Overnight', 'overnight', 'Getaways and staycations', '🌴', 6),
  ('Events', 'events', 'Celebrations and gatherings', '🎉', 7),
  ('Workshops', 'workshops', 'Learn something new', '📚', 8),
  ('Luxury', 'luxury', 'Premium exclusive experiences', '💎', 9);
