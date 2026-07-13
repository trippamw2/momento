-- ============================================================================
-- MOMENTO — Backfill wallets and loyalty points for existing users
-- Run this AFTER the wallet migration to ensure all existing users have wallets
-- ============================================================================

-- 1. Create wallets for existing users who don't have one
INSERT INTO public.wallets (user_id, balance, currency, status)
SELECT 
  u.id,
  0,
  COALESCE(u.preferred_currency, 'MWK'),
  'active'
FROM public.users u
LEFT JOIN public.wallets w ON w.user_id = u.id
WHERE w.id IS NULL;

-- 2. Ensure loyalty_points for all users
INSERT INTO public.loyalty_points (user_id, balance, lifetime_points, tier)
SELECT 
  u.id,
  0,
  0,
  'bronze'
FROM public.users u
LEFT JOIN public.loyalty_points lp ON lp.user_id = u.id
WHERE lp.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 3. Ensure notification_preferences for all users
INSERT INTO public.notification_preferences (user_id)
SELECT u.id
FROM public.users u
LEFT JOIN public.notification_preferences np ON np.user_id = u.id
WHERE np.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 4. Create wallet transactions to backfill welcome bonus (for users who already have bookings)
-- Give 100 loyalty points to users who have completed bookings
UPDATE public.loyalty_points lp
SET 
  balance = GREATEST(lp.balance, 100),
  lifetime_points = GREATEST(lp.lifetime_points, 100),
  updated_at = now()
FROM public.users u
WHERE lp.user_id = u.id
  AND EXISTS (SELECT 1 FROM bookings b WHERE b.user_id = u.id AND b.status = 'completed')
  AND lp.balance = 0;
