import { roundHalfUp, toPaise } from "@/server/pricing/engine";
import { MarginSettings, DEFAULT_MARGIN_SETTINGS } from "@/lib/admin/app-settings";
import { StoredOrderRecord } from "@/server/orders/state-machine";

export interface OrderMarginItemInput {
  name: string;
  sku?: string;
  category?: string;
  qty: number;
  unitPriceExclGstPaise: number;
  blankCostPaise: number;
  printCostPaise: number;
}

export interface OrderMarginInput {
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalCollectedPaise: number;
  revenueExclGstPaise: number;
  items: OrderMarginItemInput[];
  shippingCostPaise?: number; // Actual freight paid to courier (default 6000 paise / Rs 60)
  returnShippingCostPaise?: number; // Return freight on RTO (default 6000 paise / Rs 60)
  isRto?: boolean;
}

export interface MonthlyAdSpend {
  month: string;
  amountPaise: number;
  channel?: string;
  notes?: string;
}

export const AD_SPEND_STORE = new Map<string, MonthlyAdSpend>();

export interface OrderMarginBreakdown {
  orderNumber: string;
  createdAt: string;
  status: string;
  revenueExclGstPaise: number;
  netRevenuePaise: number; // alias
  grossInvoicePaise: number;
  gstPaise: number;
  cogsPaise: number;
  gatewayFeePaise: number;
  shippingCostPaise: number;
  rtoLossPaise: number;
  netMarginPaise: number;
  marginPercent: number;
}

export interface WaterfallStep {
  name: string;
  amountPaise: number;
  isDeduction: boolean;
  cumulativePaise: number;
}

export interface WaterfallBreakdown {
  grossRevenueExclGstPaise: number;
  cogsPaise: number;
  gatewayFeesPaise: number;
  shippingCostPaise: number;
  rtoLossesPaise: number;
  adSpendPaise: number;
  netMarginPaise: number;
  netMarginPercent: number;
  steps: WaterfallStep[];
}

export interface ProductMarginSummary {
  productIdOrSku: string;
  name: string;
  category: string;
  unitsSold: number;
  revenueExclGstPaise: number;
  cogsPaise: number;
  grossProfitPaise: number;
  marginPercent: number;
}

export interface MonthlyMarginSummary {
  month: string; // "YYYY-MM"
  ordersCount: number;
  unitsSold: number;
  revenueExclGstPaise: number;
  cogsPaise: number;
  gatewayFeesPaise: number;
  shippingCostPaise: number;
  rtoLossesPaise: number;
  adSpendPaise: number;
  netMarginPaise: number;
  marginPercent: number;
}

/**
 * Pure function: Calculates True Net Margin for a single order.
 * Net margin = revenue excluding GST minus COGS minus payment gateway fees minus shipping cost minus RTO losses.
 */
export function calculateOrderMargin(
  inputOrOrder: OrderMarginInput | StoredOrderRecord,
  adSpendOrSettings?: number | MarginSettings,
  maybeSettings?: MarginSettings
): OrderMarginBreakdown {
  const isStoredOrder = "total" in inputOrOrder && "version" in inputOrOrder;
  const input: OrderMarginInput = isStoredOrder
    ? convertOrderToMarginInput(inputOrOrder as StoredOrderRecord)
    : (inputOrOrder as OrderMarginInput);

  const settings: MarginSettings =
    typeof adSpendOrSettings === "object" && adSpendOrSettings !== null
      ? adSpendOrSettings
      : maybeSettings || DEFAULT_MARGIN_SETTINGS;

  const revenueExclGst = Math.max(0, input.revenueExclGstPaise);
  const grossInvoicePaise =
    input.totalCollectedPaise > 0
      ? input.totalCollectedPaise
      : Math.round(revenueExclGst * 1.18);
  const gstPaise = Math.max(0, grossInvoicePaise - revenueExclGst);

  // 1. COGS: sum of (blank cost + print cost) * qty across all line items
  let cogsPaise = 0;
  for (const item of input.items) {
    const itemCogs = (item.blankCostPaise + item.printCostPaise) * item.qty;
    cogsPaise += itemCogs;
  }

  // 2. Gateway Fees: applied only if paid online or online advance
  let gatewayFeePaise = 0;
  if (input.paymentMethod !== "COD" || input.paymentStatus === "ADVANCE_PAID" || input.paymentStatus === "PAID") {
    const feeRate = (settings.paymentGatewayFeePercent || 2.0) / 100;
    const baseAmount = input.totalCollectedPaise > 0 ? input.totalCollectedPaise : revenueExclGst;
    gatewayFeePaise = roundHalfUp(baseAmount * feeRate) + (settings.paymentGatewayFixedFeePaise || 0);
  }

  // 3. Shipping Cost
  const outboundShippingPaise = input.shippingCostPaise !== undefined ? input.shippingCostPaise : 6000; // Rs 60 default
  let shippingCostPaise = outboundShippingPaise;

  // 4. RTO Losses
  // If order is RTO: merchant incurs outbound shipping + return shipping + entire produced goods cost (since customized/branded goods cannot be restocked)
  let rtoLossPaise = 0;
  const isRto = input.isRto ?? (input.status === "RTO");
  if (isRto) {
    const returnShippingPaise = input.returnShippingCostPaise !== undefined ? input.returnShippingCostPaise : 6000;
    // Produced goods unsellable loss is equal to the full COGS already manufactured
    rtoLossPaise = outboundShippingPaise + returnShippingPaise + cogsPaise;
    // Since goods are unsellable and customer refused/refunded, realized revenue is 0
    shippingCostPaise = 0; // absorbed into rtoLossPaise
  }

  // 5. Net Margin
  const effectiveRevenue = isRto ? 0 : revenueExclGst;
  const netMarginPaise = effectiveRevenue - (isRto ? 0 : cogsPaise) - gatewayFeePaise - shippingCostPaise - rtoLossPaise;

  const marginPercent = effectiveRevenue > 0
    ? Math.round((netMarginPaise / effectiveRevenue) * 1000) / 10
    : isRto ? -100 : 0;

  return {
    orderNumber: input.orderNumber,
    createdAt: input.createdAt,
    status: input.status,
    revenueExclGstPaise: effectiveRevenue,
    netRevenuePaise: effectiveRevenue,
    grossInvoicePaise,
    gstPaise,
    cogsPaise: isRto ? 0 : cogsPaise,
    gatewayFeePaise,
    shippingCostPaise,
    rtoLossPaise,
    netMarginPaise,
    marginPercent,
  };
}

/**
 * Pure function: Calculates True Net Margin Waterfall for an aggregate cohort.
 */
export function calculateWaterfallBreakdown(
  paramsOrOrders: { orders: OrderMarginBreakdown[]; adSpendPaise: number } | (OrderMarginBreakdown | StoredOrderRecord)[],
  adSpendPaiseArg: number = 0,
  settingsArg: MarginSettings = DEFAULT_MARGIN_SETTINGS
): WaterfallBreakdown {
  let ordersList: OrderMarginBreakdown[] = [];
  let adSpendPaise = 0;

  if (Array.isArray(paramsOrOrders)) {
    ordersList = paramsOrOrders.map((o) =>
      "netMarginPaise" in o ? (o as OrderMarginBreakdown) : calculateOrderMargin(o, 0, settingsArg)
    );
    adSpendPaise = adSpendPaiseArg;
  } else {
    ordersList = paramsOrOrders.orders;
    adSpendPaise = paramsOrOrders.adSpendPaise;
  }

  let grossRevenueExclGstPaise = 0;
  let cogsPaise = 0;
  let gatewayFeesPaise = 0;
  let shippingCostPaise = 0;
  let rtoLossesPaise = 0;

  for (const o of ordersList) {
    grossRevenueExclGstPaise += o.revenueExclGstPaise;
    cogsPaise += o.cogsPaise;
    gatewayFeesPaise += o.gatewayFeePaise;
    shippingCostPaise += o.shippingCostPaise;
    rtoLossesPaise += o.rtoLossPaise;
  }

  const safeAdSpendPaise = Math.max(0, adSpendPaise);
  const netMarginPaise =
    grossRevenueExclGstPaise -
    cogsPaise -
    gatewayFeesPaise -
    shippingCostPaise -
    rtoLossesPaise -
    safeAdSpendPaise;

  const netMarginPercent =
    grossRevenueExclGstPaise > 0
      ? Math.round((netMarginPaise / grossRevenueExclGstPaise) * 1000) / 10
      : 0;

  let current = grossRevenueExclGstPaise;
  const steps: WaterfallStep[] = [
    {
      name: "Gross Revenue (Ex-GST)",
      amountPaise: grossRevenueExclGstPaise,
      isDeduction: false,
      cumulativePaise: current,
    },
    {
      name: "COGS (Blanks + Print)",
      amountPaise: cogsPaise,
      isDeduction: true,
      cumulativePaise: (current -= cogsPaise),
    },
    {
      name: "Payment Gateway (2%)",
      amountPaise: gatewayFeesPaise,
      isDeduction: true,
      cumulativePaise: (current -= gatewayFeesPaise),
    },
    {
      name: "Shipping & Logistics",
      amountPaise: shippingCostPaise,
      isDeduction: true,
      cumulativePaise: (current -= shippingCostPaise),
    },
    {
      name: "RTO Freight & Scrap",
      amountPaise: rtoLossesPaise,
      isDeduction: true,
      cumulativePaise: (current -= rtoLossesPaise),
    },
    {
      name: "Marketing & Ad Spend",
      amountPaise: safeAdSpendPaise,
      isDeduction: true,
      cumulativePaise: (current -= safeAdSpendPaise),
    },
    {
      name: "True Net Margin",
      amountPaise: netMarginPaise,
      isDeduction: false,
      cumulativePaise: netMarginPaise,
    },
  ];

  return {
    grossRevenueExclGstPaise,
    cogsPaise,
    gatewayFeesPaise,
    shippingCostPaise,
    rtoLossesPaise,
    adSpendPaise: safeAdSpendPaise,
    netMarginPaise,
    netMarginPercent,
    steps,
  };
}

/**
 * Pure function: Groups orders by calendar month and incorporates ad spend per month.
 */
export function aggregateMonthlyMargins(
  ordersInput: (OrderMarginBreakdown | StoredOrderRecord)[],
  adSpendInput: Record<string, number> | Map<string, number> = {},
  settingsArg: MarginSettings = DEFAULT_MARGIN_SETTINGS
): MonthlyMarginSummary[] {
  const orders: OrderMarginBreakdown[] = ordersInput.map((o) =>
    "netMarginPaise" in o ? (o as OrderMarginBreakdown) : calculateOrderMargin(o, 0, settingsArg)
  );

  const adSpendByMonth: Record<string, number> =
    adSpendInput instanceof Map
      ? Object.fromEntries(adSpendInput.entries())
      : adSpendInput;
  const monthMap = new Map<string, {
    ordersCount: number;
    unitsSold: number;
    revenue: number;
    cogs: number;
    gateway: number;
    shipping: number;
    rto: number;
  }>();

  for (const o of orders) {
    const d = new Date(o.createdAt);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const curr = monthMap.get(monthKey) || {
      ordersCount: 0,
      unitsSold: 0,
      revenue: 0,
      cogs: 0,
      gateway: 0,
      shipping: 0,
      rto: 0,
    };

    curr.ordersCount += 1;
    curr.revenue += o.revenueExclGstPaise;
    curr.cogs += o.cogsPaise;
    curr.gateway += o.gatewayFeePaise;
    curr.shipping += o.shippingCostPaise;
    curr.rto += o.rtoLossPaise;

    monthMap.set(monthKey, curr);
  }

  const summaries: MonthlyMarginSummary[] = [];
  for (const [month, data] of monthMap.entries()) {
    const adSpend = adSpendByMonth[month] || 0;
    const netMargin = data.revenue - data.cogs - data.gateway - data.shipping - data.rto - adSpend;
    const marginPercent = data.revenue > 0 ? Math.round((netMargin / data.revenue) * 1000) / 10 : 0;

    summaries.push({
      month,
      ordersCount: data.ordersCount,
      unitsSold: data.unitsSold,
      revenueExclGstPaise: data.revenue,
      cogsPaise: data.cogs,
      gatewayFeesPaise: data.gateway,
      shippingCostPaise: data.shipping,
      rtoLossesPaise: data.rto,
      adSpendPaise: adSpend,
      netMarginPaise: netMargin,
      marginPercent,
    });
  }

  return summaries.sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Standard COGS catalog default lookup for order items lacking explicit raw blank cost.
 */
export function resolveItemCogs(productTitle: string, unitPricePaise: number): { blankCostPaise: number; printCostPaise: number } {
  const lower = productTitle.toLowerCase();
  if (lower.includes("hoodie")) {
    return { blankCostPaise: 55000, printCostPaise: 15000 }; // Rs 550 blank + Rs 150 print
  }
  if (lower.includes("polo")) {
    return { blankCostPaise: 26000, printCostPaise: 8000 }; // Rs 260 blank + Rs 80 print
  }
  if (lower.includes("tee") || lower.includes("t-shirt")) {
    return { blankCostPaise: 14000, printCostPaise: 5000 }; // Rs 140 blank + Rs 50 print
  }
  if (lower.includes("flask") || lower.includes("tumbler") || lower.includes("bottle")) {
    return { blankCostPaise: 28000, printCostPaise: 8000 }; // Rs 280 blank + Rs 80 print
  }
  if (lower.includes("badge") || lower.includes("pin")) {
    return { blankCostPaise: 3000, printCostPaise: 1500 }; // Rs 30 blank + Rs 15 print
  }
  if (lower.includes("kit") || lower.includes("pack")) {
    return { blankCostPaise: 90000, printCostPaise: 25000 }; // Rs 900 blank + Rs 250 print
  }
  // Default fallback: 50% blank, 15% print
  return {
    blankCostPaise: roundHalfUp(unitPricePaise * 0.5),
    printCostPaise: roundHalfUp(unitPricePaise * 0.15),
  };
}

/**
 * Convert StoredOrderRecord to OrderMarginInput.
 */
export function convertOrderToMarginInput(order: StoredOrderRecord): OrderMarginInput {
  const revenueExclGstPaise = toPaise(order.subtotal - order.discount);
  const items: OrderMarginItemInput[] = (order.items || []).map((it) => {
    const unitPricePaise = toPaise(it.unitPrice);
    const cogs = resolveItemCogs("Item", unitPricePaise);
    return {
      name: "Custom Merchandise Item",
      qty: it.qty,
      unitPriceExclGstPaise: unitPricePaise,
      blankCostPaise: cogs.blankCostPaise,
      printCostPaise: cogs.printCostPaise,
    };
  });

  return {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    totalCollectedPaise: toPaise(order.total),
    revenueExclGstPaise,
    items,
    isRto: order.status === "RTO",
  };
}
