"use client";

const BASE_URL = "";

type RequestOptions = {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("experio-auth-token");
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, params, headers = {} } = opts;

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let url = `${BASE_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        searchParams.set(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data;
}

// ─── Auth ───

export async function login(email: string, password: string) {
  return request<{ user: unknown; session: { access_token: string }; role: string }>("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function signup(email: string, password: string, fullName?: string, role?: string, phone?: string) {
  return request<{ user: unknown; session: { access_token: string } }>("/api/auth/signup", {
    method: "POST",
    body: { email, password, full_name: fullName, role: role ?? "user", phone: phone ?? null },
  });
}

export async function getMe() {
  return request<{
    id: string;
    email: string;
    role: "user" | "partner" | "admin";
    profile: unknown;
    partnerProfile: { id: string; business_name: string; verification_status: string } | null;
  }>("/api/auth/me");
}

// ─── Experiences ───

export type ExperienceFilters = {
  page?: number;
  limit?: number;
  category?: string;
  mood?: string;
  search?: string;
  city?: string;
  min_price?: number;
  max_price?: number;
  featured?: boolean | string;
  sort?: string;
  order?: string;
};

export async function getExperiences(filters: ExperienceFilters = {}) {
  return request<{
    experiences: unknown[];
    total: number;
    page: number;
    limit: number;
  }>("/api/experiences", { params: filters as Record<string, string | number | boolean | undefined> });
}

export async function getExperience(id: string) {
  return request<unknown>(`/api/experiences/${id}`);
}

// ─── Bookings ───

export type BookingFilters = {
  page?: number;
  limit?: number;
  status?: string;
};

export async function getBookings(filters: BookingFilters = {}) {
  return request<{
    bookings: unknown[];
    total: number;
    page: number;
    limit: number;
  }>("/api/bookings", { params: filters as Record<string, string | number | boolean | undefined> });
}

export async function createBooking(data: {
  experience_id: string;
  guests_count: number;
  total_price: number;
  experience_date: string;
  experience_time?: string;
  notes?: string;
  contact_phone?: string;
  gift_card_code?: string;
}) {
  return request<unknown>("/api/bookings", { method: "POST", body: data });
}

export async function cancelBooking(id: string) {
  return request<unknown>(`/api/bookings/${id}/cancel`, { method: "POST" });
}

// ─── Saved ───

export async function getSaved(filters: { collection_id?: string; page?: number; limit?: number } = {}) {
  return request<{ saved: unknown[]; total: number }>("/api/saved", {
    params: filters as Record<string, string | number | boolean | undefined>,
  });
}

export async function saveExperience(experienceId: string, collectionId?: string) {
  return request<unknown>("/api/saved", {
    method: "POST",
    body: { experience_id: experienceId, collection_id: collectionId },
  });
}

export async function deleteSaved(id: string) {
  return request<unknown>(`/api/saved/${id}`, { method: "DELETE" });
}

// ─── Partner ───

export async function getPartnerProfile() {
  return request<unknown>("/api/partners/me");
}

export async function getPartnerExperiences() {
  return request<unknown>("/api/experiences/partner");
}

export async function getPartnerBookings() {
  return request<unknown>("/api/bookings/partner");
}

// ─── Gift Cards ───

export async function getGiftCards() {
  return request<unknown>("/api/gift-cards");
}

export async function createGiftCard(data: {
  recipient_name: string;
  recipient_email: string;
  amount: number;
  message?: string;
}) {
  return request<unknown>("/api/gift-cards", { method: "POST", body: data });
}

// ─── AI Concierge ───

export async function getConciergeSuggestions(query: string) {
  return request<{ explanation: string; results: unknown[] }>("/api/ai", {
    params: { query },
  });
}
