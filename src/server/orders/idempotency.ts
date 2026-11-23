export interface CachedOrderResponse {
  success: boolean;
  orderId: string;
  orderNumber: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  cookieToken: string;
}

export const ORDER_IDEMPOTENCY_MAP = new Map<string, CachedOrderResponse>();
