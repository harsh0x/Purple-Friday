export interface ShipmentItemInput {
  name: string;
  qty: number;
  sku?: string;
  unitPricePaise?: number;
}

export interface CreateShipmentInput {
  orderNumber: string;
  shipmentNumber: string;
  recipientName: string;
  recipientPhone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  weightGrams?: number;
  dimensionsCm?: { length: number; width: number; height: number };
  collectCodAmountPaise?: number; // 0 for prepaid, > 0 for COD
  items: ShipmentItemInput[];
  courierName?: string;
  awb?: string; // Provided for manual provider
}

export interface ShipmentResult {
  success: boolean;
  shipmentNumber: string;
  awb: string;
  courier: string;
  labelUrl?: string;
  status: "CREATED" | "MANIFESTED" | "DISPATCHED" | "IN_TRANSIT" | "DELIVERED" | "RTO";
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface TrackingEvent {
  timestamp: string;
  status: string;
  location: string;
  description: string;
}

export interface TrackingResult {
  awb: string;
  courier: string;
  status: string;
  currentLocation?: string;
  events: TrackingEvent[];
}

export interface ShippingProvider {
  name: string;
  isConfigured(): boolean;
  createShipment(input: CreateShipmentInput): Promise<ShipmentResult>;
  cancelShipment(awb: string): Promise<{ success: boolean; error?: string }>;
  track(awb: string): Promise<TrackingResult>;
  getLabel(awb: string): Promise<{ url?: string; labelHtml?: string }>;
}
