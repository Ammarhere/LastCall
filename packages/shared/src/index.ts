// ─── Enums ────────────────────────────────────────────────────────────────────

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  PARTNER = 'PARTNER',
  ADMIN = 'ADMIN',
}

export enum PartnerStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SUSPENDED = 'SUSPENDED',
}

export enum BagStatus {
  DRAFT = 'DRAFT',
  AVAILABLE = 'AVAILABLE',
  SOLD_OUT = 'SOLD_OUT',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum OrderStatus {
  CONFIRMED = 'CONFIRMED',
  READY = 'READY',
  PICKED_UP = 'PICKED_UP',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  JAZZCASH = 'JAZZCASH',
  EASYPAISA = 'EASYPAISA',
  SADAPAY = 'SADAPAY',
  NAYAPAY = 'NAYAPAY',
  RAAST = 'RAAST',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum DocumentType {
  CNIC = 'CNIC',
  BUSINESS_LICENSE = 'BUSINESS_LICENSE',
  BANK_STATEMENT = 'BANK_STATEMENT',
  UTILITY_BILL = 'UTILITY_BILL',
}

export enum NotifChannel {
  PUSH = 'PUSH',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
  IN_APP = 'IN_APP',
}

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ─── Socket Events ────────────────────────────────────────────────────────────

export const SocketEvents = {
  // Server → Client
  ORDER_STATUS_CHANGED: 'order:status_changed',
  ORDER_NEW:            'order:new',
  BAG_SOLD_OUT:         'bag:sold_out',
  BAG_NEW_LISTING:      'bag:new_listing',   // A partner listed a new bag — notify fans
  PARTNER_APPROVED:     'partner:approved',
  NOTIFICATION_NEW:     'notification:new',
  // Client → Server
  JOIN:  'join',
  LEAVE: 'leave',
} as const;

// ─── Utils ────────────────────────────────────────────────────────────────────

/** Normalise Pakistani phone numbers to +92xxxxxxxxxx */
export function normalizePKPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('92') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 11) return `+92${digits.slice(1)}`;
  if (digits.length === 10) return `+92${digits}`;
  return `+${digits}`;
}

/** Format PKR amount: 1500 → "Rs. 1,500" */
export function formatPKR(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-PK')}`;
}

/** Calculate CO2 saved per bag (avg ~2.5 kg per meal saved from landfill) */
export function calcCO2Saved(mealCount: number): number {
  return parseFloat((mealCount * 2.5).toFixed(2));
}
