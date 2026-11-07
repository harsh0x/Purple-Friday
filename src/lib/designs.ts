import crypto from "crypto";
import { Prisma } from "@prisma/client";
import prisma from "./prisma";

export interface StoredDesign {
  id: string;
  userId?: string;
  productId: string;
  productSlug: string;
  uploadId?: string;
  previewUrl: string;
  layers: Record<string, unknown>;
  selectedColor: string;
  view: "front" | "back";
  quantity: number;
  options?: Record<string, string>;
  createdAt: string;
}

const DESIGN_REGISTRY = new Map<string, StoredDesign>();

export async function saveDesign(data: {
  userId?: string;
  productId: string;
  productSlug: string;
  uploadId?: string;
  previewUrl: string;
  layers: Record<string, unknown>;
  selectedColor: string;
  view: "front" | "back";
  quantity: number;
  options?: Record<string, string>;
}): Promise<StoredDesign> {
  const designId = `dsn_${crypto.randomUUID()}`;

  const record: StoredDesign = {
    id: designId,
    userId: data.userId,
    productId: data.productId,
    productSlug: data.productSlug,
    uploadId: data.uploadId,
    previewUrl: data.previewUrl,
    layers: data.layers,
    selectedColor: data.selectedColor,
    view: data.view,
    quantity: data.quantity,
    options: data.options,
    createdAt: new Date().toISOString(),
  };

  DESIGN_REGISTRY.set(designId, record);

  // Attempt async sync to DB if connected
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      await prisma.design.create({
        data: {
          id: designId,
          userId: data.userId,
          productId: data.productId,
          previewUrl: data.previewUrl,
          logoUrl: data.uploadId ? `/api/uploads/${data.uploadId}` : undefined,
          layers: data.layers as unknown as Prisma.InputJsonValue,
        },
      });
    }
  } catch {
    // Graceful fallback to memory registry
  }

  return record;
}

export async function getDesignById(id: string): Promise<StoredDesign | undefined> {
  if (DESIGN_REGISTRY.has(id)) {
    return DESIGN_REGISTRY.get(id);
  }

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const dbDesign = await prisma.design.findUnique({
        where: { id },
      });
      if (dbDesign) {
        return {
          id: dbDesign.id,
          userId: dbDesign.userId || undefined,
          productId: dbDesign.productId,
          productSlug: dbDesign.productId,
          previewUrl: dbDesign.previewUrl || "",
          layers: (dbDesign.layers as Record<string, unknown>) || {},
          selectedColor: "#15101F",
          view: "front",
          quantity: 1,
          createdAt: dbDesign.createdAt.toISOString(),
        };
      }
    }
  } catch {
    // Ignore and fallback
  }

  return undefined;
}
