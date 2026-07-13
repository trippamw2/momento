// ─── Experio Corporate Portal Engine ───
// Corporate accounts allow organizations to manage team spending,
// allocate budgets, and track usage across members.
//
// All currency amounts in MWK smallest unit (integers).

import { createAdminClient } from "./supabase-admin";

// ─── Types ───

export interface CorporateAccount {
  id: string;
  companyName: string;
  companyRegistration: string | null;
  companyEmail: string;
  companyPhone: string | null;
  companyAddress: string | null;
  adminId: string;
  creditLimit: number;
  balance: number;
  currency: string;
  status: "pending" | "active" | "suspended" | "closed";
  spendingLimitDaily: number;
  spendingLimitMonthly: number;
  requiresApproval: boolean;
  approvalThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface CorporateMember {
  id: string;
  corporateAccountId: string;
  userId: string;
  role: "admin" | "manager" | "member";
  spendingLimit: number;
  isActive: boolean;
  createdAt: string;
}

export interface CorporateSpendingRecord {
  id: string;
  corporateAccountId: string;
  memberId: string;
  userId: string;
  amount: number;
  category: string;
  description: string | null;
  status: "pending" | "approved" | "declined" | "reimbursed";
  approvedById: string | null;
  createdAt: string;
}

// ─── Helpers ───

function mapAccount(row: Record<string, unknown>): CorporateAccount {
  return {
    id: String(row.id),
    companyName: String(row.company_name),
    companyRegistration: row.company_registration ? String(row.company_registration) : null,
    companyEmail: String(row.company_email),
    companyPhone: row.company_phone ? String(row.company_phone) : null,
    companyAddress: row.company_address ? String(row.company_address) : null,
    adminId: String(row.admin_id),
    creditLimit: Number(row.credit_limit),
    balance: Number(row.balance),
    currency: String(row.currency || "MWK"),
    status: String(row.status) as CorporateAccount["status"],
    spendingLimitDaily: Number(row.spending_limit_daily),
    spendingLimitMonthly: Number(row.spending_limit_monthly),
    requiresApproval: Boolean(row.requires_approval),
    approvalThreshold: Number(row.approval_threshold),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapMember(row: Record<string, unknown>): CorporateMember {
  return {
    id: String(row.id),
    corporateAccountId: String(row.corporate_account_id),
    userId: String(row.user_id),
    role: String(row.role) as CorporateMember["role"],
    spendingLimit: Number(row.spending_limit),
    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at),
  };
}

// ─── Corporate Account Operations ───

/**
 * Create a new corporate account.
 */
export async function createCorporateAccount(data: {
  companyName: string;
  companyEmail: string;
  companyRegistration?: string;
  companyPhone?: string;
  companyAddress?: string;
  adminId: string;
  creditLimit?: number;
  spendingLimitDaily?: number;
  spendingLimitMonthly?: number;
  requiresApproval?: boolean;
  approvalThreshold?: number;
}): Promise<{ success: true; account: CorporateAccount } | { error: string }> {
  const admin = createAdminClient();

  const { data: account, error } = await admin
    .from("corporate_accounts")
    .insert({
      company_name: data.companyName,
      company_email: data.companyEmail,
      company_registration: data.companyRegistration || null,
      company_phone: data.companyPhone || null,
      company_address: data.companyAddress || null,
      admin_id: data.adminId,
      credit_limit: data.creditLimit || 0,
      spending_limit_daily: data.spendingLimitDaily || 0,
      spending_limit_monthly: data.spendingLimitMonthly || 0,
      requires_approval: data.requiresApproval ?? true,
      approval_threshold: data.approvalThreshold || 100000,
      status: "pending",
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { success: true, account: mapAccount(account) };
}

/**
 * Get corporate account by ID.
 */
export async function getCorporateAccount(id: string): Promise<CorporateAccount | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("corporate_accounts")
    .select("*")
    .eq("id", id)
    .single();
  return data ? mapAccount(data) : null;
}

/**
 * Get corporate account by admin user ID.
 */
export async function getCorporateAccountByAdmin(adminId: string): Promise<CorporateAccount | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("corporate_accounts")
    .select("*")
    .eq("admin_id", adminId)
    .maybeSingle();
  return data ? mapAccount(data) : null;
}

/**
 * List corporate accounts (admin use).
 */
export async function listCorporateAccounts(options: {
  limit?: number;
  offset?: number;
  status?: string;
} = {}): Promise<{ accounts: CorporateAccount[]; total: number }> {
  const admin = createAdminClient();
  const limit = Math.min(50, Math.max(1, options.limit ?? 20));
  const offset = Math.max(0, options.offset ?? 0);

  let query = admin.from("corporate_accounts").select("*", { count: "exact" });
  if (options.status) query = query.eq("status", options.status);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return { accounts: [], total: 0 };
  return {
    accounts: (data || []).map(mapAccount),
    total: count ?? 0,
  };
}

/**
 * Update corporate account status.
 */
export async function updateCorporateAccountStatus(
  id: string,
  status: CorporateAccount["status"],
  adminUserId: string
): Promise<{ success: true } | { error: string }> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("corporate_accounts")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  return { success: true };
}

/**
 * Top up corporate account balance (admin call, credits balance from central wallet).
 */
export async function creditCorporateAccount(
  id: string,
  amount: number,
  reason: string,
  adminUserId: string
): Promise<{ success: true; newBalance: number } | { error: string }> {
  if (amount <= 0) return { error: "Amount must be positive" };

  const admin = createAdminClient();
  const account = await getCorporateAccount(id);
  if (!account) return { error: "Corporate account not found" };

  const newBalance = account.balance + amount;

  const { error: updateError } = await admin
    .from("corporate_accounts")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) return { error: updateError.message };

  // Optionally record as a transaction in the corporate account
  return { success: true, newBalance };
}

// ─── Member Operations ───

/**
 * Add member to corporate account.
 */
export async function addCorporateMember(data: {
  corporateAccountId: string;
  userId: string;
  role?: CorporateMember["role"];
  spendingLimit?: number;
}): Promise<{ success: true; member: CorporateMember } | { error: string }> {
  const admin = createAdminClient();

  const { data: member, error } = await admin
    .from("corporate_members")
    .insert({
      corporate_account_id: data.corporateAccountId,
      user_id: data.userId,
      role: data.role || "member",
      spending_limit: data.spendingLimit || 0,
      is_active: true,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { success: true, member: mapMember(member) };
}

/**
 * Remove member from corporate account.
 */
export async function removeCorporateMember(memberId: string): Promise<{ success: true } | { error: string }> {
  const admin = createAdminClient();
  const { error } = await admin.from("corporate_members").delete().eq("id", memberId);
  if (error) return { error: error.message };
  return { success: true };
}

/**
 * Update member role or spending limit.
 */
export async function updateCorporateMember(
  memberId: string,
  updates: { role?: CorporateMember["role"]; spendingLimit?: number; isActive?: boolean }
): Promise<{ success: true; member: CorporateMember } | { error: string }> {
  const admin = createAdminClient();

  const dbUpdates: Record<string, unknown> = {};
  if (updates.role) dbUpdates.role = updates.role;
  if (updates.spendingLimit !== undefined) dbUpdates.spending_limit = updates.spendingLimit;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

  const { data: member, error } = await admin
    .from("corporate_members")
    .update(dbUpdates)
    .eq("id", memberId)
    .select()
    .single();

  if (error) return { error: error.message };
  return { success: true, member: mapMember(member) };
}

/**
 * List members of a corporate account.
 */
export async function listCorporateMembers(
  corporateAccountId: string
): Promise<{ members: CorporateMember[] }> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("corporate_members")
    .select("*")
    .eq("corporate_account_id", corporateAccountId)
    .order("created_at", { ascending: true });

  if (error) return { members: [] };
  return { members: (data || []).map(mapMember) };
}

/**
 * Get member by user ID and corporate account ID.
 */
export async function getCorporateMember(
  corporateAccountId: string,
  userId: string
): Promise<CorporateMember | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("corporate_members")
    .select("*")
    .eq("corporate_account_id", corporateAccountId)
    .eq("user_id", userId)
    .maybeSingle();

  return data ? mapMember(data) : null;
}

// ─── Spending Operations ───

/**
 * Record corporate spending (member uses corporate balance).
 */
export async function recordCorporateSpending(data: {
  corporateAccountId: string;
  memberId: string;
  userId: string;
  amount: number;
  category?: string;
  description?: string;
}): Promise<{ success: true; recordId: string } | { error: string }> {
  if (data.amount <= 0) return { error: "Amount must be positive" };

  const admin = createAdminClient();
  const account = await getCorporateAccount(data.corporateAccountId);
  if (!account) return { error: "Corporate account not found" };
  if (account.status !== "active") return { error: "Corporate account is not active" };
  if (account.balance < data.amount) return { error: "Insufficient corporate balance" };

  // Deduct from corporate balance
  const { error: deductError } = await admin
    .from("corporate_accounts")
    .update({ balance: account.balance - data.amount, updated_at: new Date().toISOString() })
    .eq("id", data.corporateAccountId);

  if (deductError) return { error: deductError.message };

  // Record spending record
  const { data: record, error: recordError } = await admin
    .from("corporate_spending")
    .insert({
      corporate_account_id: data.corporateAccountId,
      member_id: data.memberId,
      user_id: data.userId,
      amount: data.amount,
      category: data.category || "general",
      description: data.description || null,
      status: account.requiresApproval && data.amount >= account.approvalThreshold ? "pending" : "approved",
    })
    .select()
    .single();

  if (recordError) return { error: recordError.message };

  return { success: true, recordId: String(record.id) };
}

/**
 * List spending records for an account.
 */
export async function listCorporateSpending(
  corporateAccountId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{ records: CorporateSpendingRecord[]; total: number }> {
  const admin = createAdminClient();
  const limit = Math.min(50, Math.max(1, options.limit ?? 20));
  const offset = Math.max(0, options.offset ?? 0);

  const { data, count, error } = await admin
    .from("corporate_spending")
    .select("*", { count: "exact" })
    .eq("corporate_account_id", corporateAccountId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return { records: [], total: 0 };

  return {
    records: (data || []).map((r: Record<string, unknown>) => ({
      id: String(r.id),
      corporateAccountId: String(r.corporate_account_id),
      memberId: String(r.member_id),
      userId: String(r.user_id),
      amount: Number(r.amount),
      category: String(r.category || "general"),
      description: r.description ? String(r.description) : null,
      status: String(r.status) as CorporateSpendingRecord["status"],
      approvedById: r.approved_by_id ? String(r.approved_by_id) : null,
      createdAt: String(r.created_at),
    })),
    total: count ?? 0,
  };
}
