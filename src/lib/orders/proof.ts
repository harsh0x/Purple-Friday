import { StoredOrder, getOrderById } from "../orders";

export interface ProofActionParams {
  orderId: string;
  userId: string;
  action: "approve" | "request_changes";
  feedback?: string;
  newUploadId?: string;
}

export interface ProofActionResult {
  success: boolean;
  order: StoredOrder;
  status: StoredOrder["status"];
  message: string;
}

export function handleProofAction({
  orderId,
  action,
  feedback,
}: ProofActionParams): ProofActionResult {
  const order = getOrderById(orderId);
  if (!order) {
    throw new Error("Order not found.");
  }

  if (action === "approve") {
    order.status = "APPROVED";
    order.updatedAt = new Date().toISOString();
    return {
      success: true,
      order,
      status: "APPROVED",
      message: "Pre-press proof approved! Production queued.",
    };
  }

  if (action === "request_changes") {
    if (!feedback || feedback.trim().length < 5) {
      throw new Error("Please provide specific feedback regarding requested changes.");
    }

    order.status = "CHANGES_REQUESTED";
    order.updatedAt = new Date().toISOString();
    return {
      success: true,
      order,
      status: "CHANGES_REQUESTED",
      message: "Change request received. Our studio will review and revise your proof.",
    };
  }

  throw new Error("Invalid proof action specified.");
}

