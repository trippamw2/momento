"use client";

export interface GiftCardCreate {
  amount: number;
  recipientName: string;
  recipientContact: string;
  senderName: string;
  message?: string;
  deliveryMethod: "whatsapp" | "email" | "sms" | "print";
  scheduleDate?: string;
  occasion?: string;
  design?: string;
}

export interface GiftCardFull {
  id: string;
  code: string;
  amount: number;
  balance: number;
  currency: string;
  recipientName: string;
  recipientContact: string;
  senderName: string;
  message?: string;
  deliveryMethod: string;
  scheduleDate?: string;
  occasion?: string;
  design?: string;
  status: "active" | "redeemed" | "expired" | "scheduled";
  createdAt: string;
  expiresAt: string;
}

const STORAGE_KEY = "experio-gift-cards";

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "MOMO-";
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateId(): string {
  return `gift_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadCards(): GiftCardFull[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCards(cards: GiftCardFull[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

export function createGiftCard(request: GiftCardCreate): GiftCardFull {
  const now = new Date();
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const code = generateCode();

  const card: GiftCardFull = {
    id: generateId(),
    code,
    amount: request.amount,
    balance: request.amount,
    currency: "MWK",
    recipientName: request.recipientName,
    recipientContact: request.recipientContact,
    senderName: request.senderName,
    message: request.message,
    deliveryMethod: request.deliveryMethod,
    scheduleDate: request.scheduleDate,
    occasion: request.occasion,
    design: request.design,
    status: request.scheduleDate ? "scheduled" : "active",
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  const cards = loadCards();
  cards.push(card);
  saveCards(cards);

  return card;
}

export function sendGiftCard(card: GiftCardFull): void {
  if (card.deliveryMethod === "whatsapp") {
    sendViaWhatsApp(card);
  } else if (card.deliveryMethod === "email") {
    sendViaEmail(card);
  } else if (card.deliveryMethod === "sms") {
    sendViaSMS(card);
  }
  // "print" is handled by PDF download
}

function sendViaWhatsApp(card: GiftCardFull): void {
  const message = encodeURIComponent(
    `🎁 You've received an Experio Gift Card from ${card.senderName}!\n\n` +
    `Amount: ${card.currency} ${card.amount.toLocaleString()}\n` +
    (card.message ? `Message: "${card.message}"\n\n` : "\n") +
    `Code: ${card.code}\n\n` +
    `Redeem at: ${window.location.origin}/gift/redeem?code=${card.code}`
  );
  const phone = card.recipientContact.replace(/[\s\+\-]/g, "");
  window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
}

function sendViaEmail(card: GiftCardFull): void {
  const subject = encodeURIComponent(`🎁 You've received an Experio Gift Card from ${card.senderName}!`);
  const body = encodeURIComponent(
    `Hi ${card.recipientName},\n\n` +
    `${card.senderName} has sent you an Experio Gift Card!\n\n` +
    `Amount: ${card.currency} ${card.amount.toLocaleString()}\n` +
    (card.message ? `Message: "${card.message}"\n\n` : "\n") +
    `Code: ${card.code}\n\n` +
    `Redeem here: ${window.location.origin}/gift/redeem?code=${card.code}\n\n` +
    `Expires: ${new Date(card.expiresAt).toLocaleDateString()}\n\n` +
    `Live The Moment,\nExperio`
  );
  window.open(`mailto:${card.recipientContact}?subject=${subject}&body=${body}`, "_blank");
}

function sendViaSMS(card: GiftCardFull): void {
  const message = encodeURIComponent(
    `🎁 Experio Gift Card from ${card.senderName}! Code: ${card.code}. Redeem: ${window.location.origin}/gift/redeem?code=${card.code}`
  );
  window.open(`sms:${card.recipientContact}?body=${message}`, "_blank");
}

export function getGiftCardByCode(code: string): GiftCardFull | null {
  const cards = loadCards();
  return cards.find((c) => c.code.toUpperCase() === code.toUpperCase()) ?? null;
}

export function redeemGiftCard(code: string, amount: number): boolean {
  const cards = loadCards();
  const idx = cards.findIndex((c) => c.code.toUpperCase() === code.toUpperCase());
  if (idx === -1) return false;

  const card = cards[idx];
  if (card.status === "redeemed" || card.status === "expired") return false;
  if (card.balance < amount) return false;

  card.balance -= amount;
  if (card.balance <= 0) {
    card.status = "redeemed";
    card.balance = 0;
  }
  cards[idx] = card;
  saveCards(cards);
  return true;
}

export function getSentGiftCards(): GiftCardFull[] {
  return loadCards().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getScheduledGiftCards(): GiftCardFull[] {
  return loadCards().filter((c) => c.status === "scheduled");
}

export function cancelScheduledGift(giftId: string): boolean {
  const cards = loadCards();
  const idx = cards.findIndex((c) => c.id === giftId);
  if (idx === -1 || cards[idx].status !== "scheduled") return false;
  cards.splice(idx, 1);
  saveCards(cards);
  return true;
}

export function processScheduledGifts(): void {
  const cards = loadCards();
  const now = new Date().getTime();
  let changed = false;

  const updated = cards.map((card) => {
    if (card.status === "scheduled" && card.scheduleDate) {
      const scheduleTime = new Date(card.scheduleDate).getTime();
      if (scheduleTime <= now) {
        changed = true;
        return { ...card, status: "active" as const };
      }
    }
    // Expire cards older than 1 year
    if (card.status === "active" && new Date(card.expiresAt).getTime() <= now) {
      changed = true;
      return { ...card, status: "expired" as const };
    }
    return card;
  });

  if (changed) saveCards(updated);
}
