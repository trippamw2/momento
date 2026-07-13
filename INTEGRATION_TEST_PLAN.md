# Experio Wallet + Gift Cards + Loyalty — Integration Test Plan

## System Architecture Overview

```
User ──► PayChangu ──► Webhook ──► depositToWallet() ──► Wallet Balance
  │                                                                    
  ├──► POST /api/bookings (pay_with_wallet) ──► Booking created (pending) ──► payFromWallet() ──► Booking confirmed
  │         gift_card_code ──► Gift card deducted ──► Payment record created
  │                                                                         
  ├──► POST /api/gift-cards (pay_with_wallet) ──► Gift card created ──► payFromWallet() ──► Sent notification
  │                                                                         
  ├──► POST /api/wallet/transfer ──► transferBetweenWallets() ──► Notifications to both parties
  │                                                                         
  ├──► Booking completed ──► earn_booking_points() trigger ──► Points + Tier upgrade + Cashback + Badge
  │                                                                         
  └──► POST /api/gift-cards/transfer ──► 7-day pending ──► Recipient accepts ──► Ownership transferred
```

---

## End-to-End Flow Tests

### Flow 1: Wallet Deposit (PayChangu)
```
User clicks "Top Up" ──► POST /api/wallet/deposit {amount, redirect_url}
  └── PayChangu creates checkout ──► User pays via mobile money
      └── Webhook: POST /api/payments/paychangu-webhook
          ├── payment.metadata.type === "wallet_deposit"
          ├── depositToWallet(user_id, amount)
          │   ├── Wallet balance increased
          │   ├── wallet_transactions: type="deposit" record created
          │   └── Optimistic lock (balance check) prevents race conditions
          ├── wallet_topup badge awarded (first deposit only)
          └── Notification: type="wallet_deposit" created
```

**Test assertions:**
- [ ] Wallet balance increases by exact amount
- [ ] `wallet_transactions` has a `deposit` record with correct balance_before/balance_after
- [ ] Optimistic lock rejects concurrent modifications
- [ ] Notification created with type `wallet_deposit`
- [ ] `user_badges` has `wallet_topup` badge (first time)
- [ ] Payment record updated to `succeeded`

---

### Flow 2: Booking with Wallet Payment
```
POST /api/bookings {experience_id, guests_count, total_price, pay_with_wallet: true}
  ├── 1. Validate experience exists, published, max_guests
  ├── 2. Validate wallet balance BEFORE booking creation
  ├── 3. CREATE booking (status="pending")  ← FIXED: was creating after payment
  ├── 4. payFromWallet(user_id, amount)
  │   ├── Wallet balance deducted
  │   ├── daily_used/monthly_used incremented
  │   ├── wallet_transactions: type="payment" recorded
  │   └── Limits checked
  ├── 5. UPDATE booking status → "confirmed"
  ├── 6. CREATE payment record (method="wallet", status="succeeded")
  ├── 7. increment_experience_booking_count RPC
  └── 8. Notification: type="booking_confirmed"  ← FIXED: was always "booking_pending"
```

**Test assertions:**
- [ ] Booking created with status "pending" first
- [ ] Wallet debited BEFORE booking status update
- [ ] If wallet payment fails → booking stays "payment_failed" (not lost money)
- [ ] Booking final status = "confirmed"
- [ ] Payment record exists with method="wallet", provider="experio_wallet"
- [ ] Wallet daily_used/monthly_used incremented
- [ ] Notification type = "booking_confirmed"

---

### Flow 3: Booking with Gift Card
```
POST /api/bookings {experience_id, guests_count, total_price, gift_card_code: "XPRO-XXXX-XXXX"}
  ├── 1. Validate gift card exists, active/partially_redeemed, sufficient balance
  ├── 2. CREATE booking (status="pending")
  ├── 3. Deduct gift card balance
  │   ├── If new_balance === 0 → status = "redeemed"
  │   └── If new_balance  > 0 → status = "partially_redeemed"
  ├── 4. CREATE payment record (method="gift_card")  ← NEW: was missing
  ├── 5. increment_experience_booking_count RPC
  └── 6. Notification: type="booking_pending"
```

**Test assertions:**
- [ ] Booking created with status "pending"
- [ ] Gift card balance deducted correctly
- [ ] Gift card status updated (redeemed vs partially_redeemed)
- [ ] Payment record exists with method="gift_card" ← NEW
- [ ] Payment record linked to gift_card_id ← NEW
- [ ] Insufficient balance → rejected with clear error + card_balance + experience_price

---

### Flow 4: Wallet-to-Wallet Transfer
```
POST /api/wallet/transfer {recipient_email, amount, note?}
  ├── 1. Resolve recipient by email in `users` table
  ├── 2. Validate sender != recipient
  ├── 3. transferBetweenWallets(sender_id, recipient_id, amount, note)
  │   ├── Sender wallet deducted (optimistic lock)
  │   ├── Recipient wallet credited (optimistic lock)
  │   ├── Rollback sender if recipient fails
  │   ├── wallet_transactions: type="transfer_out" for sender
  │   └── wallet_transactions: type="transfer_in" for recipient
  ├── 4. Notification: type="wallet_transfer_out" for sender  ← NEW
  └── 5. Notification: type="wallet_transfer_in" for recipient  ← NEW
```

**Test assertions:**
- [ ] Sender balance decreased by amount
- [ ] Recipient balance increased by amount
- [ ] transfer_out + transfer_in transaction records created
- [ ] Rollback fires if recipient credit fails → sender restored
- [ ] Sender receives notification (type=wallet_transfer_out) ← NEW
- [ ] Recipient receives notification (type=wallet_transfer_in) ← NEW
- [ ] Self-transfer rejected
- [ ] Unknown email rejected with clear error

---

### Flow 5: Gift Card Purchase with Wallet
```
POST /api/gift-cards {amount, recipient_email, recipient_name, pay_with_wallet: true}
  ├── 1. Generate unique XPRO-XXXX-XXXX code
  ├── 2. CREATE gift card (status="active")
  ├── 3. CREATE gift_card_transaction (type="purchase")
  ├── 4. payFromWallet(user_id, amount)
  │   ├── If fails → gift card cancelled
  │   └── If succeeds → gift card sent_at set, payment record created
  └── 5. Notification: type="gift_card_purchased"
```

**Test assertions:**
- [ ] Gift card created with unique code
- [ ] Gift card code deduplication (retry on collision)
- [ ] Wallet debited correctly
- [ ] If wallet payment fails → gift card status = "cancelled"
- [ ] Payment record created with method="wallet", gift_card_id linked
- [ ] Notification created

---

### Flow 6: Gift Card Booking Payment (Post-Booking Completion)
```
Booking marked "completed" (by admin/partner)
  └── Trigger: earn_booking_points()
      ├── 1. Calculate base points (1 point per 100 MWK)
      ├── 2. Apply tier multiplier (bronze=1x, silver=1.2x, ..., vip=3x)
      ├── 3. Upsert loyalty_points (balance + lifetime + tier)
      ├── 4. INSERT loyalty_transaction (type="earn")
      ├── 5. Check & auto-upgrade tier
      │   └── If tier changes → Notification: type="tier_upgrade"  ← NEW
      ├── 6. Calculate cashback (based on tier rate)
      │   ├── INSERT cashback_transaction
      │   ├── UPDATE wallet balance += cashback amount
      │   ├── INSERT wallet_transaction (type="cashback")
      │   └── Notification: type="cashback_credited"  ← NEW
      ├── 7. Award first_booking badge (if first completed booking)  ← NEW
      │   └── Notification: type="badge_earned"  ← NEW
      └── 8. Notification: type="points_earned"  ← NEW
```

**Test assertions:**
- [ ] Points calculated as floor(price/100) × multiplier
- [ ] Lifetime points updated correctly
- [ ] Tier auto-upgrades when threshold crossed
- [ ] Tier upgrade notification created (if tier changed) ← NEW
- [ ] Cashback calculated at tier rate and credited to wallet
- [ ] Cashback wallet_transaction created with type="cashback"
- [ ] Cashback notification created ← NEW
- [ ] Points earned notification created ← NEW
- [ ] First completed booking → first_booking badge awarded ← NEW
- [ ] Badge notification created ← NEW

---

### Flow 7: Gift Card Transfer
```
POST /api/gift-cards/transfer {gift_card_id, to_email}
  ├── 1. Verify gift card owned by sender, not fully_redeemed/expired/cancelled
  ├── 2. Check no existing pending transfer
  ├── 3. Create gift_card_transfer (status="pending", 7-day expiry)
  └── 4. Notification: type="gift_card_transferred" for sender

Later, recipient:
POST /api/gift-cards/{id}/accept-transfer
  ├── 1. Verify transfer pending, not expired
  ├── 2. Verify recipient email matches
  ├── 3. UPDATE gift card: recipient_email, transfer_count++
  ├── 4. Mark transfer as "accepted"
  └── 5. Notifications to both parties
```

**Test assertions:**
- [ ] Transfer created with 7-day expiry
- [ ] Duplicate pending transfer rejected
- [ ] Self-transfer rejected
- [ ] Expired transfer rejected correctly
- [ ] Recipient validation (email must match)
- [ ] Gift card recipient_email updated after accept
- [ ] transfer_count incremented
- [ ] Both sender and recipient notified
- [ ] Already-redeemed/expired cards cannot be transferred

---

### Flow 8: Loyalty Profile
```
GET /api/loyalty
  ├── 1. Fetch loyalty_points (balance, lifetime_points, tier)
  ├── 2. Fetch all loyalty_tiers sorted by min_lifetime_points
  ├── 3. Calculate current tier, next tier, progress %
  ├── 4. Count user_badges
  ├── 5. Sum cashback_transactions (status="credited")
  └── Returns: {points, tier, tierProgress, nextTier, multiplier, cashbackRate, totalCashback, badgeCount, allTiers}
```

**Test assertions:**
- [ ] Returns correct points balance
- [ ] Tier calculated from lifetime_points against loyalty_tiers table
- [ ] Progress to next tier calculated correctly (percentage)
- [ ] Returns all tiers with full details
- [ ] Returns cashback total
- [ ] Returns badge count
- [ ] Works for users with no loyalty data yet (defaults to bronze)

---

### Flow 9: Corporate Account End-to-End
```
Company admin:
POST /api/corporate {company_name, company_email}
  ├── Account created (status="pending")
  └── Duplicate check (one account per admin)

Admin activates:
PATCH /api/admin/corporate/{id} {status: "active"}

Admin adds member:
POST /api/corporate/members {user_id, role, spending_limit}
  ├── Member added with role
  └── Verified against corporate account ownership

Admin credits corporate balance:
POST /api/admin/corporate/{id}/credit {amount, reason}
  └── Corporate balance increased

Member spends:
POST /api/corporate/spending {amount, category}
  ├── Verified member + active + spending limit
  ├── Deducted from corporate balance
  └── Record created (pending if above approval threshold)

List spending:
GET /api/corporate/spending?account_id=X
  └── Returns paginated records with user enrichment
```

**Test assertions:**
- [ ] Corporate account created with status "pending"
- [ ] Duplicate account per admin rejected
- [ ] Member added and linked to account
- [ ] Corporate balance credited correctly
- [ ] Member spending deducted from balance
- [ ] Spending limit enforced
- [ ] Approval threshold triggers "pending" status
- [ ] Non-members cannot spend
- [ ] Disabled members cannot spend
- [ ] Spending records returned with user details

---

### Flow 10: Notification Routing End-to-End
```
System creates notifications in DB with types:
  wallet_deposit, wallet_payment, wallet_transfer_in, wallet_transfer_out,
  wallet_low_balance, cashback_credited, badge_earned, gift_card_transferred,
  gift_card_expiring, corporate_allocation

GET /api/notifications?limit=50
  └── Returns raw DB records

Client: notifications-engine.ts
  ├── mapNotification() converts to AppNotification
  │   ├── type, title, description, time (relative), read status
  │   ├── actionLabel via deriveActionLabel(type)  ← FIXED: all types now handled
  │   └── actionHref via deriveActionHref(type, data)  ← FIXED: all types now handled
  └── getUnreadCount() counts unread
```

**Test assertions:**
- [ ] All wallet/loyalty types have `actionLabel` defined ← FIXED
- [ ] All wallet/loyalty types have `actionHref` defined ← FIXED
- [ ] Wallet notifications route to `/wallet` or `/wallet/top-up`
- [ ] Cashback notifications route to `/wallet`
- [ ] Badge notifications route to `/loyalty`
- [ ] Transfer notifications route to `/wallet`
- [ ] Corporate notifications route to `/corporate`
- [ ] Low balance notifications route to `/wallet/top-up`

---

## Bug Fix Verification

| # | Bug | Status | Verification |
|---|-----|--------|-------------|
| 1 | `corporate_spending` table missing | FIXED | Migration creates table with RLS + indexes |
| 2 | Wallet debited before booking creation | FIXED | Booking created first (pending), then wallet paid, then status updated |
| 3 | Booking notification always `booking_pending` | FIXED | Now uses `booking_confirmed` when wallet payment succeeds |
| 4 | No notifications for wallet transfers | FIXED | Sender + recipient both notified |
| 5 | No points/cashback/tier notifications in trigger | FIXED | All three notification types added to SQL trigger |
| 6 | UI notification handler missing wallet/loyalty types | FIXED | `deriveActionLabel` + `deriveActionHref` handle all 10 types |
| 7 | No badge awarding logic | FIXED | `first_booking` in trigger, `wallet_topup` in webhook |
| 8 | No payment record for gift card bookings | FIXED | Payment record created with method="gift_card" |
| 9 | Duplicate paychangu-wallet route | FIXED | Removed (dead code, no references) |

---

## Files Changed in This Session

### New Files
- `src/app/wallet/layout.tsx` — Wallet UI tab navigation
- `src/app/wallet/page.tsx` — Main wallet dashboard (balance, transactions, loyalty mini-card)
- `src/app/wallet/top-up/page.tsx` — Deposit UI with presets and custom amount
- `src/app/wallet/transfer/page.tsx` — Transfer UI with success state
- `src/app/wallet/loading.tsx` — Skeleton loading state
- `src/lib/wallet-engine.ts` — Core wallet business logic (655 lines)
- `src/lib/corporate-engine.ts` — Corporate account management (~415 lines)
- `src/app/api/wallet/route.ts` — Wallet summary endpoint
- `src/app/api/wallet/transactions/route.ts` — Transaction history endpoint
- `src/app/api/wallet/deposit/route.ts` — Deposit initiation endpoint
- `src/app/api/wallet/transfer/route.ts` — Transfer endpoint
- `src/app/api/admin/wallets/route.ts` — Admin wallet list + stats
- `src/app/api/admin/wallets/[userId]/route.ts` — Admin wallet management
- `src/app/api/corporate/route.ts` — Corporate account CRUD
- `src/app/api/corporate/members/route.ts` — Corporate member management
- `src/app/api/corporate/members/[memberId]/route.ts` — Individual member update
- `src/app/api/corporate/spending/route.ts` — Corporate spending records
- `supabase/migrations/20260710120000_wallet_and_loyalty_enhancements.sql` — Full migration (534 lines)
- `supabase/migrations/20260710130000_backfill_wallets.sql` — Backfill for existing users

### Modified Files
- `src/app/api/bookings/route.ts` — Fixed ordering bug, added gift card payment records, fixed notification type
- `src/app/api/gift-cards/route.ts` — Wallet payment support for gift card purchases
- `src/app/api/payments/paychangu-webhook/route.ts` — Wallet deposit handling + badge awarding
- `src/app/api/wallet/deposit/route.ts` — Cleaned up (removed unused import)
- `src/app/api/wallet/transfer/route.ts` — Transfer notification creation
- `src/lib/notifications-engine.ts` — All 10 wallet/loyalty types handled in UI
- `src/components/Navbar.tsx` — Wallet link added to navigation
- `supabase/migrations/20260710120000_wallet_and_loyalty_enhancements.sql` — Added corporate_spending table, loyalty/cashback/badge notifications in trigger

### Deleted Files
- `src/app/api/payments/paychangu-wallet/route.ts` — Duplicate of `/api/wallet/deposit`

---

## Prerequisites for Testing

1. **Supabase project** — Run migrations in order:
   ```
   1. supabase/schema_v2.sql
   2. supabase/rls_v2.sql
   3. supabase/migrations/*loyalty_triggers* (if exists)
   4. supabase/migrations/20260710120000_wallet_and_loyalty_enhancements.sql
   5. supabase/migrations/20260710130000_backfill_wallets.sql
   ```

2. **Environment variables:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   PAYCHANGU_SECRET_KEY=your_key  # optional, dev mode works without
   PAYCHANGU_API_URL=https://api.paychangu.com
   BREVO_API_KEY=your_key  # optional, notifications work without
   ```

3. **Test accounts:**
   - User A (admin): Can create bookings, has wallet
   - User B (regular): Receives transfers, has wallet
   - User C (corporate admin): Registers company
   - User D (corporate member): Spends from corporate account
