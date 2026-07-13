// ─── Experio Wallet Engine ───
// Core business logic for the closed-loop stored-value wallet system.
// All currency amounts are in the smallest unit (MWK = 1 MWK).

import { createAdminClient } from "./supabase-admin";
import { createServerClient } from "./supabase-server";

// ─── Types ───

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  status: "active" | "frozen" | "suspended" | "closed";
  kycLevel: "unverified" | "basic" | "full";
  dailyLimit: number;
  monthlyLimit: number;
  dailyUsed: number;
  monthlyUsed: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  type:
    | "deposit"
    | "withdrawal"
    | "payment"
    | "refund"
    | "transfer_in"
    | "transfer_out"
    | "cashback"
    | "bonus"
    | "fee"
    | "adjustment"
    | "gift_card_redemption";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  paymentId: string | null;
  createdAt: string;
}

export interface WalletTransfer {
  id: string;
  senderWalletId: string;
  recipientWalletId: string;
  amount: number;
  fee: number;
  note: string | null;
  status: "pending" | "completed" | "failed" | "cancelled";
  createdAt: string;
  completedAt: string | null;
}

export interface WalletSummary {
  balance: number;
  currency: string;
  status: string;
  kycLevel: string;
  dailyUsed: number;
  monthlyUsed: number;
  dailyLimit: number;
  monthlyLimit: number;
  pendingTransactions: number;
  transactionCount30d: number;
}

// ─── Helpers ───

function mapWallet(row: Record<string, unknown>): Wallet {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    balance: Number(row.balance),
    currency: String(row.currency || "MWK"),
    status: String(row.status) as Wallet["status"],
    kycLevel: String(row.kyc_level) as Wallet["kycLevel"],
    dailyLimit: Number(row.daily_limit),
    monthlyLimit: Number(row.monthly_limit),
    dailyUsed: Number(row.daily_used),
    monthlyUsed: Number(row.monthly_used),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapTransaction(row: Record<string, unknown>): WalletTransaction {
  return {
    id: String(row.id),
    walletId: String(row.wallet_id),
    userId: String(row.user_id),
    type: String(row.type) as WalletTransaction["type"],
    amount: Number(row.amount),
    balanceBefore: Number(row.balance_before),
    balanceAfter: Number(row.balance_after),
    currency: String(row.currency || "MWK"),
    description: row.description ? String(row.description) : null,
    referenceType: row.reference_type ? String(row.reference_type) : null,
    referenceId: row.reference_id ? String(row.reference_id) : null,
    paymentId: row.payment_id ? String(row.payment_id) : null,
    createdAt: String(row.created_at),
  };
}

// ─── Core Wallet Operations ───

/**
 * Get or create a wallet for a user.
 * Auto-creates if it doesn't exist (for backward compatibility with users
 * created before the wallet migration).
 */
export async function getOrCreateWallet(userId: string): Promise<Wallet | null> {
  const admin = createAdminClient();

  // Try to get existing wallet
  const { data: existing } = await admin
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return mapWallet(existing);

  // Auto-create
  const { data: created, error } = await admin
    .from("wallets")
    .insert({
      user_id: userId,
      balance: 0,
      currency: "MWK",
      status: "active",
      daily_limit: 500000,
      monthly_limit: 5000000,
    })
    .select()
    .single();

  if (error || !created) {
    console.error("Failed to auto-create wallet:", error);
    return null;
  }

  return mapWallet(created);
}

/**
 * Get wallet by user ID (no auto-create).
 */
export async function getWallet(userId: string): Promise<Wallet | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return data ? mapWallet(data) : null;
}

/**
 * Get wallet summary for the wallet UI dashboard.
 */
export async function getWalletSummary(userId: string): Promise<WalletSummary | null> {
  const wallet = await getOrCreateWallet(userId);
  if (!wallet) return null;

  const admin = createAdminClient();

  // Count pending transactions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count: pendingCount } = await admin
    .from("wallet_transactions")
    .select("*", { count: "exact", head: true })
    .eq("wallet_id", wallet.id)
    .is("reference_id", null);

  const { count: txCount30d } = await admin
    .from("wallet_transactions")
    .select("*", { count: "exact", head: true })
    .eq("wallet_id", wallet.id)
    .gte("created_at", thirtyDaysAgo.toISOString());

  return {
    balance: wallet.balance,
    currency: wallet.currency,
    status: wallet.status,
    kycLevel: wallet.kycLevel,
    dailyUsed: wallet.dailyUsed,
    monthlyUsed: wallet.monthlyUsed,
    dailyLimit: wallet.dailyLimit,
    monthlyLimit: wallet.monthlyLimit,
    pendingTransactions: pendingCount ?? 0,
    transactionCount30d: txCount30d ?? 0,
  };
}

/**
 * Get wallet transactions with pagination.
 */
export async function getWalletTransactions(
  userId: string,
  options: { limit?: number; offset?: number; type?: string } = {}
): Promise<{ transactions: WalletTransaction[]; total: number }> {
  const wallet = await getOrCreateWallet(userId);
  if (!wallet) return { transactions: [], total: 0 };

  const admin = createAdminClient();
  const limit = Math.min(50, Math.max(1, options.limit ?? 20));
  const offset = Math.max(0, options.offset ?? 0);

  let query = admin
    .from("wallet_transactions")
    .select("*", { count: "exact" })
    .eq("wallet_id", wallet.id);

  if (options.type) {
    query = query.eq("type", options.type);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Failed to fetch wallet transactions:", error);
    return { transactions: [], total: 0 };
  }

  return {
    transactions: (data || []).map(mapTransaction),
    total: count ?? 0,
  };
}

/**
 * Deposit funds into wallet (from external payment).
 * Called AFTER payment confirmation via PayChangu webhook.
 */
export async function depositToWallet(
  userId: string,
  amount: number,
  options: {
    description?: string;
    paymentId?: string;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<{ success: boolean; newBalance: number } | { error: string }> {
  if (amount <= 0) return { error: "Amount must be positive" };

  const admin = createAdminClient();
  const wallet = await getOrCreateWallet(userId);
  if (!wallet) return { error: "Wallet not found" };
  if (wallet.status !== "active") return { error: "Wallet is not active" };

  const balanceBefore = wallet.balance;
  const balanceAfter = balanceBefore + amount;

  // Use a Supabase transaction (via RPC) to atomically update balance and insert tx
  // Fallback: manual two-step with application-level atomicity
  const { data: updated, error: updateError } = await admin
    .from("wallets")
    .update({
      balance: balanceAfter,
      updated_at: new Date().toISOString(),
    })
    .eq("id", wallet.id)
    .eq("balance", balanceBefore) // optimistic lock
    .select()
    .single();

  if (updateError || !updated) {
    return { error: "Failed to update wallet balance. Concurrent modification?" };
  }

  const { error: txError } = await admin
    .from("wallet_transactions")
    .insert({
      wallet_id: wallet.id,
      user_id: userId,
      type: "deposit",
      amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      description: options.description || "Wallet deposit",
      reference_type: "deposit",
      payment_id: options.paymentId || null,
      metadata: options.metadata || {},
    });

  if (txError) {
    console.error("Failed to record wallet transaction (balance already updated):", txError);
    // Balance is already updated; log the inconsistency
  }

  return { success: true, newBalance: balanceAfter };
}

/**
 * Pay from wallet (spend funds).
 * Used for booking payments, gift card purchases, etc.
 */
export async function payFromWallet(
  userId: string,
  amount: number,
  options: {
    description?: string;
    referenceType?: string;
    referenceId?: string;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<{ success: boolean; newBalance: number } | { error: string }> {
  if (amount <= 0) return { error: "Amount must be positive" };

  const admin = createAdminClient();
  const wallet = await getOrCreateWallet(userId);
  if (!wallet) return { error: "Wallet not found" };
  if (wallet.status !== "active") return { error: "Wallet is not active" };
  if (wallet.balance < amount) return { error: "Insufficient balance" };

  // Check daily/monthly limits
  const newDailyUsed = wallet.dailyUsed + amount;
  const newMonthlyUsed = wallet.monthlyUsed + amount;
  if (newDailyUsed > wallet.dailyLimit) return { error: "Daily spending limit exceeded" };
  if (newMonthlyUsed > wallet.monthlyLimit) return { error: "Monthly spending limit exceeded" };

  const balanceBefore = wallet.balance;
  const balanceAfter = balanceBefore - amount;

  const { data: updated, error: updateError } = await admin
    .from("wallets")
    .update({
      balance: balanceAfter,
      daily_used: newDailyUsed,
      monthly_used: newMonthlyUsed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", wallet.id)
    .eq("balance", balanceBefore)
    .select()
    .single();

  if (updateError || !updated) {
    return { error: "Failed to update wallet balance" };
  }

  const { error: txError } = await admin
    .from("wallet_transactions")
    .insert({
      wallet_id: wallet.id,
      user_id: userId,
      type: "payment",
      amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      description: options.description || "Wallet payment",
      reference_type: options.referenceType || null,
      reference_id: options.referenceId || null,
      metadata: options.metadata || {},
    });

  if (txError) {
    console.error("Failed to record wallet transaction:", txError);
  }

  return { success: true, newBalance: balanceAfter };
}

/**
 * Refund to wallet (reverse a payment).
 */
export async function refundToWallet(
  userId: string,
  amount: number,
  options: {
    description?: string;
    referenceType?: string;
    referenceId?: string;
    paymentId?: string;
  } = {}
): Promise<{ success: boolean; newBalance: number } | { error: string }> {
  if (amount <= 0) return { error: "Amount must be positive" };

  const admin = createAdminClient();
  const wallet = await getOrCreateWallet(userId);
  if (!wallet) return { error: "Wallet not found" };
  if (wallet.status !== "active") return { error: "Wallet is not active" };

  const balanceBefore = wallet.balance;
  const balanceAfter = balanceBefore + amount;

  const { data: updated, error: updateError } = await admin
    .from("wallets")
    .update({
      balance: balanceAfter,
      updated_at: new Date().toISOString(),
    })
    .eq("id", wallet.id)
    .eq("balance", balanceBefore)
    .select()
    .single();

  if (updateError || !updated) {
    return { error: "Failed to update wallet balance" };
  }

  const { error: txError } = await admin
    .from("wallet_transactions")
    .insert({
      wallet_id: wallet.id,
      user_id: userId,
      type: "refund",
      amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      description: options.description || "Wallet refund",
      reference_type: options.referenceType || null,
      reference_id: options.referenceId || null,
      payment_id: options.paymentId || null,
    });

  if (txError) console.error("Failed to record refund transaction:", txError);

  return { success: true, newBalance: balanceAfter };
}

/**
 * Transfer between wallets (peer-to-peer).
 */
export async function transferBetweenWallets(
  senderUserId: string,
  recipientUserId: string,
  amount: number,
  note?: string,
  fee?: number
): Promise<{ success: boolean; transferId?: string } | { error: string }> {
  if (amount <= 0) return { error: "Amount must be positive" };
  if (senderUserId === recipientUserId) return { error: "Cannot transfer to yourself" };

  const transferFee = fee ?? 0;
  const totalDeduction = amount + transferFee;

  const admin = createAdminClient();

  // Get sender wallet
  const senderWallet = await getOrCreateWallet(senderUserId);
  if (!senderWallet) return { error: "Sender wallet not found" };
  if (senderWallet.status !== "active") return { error: "Sender wallet is not active" };
  if (senderWallet.balance < totalDeduction) return { error: "Insufficient balance" };

  // Get recipient wallet
  const recipientWallet = await getOrCreateWallet(recipientUserId);
  if (!recipientWallet) return { error: "Recipient wallet not found" };
  if (recipientWallet.status !== "active") return { error: "Recipient wallet is not active" };

  // Deduct from sender
  const senderBalanceBefore = senderWallet.balance;
  const senderBalanceAfter = senderBalanceBefore - totalDeduction;

  const { error: senderError } = await admin
    .from("wallets")
    .update({
      balance: senderBalanceAfter,
      updated_at: new Date().toISOString(),
    })
    .eq("id", senderWallet.id)
    .eq("balance", senderBalanceBefore);

  if (senderError) return { error: "Failed to debit sender wallet" };

  // Credit recipient
  const recipientBalanceBefore = recipientWallet.balance;
  const recipientBalanceAfter = recipientBalanceBefore + amount;

  const { error: recipientError } = await admin
    .from("wallets")
    .update({
      balance: recipientBalanceAfter,
      updated_at: new Date().toISOString(),
    })
    .eq("id", recipientWallet.id)
    .eq("balance", recipientBalanceBefore);

  if (recipientError) {
    // Rollback sender
    await admin.from("wallets").update({
      balance: senderBalanceBefore,
      updated_at: new Date().toISOString(),
    }).eq("id", senderWallet.id);
    return { error: "Failed to credit recipient wallet. Transaction reversed." };
  }

  // Record sender transaction
  await admin.from("wallet_transactions").insert({
    wallet_id: senderWallet.id,
    user_id: senderUserId,
    type: "transfer_out",
    amount: totalDeduction,
    balance_before: senderBalanceBefore,
    balance_after: senderBalanceAfter,
    description: note ? `Transfer to user: ${note}` : "Transfer to another user",
    reference_type: "transfer",
  });

  // Record recipient transaction
  const { data: recipientTx } = await admin
    .from("wallet_transactions")
    .insert({
      wallet_id: recipientWallet.id,
      user_id: recipientUserId,
      type: "transfer_in",
      amount,
      balance_before: recipientBalanceBefore,
      balance_after: recipientBalanceAfter,
      description: note ? `Transfer from user: ${note}` : "Transfer from another user",
      reference_type: "transfer",
    })
    .select("id")
    .single();

  return { success: true, transferId: recipientTx?.id || undefined };
}

/**
 * Allocate cashback to wallet (from loyalty cashback).
 */
export async function creditCashback(
  userId: string,
  amount: number,
  bookingId?: string
): Promise<{ success: boolean } | { error: string }> {
  return depositToWallet(userId, amount, {
    description: "Cashback reward from booking",
    metadata: { cashback: true, booking_id: bookingId },
  });
}

/**
 * Check if user has sufficient wallet balance for an amount.
 */
export async function hasSufficientBalance(
  userId: string,
  amount: number
): Promise<boolean> {
  const wallet = await getWallet(userId);
  if (!wallet) return false;
  if (wallet.status !== "active") return false;
  return wallet.balance >= amount;
}

/**
 * Freeze/unfreeze a wallet.
 */
export async function setWalletStatus(
  userId: string,
  status: Wallet["status"],
  adminUserId: string
): Promise<{ success: boolean } | { error: string }> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("wallets")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) return { error: error.message };
  return { success: true };
}

/**
 * Get all wallets (admin only).
 */
export async function getAllWallets(options: {
  limit?: number;
  offset?: number;
  status?: string;
  minBalance?: number;
} = {}): Promise<{ wallets: Wallet[]; total: number }> {
  const admin = createAdminClient();
  const limit = Math.min(50, Math.max(1, options.limit ?? 20));
  const offset = Math.max(0, options.offset ?? 0);

  let query = admin.from("wallets").select("*", { count: "exact" });

  if (options.status) query = query.eq("status", options.status);
  if (options.minBalance) query = query.gte("balance", options.minBalance);

  const { data, count, error } = await query
    .order("balance", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return { wallets: [], total: 0 };
  return {
    wallets: (data || []).map(mapWallet),
    total: count ?? 0,
  };
}

// ─── Admin Adjustments ───

/**
 * Admin adjustment to wallet balance (add or deduct).
 */
export async function adminAdjustBalance(
  userId: string,
  amount: number, // positive = credit, negative = debit
  reason: string,
  adminUserId: string
): Promise<{ success: boolean; newBalance: number } | { error: string }> {
  if (amount === 0) return { error: "Adjustment amount cannot be zero" };

  const admin = createAdminClient();
  const wallet = await getWallet(userId);
  if (!wallet) return { error: "Wallet not found" };

  const balanceBefore = wallet.balance;
  const balanceAfter = balanceBefore + amount;
  if (balanceAfter < 0) return { error: "Adjustment would result in negative balance" };

  const { error: updateError } = await admin
    .from("wallets")
    .update({
      balance: balanceAfter,
      updated_at: new Date().toISOString(),
    })
    .eq("id", wallet.id);

  if (updateError) return { error: updateError.message };

  await admin.from("wallet_transactions").insert({
    wallet_id: wallet.id,
    user_id: userId,
    type: "adjustment",
    amount: Math.abs(amount),
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    description: `Admin ${amount > 0 ? "credit" : "debit"}: ${reason}`,
    reference_type: "adjustment",
    metadata: { admin_user_id: adminUserId },
  });

  return { success: true, newBalance: balanceAfter };
}
