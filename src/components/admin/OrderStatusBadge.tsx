import React from "react";
import { OrderStatus } from "@/server/orders/state-machine";
import {
  Clock,
  UploadCloud,
  Eye,
  RotateCcw,
  CheckCircle2,
  Printer,
  ShieldCheck,
  Truck,
  CheckCheck,
  XCircle,
  Banknote,
  AlertTriangle,
} from "lucide-react";

interface OrderStatusBadgeProps {
  status: OrderStatus | string;
  size?: "sm" | "md" | "lg";
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: React.ElementType }
> = {
  ORDER_PLACED: {
    label: "Order Placed",
    bg: "bg-[#15101F]/5 dark:bg-white/5",
    text: "text-[#15101F] dark:text-[#F5F0E8]",
    border: "border-[#15101F]/15 dark:border-white/15",
    icon: Clock,
  },
  ARTWORK_UPLOADED: {
    label: "Artwork Uploaded",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800",
    icon: UploadCloud,
  },
  MOCKUP_SENT: {
    label: "Mockup Sent",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
    icon: Eye,
  },
  REVISION_REQUESTED: {
    label: "Changes Requested",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-800 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    icon: RotateCcw,
  },
  CUSTOMER_APPROVED: {
    label: "Customer Approved",
    bg: "bg-teal-50 dark:bg-teal-950/40",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-800",
    icon: CheckCircle2,
  },
  IN_PRINTING: {
    label: "In Printing",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    icon: Printer,
  },
  QC_PASSED: {
    label: "QC Passed",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: ShieldCheck,
  },
  DISPATCHED: {
    label: "Dispatched",
    bg: "bg-[#6A2CFF]/10",
    text: "text-[#6A2CFF] dark:text-[#CDB8FF]",
    border: "border-[#6A2CFF]/20",
    icon: Truck,
  },
  DELIVERED: {
    label: "Delivered",
    bg: "bg-green-50 dark:bg-green-950/40",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200 dark:border-green-800",
    icon: CheckCheck,
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
    icon: XCircle,
  },
  REFUNDED: {
    label: "Refunded",
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-700 dark:text-zinc-300",
    border: "border-zinc-300 dark:border-zinc-700",
    icon: Banknote,
  },
  RTO: {
    label: "Returned (RTO)",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    text: "text-orange-800 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
    icon: AlertTriangle,
  },
};

export function OrderStatusBadge({ status, size = "md" }: OrderStatusBadgeProps) {
  const norm = (status || "").toUpperCase();
  const config = STATUS_CONFIG[norm] || {
    label: norm,
    bg: "bg-zinc-100",
    text: "text-zinc-700",
    border: "border-zinc-200",
    icon: Clock,
  };
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2",
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      <span>{config.label}</span>
    </span>
  );
}
