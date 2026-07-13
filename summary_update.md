## Goal
Design and implement a complete closed-loop Experio Wallet system with stored-value wallets, enhanced gift cards, and enhanced loyalty engine — usable only inside Experio (not Visa/Mastercard).

## Constraints & Preferences
- "The Experio Card is NOT a Visa or Mastercard. It is a closed-loop stored value wallet that can only be used inside Experio."
- Full scope: Wallet + Gift Cards + Loyalty all in one phase (user confirmed over phased approach)
- Gift card visual designs: "if user select a certain card it must be generated as it is and same color" — PNG/PDF/success card must match the selected variant
- All currency amounts in MWK smallest unit; wallet balances are integers
- Use existing Supabase + PayChangu + Brevo infrastructure

## Progress
### Done
- **Database migration** (`20260710120000_wallet_and_loyalty_enhancements.sql`): Created tables for wallets, wallet_transactions, gift_card_transfers, gift_card_designs, loyalty_tiers (with black+vip), user_badges, cashback_transactions, corporate_accounts, corporate_members, badge_definitions. Added columns to gift_cards (card_type, pin_code, qr_code, is_physical, transfer_count). Extended enums (payment_method: 'wallet', booking_status: 'partially_refunded'). Replaced handle_new_user to insert into users, profiles, wallets, notification_preferences, loyalty_points. Rewrote earn_booking_points trigger with proper tier multiplier and cashback crediting to wallet. Seeded 10 gift card designs and 22 badge definitions. Added RLS policies for all new tables.
- **Backfill migration** (`20260710130000_backfill_wallets.sql`): Creates wallets, loyalty_points, notification_preferences for existing users who lack them.
- **Wallet engine** (`src/lib/wallet-engine.ts`, 655 lines): Core business logic — getOrCreateWallet, getWallet, getWalletSummary, getWalletTransactions, depositToWallet, payFromWallet, refundToWallet, transferBetweenWallets, getAllWallets, adminAdjustBalance, setWalletStatus, creditCashback, hasSufficientBalance. Uses optimistic locking (balance check), supports daily/monthly limits, handles rollback on transfer failure.
- **Wallet API routes** (4 files):
  - `GET /api/wallet` — wallet summary (balance, limits, usage)
  - `GET /api/wallet/transactions` — paginated transaction history
  - `POST /api/wallet/deposit` — initiate PayChangu deposit (creates payment record, returns checkout_url; dev mode fallback)
  - `POST /api/wallet/transfer` — wallet-to-wallet transfer by recipient email
- **Enhanced gift card APIs** (4 files):
  - `POST /api/gift-cards/transfer` — initiate transfer with 7-day expiry
  - `GET /api/gift-cards/transfers` — list transfers for user
  - `POST /api/gift-cards/[id]/accept-transfer` — accept pending transfer, updates gift card owner
  - `GET /api/gift-cards/designs` — list active gift card designs
- **Enhanced loyalty APIs** (4 files):
  - `GET /api/loyalty` — full profile (points, tier, progress, cashback total, badge count, all tiers)
  - `GET /api/loyalty/tiers` — list all loyalty tiers
  - `GET /api/loyalty/badges` — user's earned badges
  - `GET /api/loyalty/cashback` — cashback transaction history
- **Updated bookings API** (`src/app/api/bookings/route.ts`): Added `pay_with_wallet` and `pay_with_split` support. Wallet payments set booking status to "confirmed" instantly and create wallet payment record.
- **Updated gift cards API** (`src/app/api/gift-cards/route.ts`): Added `pay_with_wallet` option. Creates gift card + processes wallet payment, cancels gift card on payment failure.
- **PayChangu webhook** (`src/app/api/payments/paychangu-webhook/route.ts`): Added CASE 2 for wallet_deposit metadata — calls depositToWallet, creates notification.
- **PayChangu wallet route** (`src/app/api/payments/paychangu-wallet/route.ts`): Initiates wallet top-up payment via PayChangu with proper metadata.
- **Notifications engine** (`src/lib/notifications-engine.ts`): Added 10 wallet/loyalty notification types (wallet_deposit, wallet_payment, wallet_transfer_in, wallet_transfer_out, wallet_low_balance, cashback_credited, badge_earned, gift_card_transferred, gift_card_expiring, corporate_allocation).
- **Wallet UI** (5 files):
  - `src/app/wallet/layout.tsx` — Tab navigation (Overview, Top Up, Transfer) with sticky header
  - `src/app/wallet/page.tsx` — Main wallet dashboard with balance card, usage bars, quick actions, transaction history, loyalty mini-card
  - `src/app/wallet/top-up/page.tsx` — Deposit page with amount presets (10k-500k MWK), custom amount input, PayChangu integration
  - `src/app/wallet/transfer/page.tsx` — Transfer page with email + amount form, success state, validation
  - `src/app/wallet/loading.tsx` — Skeleton loading state
- **Admin wallet APIs** (2 files):
  - `GET /api/admin/wallets` — List all wallets with user enrichment, aggregate stats (total balance, active/frozen counts)
  - `GET|PATCH /api/admin/wallets/[userId]` — View wallet details + transactions, freeze/unfreeze, adjust balance with reason
- **Corporate portal engine** (`src/lib/corporate-engine.ts`, ~400 lines): Corporate account CRUD, member management (add/remove/update), spending records (with approval threshold), balance allocation.
- **Corporate portal API routes** (4 files):
  - `GET|POST /api/corporate` — Register company account, view own/admin accounts
  - `GET|POST|DELETE /api/corporate/members` — Manage team members
  - `PATCH|DELETE /api/corporate/members/[memberId]` — Update/remove individual member
  - `GET|POST /api/corporate/spending` — Record and list corporate spending with member validation
- **Navigation integration**: Added "Wallet" link to Navbar.tsx — appears in both desktop nav bar and mobile hamburger menu, alongside Discover, Experiences, Gift, Saved, Memories
- **Bug fix**: Fixed `handle_new_user()` to also insert into `profiles` table (api-helpers.ts queries it)

### Blocked
- WhatsApp Business API delivery — blocked on user creating Meta app + generating token + phone ID
- Brevo email sending — blocked on user verifying `noreply@experio.life` sender domain in Brevo dashboard
- PayChangu end-to-end test — need user's test API keys or a live payment to validate webhook flow

## Key Decisions
- Build wallet + gift cards + loyalty as a unified system from the start (user confirmed "Full Wallet + Gift Cards + Loyalty")
- Wallet is pure closed-loop stored-value account (no Visa/Mastercard) — funds only spendable inside Experio
- Use optimistic locking (balance check on update) for wallet transactions instead of DB transactions
- Wallet auto-created for every user at registration (via handle_new_user trigger)
- New users get users + profiles + wallets + loyalty_points + notification_preferences all from one trigger
- Migration replaces the existing handle_new_user trigger and earn_booking_points trigger

## Relevant Files

### Core Library
- **src/lib/wallet-engine.ts** (655 lines): Core wallet business logic — all wallet operations
- **src/lib/corporate-engine.ts** (~400 lines): Corporate account management
- **src/lib/notifications-engine.ts**: Updated with wallet/loyalty notification types

### Database
- **supabase/migrations/20260710120000_wallet_and_loyalty_enhancements.sql** (503 lines): All new tables, triggers, RLS, seed data
- **supabase/migrations/20260710130000_backfill_wallets.sql**: Backfill for existing users

### API Routes — Wallet
- **src/app/api/wallet/route.ts**: GET wallet summary
- **src/app/api/wallet/transactions/route.ts**: GET wallet transactions
- **src/app/api/wallet/deposit/route.ts**: POST initiate deposit
- **src/app/api/wallet/transfer/route.ts**: POST wallet-to-wallet transfer

### API Routes — Gift Cards (enhanced)
- **src/app/api/gift-cards/transfer/route.ts**: POST initiate gift card transfer
- **src/app/api/gift-cards/transfers/route.ts**: GET list transfers
- **src/app/api/gift-cards/[id]/accept-transfer/route.ts**: POST accept transfer
- **src/app/api/gift-cards/designs/route.ts**: GET gift card designs
- **src/app/api/gift-cards/route.ts**: Updated with pay_with_wallet

### API Routes — Loyalty (enhanced)
- **src/app/api/loyalty/route.ts**: GET full loyalty profile
- **src/app/api/loyalty/tiers/route.ts**: GET all tiers
- **src/app/api/loyalty/badges/route.ts**: GET user badges
- **src/app/api/loyalty/cashback/route.ts**: GET cashback transactions

### API Routes — Payments
- **src/app/api/payments/paychangu-webhook/route.ts**: Updated with wallet deposit handling
- **src/app/api/payments/paychangu-wallet/route.ts**: Wallet deposit initiation
- **src/app/api/bookings/route.ts**: Updated with wallet payment flow

### API Routes — Admin
- **src/app/api/admin/wallets/route.ts**: List wallets + stats
- **src/app/api/admin/wallets/[userId]/route.ts**: View/manage individual wallet

### API Routes — Corporate
- **src/app/api/corporate/route.ts**: Register/list corporate accounts
- **src/app/api/corporate/members/route.ts**: Manage corporate members
- **src/app/api/corporate/members/[memberId]/route.ts**: Update/remove member
- **src/app/api/corporate/spending/route.ts**: Record/list corporate spending

### Wallet UI
- **src/app/wallet/layout.tsx**: Tab navigation layout
- **src/app/wallet/page.tsx**: Main wallet dashboard
- **src/app/wallet/top-up/page.tsx**: Top-up page
- **src/app/wallet/transfer/page.tsx**: Transfer page
- **src/app/wallet/loading.tsx**: Loading skeleton

### Navigation
- **src/components/Navbar.tsx**: Wallet link added to nav items

## Critical Context
- **Dual user table situation**: schema_v2.sql creates `users` table, api-helpers.ts queries `profiles` table — the migration handle_new_user now inserts into BOTH tables
- **Tier multiplier fix**: earn_booking_points function was bugged (squared points instead of multiplying by tier multiplier) — fixed by using separate `tier_multiplier` variable
- **Existing schema**: Already has users, profiles, bookings, payments (with paychangu), gift_cards, gift_card_transactions, loyalty_points, loyalty_history, loyalty_transactions, notifications, notification_preferences
- **PayChangu integration**: Webhook exists at `/api/payments/paychangu-webhook` — now handles booking payments, gift card payments, AND wallet deposits
- **Wallet funds flow**: Deposit via PayChangu → webhook → depositToWallet() → user can spend wallet at booking/gift card checkout
- **Cashback flow**: Booking completed → earn_booking_points trigger → cashback amount credited to wallet → wallet_transactions record created
- **Migration run order**: (1) schema_v2.sql → (2) RLS v2 → (3) loyalty triggers → (4) wallet migration → (5) backfill wallets
- **Tier names with 'vip'**: Migration includes both 'black' and 'vip' tiers — the earn_booking_points function handles both correctly
