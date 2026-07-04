"use client";

// â”€â”€â”€ Types â”€â”€â”€

export type PaymentMethod = "mpamba" | "airtel-money" | "card";

export interface PaymentMethodInfo {
  id: PaymentMethod;
  name: string;
  icon: string;
  description: string;
}

export const PAYMENT_METHODS: PaymentMethodInfo[] = [
  { id: "mpamba", name: "M-Pamba", icon: "ðŸ“±", description: "Pay with TNM M-Pamba" },
  { id: "airtel-money", name: "Airtel Money", icon: "ðŸ“²", description: "Pay with Airtel Money" },
  { id: "card", name: "Card Payment", icon: "ðŸ’³", description: "Visa / Mastercard" },
];

export interface PaymentRequest {
  experienceId: string;
  experienceTitle: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  phoneNumber?: string;  // for mobile money
  email?: string;        // for card receipt
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  reference?: string;
  message: string;
  timestamp: number;
}

// â”€â”€â”€ Mock Payment Processing â”€â”€â”€

const PAYMENT_STORAGE_KEY = "momento-payments";

export function processPayment(request: PaymentRequest): Promise<PaymentResult> {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      const success = Math.random() > 0.1; // 90% success rate for mock

      if (success) {
        const result: PaymentResult = {
          success: true,
          transactionId: `TXN-${Date.now().toString(36).toUpperCase()}`,
          reference: `REF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          message: "Payment successful! Your booking is confirmed.",
          timestamp: Date.now(),
        };
        savePayment(result);
        resolve(result);
      } else {
        resolve({
          success: false,
          message: "Payment declined. Please check your balance and try again.",
          timestamp: Date.now(),
        });
      }
    }, 1500);
  });
}

// â”€â”€â”€ Payment History â”€â”€â”€

export interface SavedPayment extends PaymentResult {
  experienceId: string;
  experienceTitle: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
}

function savePayment(result: PaymentResult & Partial<SavedPayment>) {
  try {
    const payments = getPaymentHistory();
    payments.unshift(result as SavedPayment);
    localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(payments.slice(0, 50)));
  } catch { /* ignore */ }
}

export function getPaymentHistory(): SavedPayment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PAYMENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// â”€â”€â”€ Formatting â”€â”€â”€

export function formatCurrency(amount: number, currency: string = "MK"): string {
  return `${currency} ${amount.toLocaleString()}`;
}

export function maskPhone(phone: string): string {
  if (phone.length < 4) return phone;
  return phone.slice(0, -4).replace(/\d/g, "*") + phone.slice(-4);
}
