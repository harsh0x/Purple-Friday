import fs from "fs";
import path from "path";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { isStaffRole } from "@/lib/admin/permissions";
import { ORDER_STORE } from "@/server/orders/state-machine";
import { writeAudit } from "@/lib/admin/audit";
import { isCloudinaryConfigured, uploadBufferToCloudinary } from "@/lib/cloudinary";

const MOCKUP_STORAGE_DIR = path.join(process.cwd(), "storage", "mockups");

function ensureStorageDir() {
  if (!fs.existsSync(MOCKUP_STORAGE_DIR)) {
    fs.mkdirSync(MOCKUP_STORAGE_DIR, { recursive: true });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ orderNumber: string; itemId: string }> }
) {
  const session = await getAdminSession();
  if (!session || !isStaffRole(session.role)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const { orderNumber, itemId } = await context.params;

  try {
    const body = await req.json();
    const { placement, printMethod, mockupImageBase64, expectedVersion } = body;

    const order =
      ORDER_STORE.get(orderNumber) ||
      Array.from(ORDER_STORE.values()).find((o) => o.orderNumber === orderNumber);

    if (!order) {
      return NextResponse.json({ error: `Order ${orderNumber} not found.` }, { status: 404 });
    }

    if (expectedVersion !== undefined && order.version !== expectedVersion) {
      return NextResponse.json({ error: "Someone else changed this order, refresh." }, { status: 409 });
    }

    const item = order.items.find((i) => i.id === itemId);
    if (!item) {
      return NextResponse.json({ error: `Item ${itemId} not found in order ${orderNumber}.` }, { status: 404 });
    }

    // Save mockup image to disk if provided as base64
    let savedMockupUrl = item.mockupUrl;
    if (mockupImageBase64 && mockupImageBase64.startsWith("data:image/")) {
      const base64Data = mockupImageBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      if (isCloudinaryConfigured()) {
        savedMockupUrl = await uploadBufferToCloudinary(buffer, {
          folder: "purple-friday/mockups",
          publicId: `mockup_${orderNumber}_${itemId}_${Date.now()}`,
          resourceType: "image",
          format: "png",
        });
      } else {
        if (process.env.NODE_ENV === "production") {
          return NextResponse.json(
            { error: "Local disk storage is disabled in production. Cloudinary must be configured." },
            { status: 500 }
          );
        }
        ensureStorageDir();
        const filename = `mockup_${orderNumber}_${itemId}_${Date.now()}.png`;
        const filePath = path.join(MOCKUP_STORAGE_DIR, filename);
        fs.writeFileSync(filePath, buffer);
        savedMockupUrl = `/storage/mockups/${filename}`;
      }
    } else if (mockupImageBase64) {
      savedMockupUrl = mockupImageBase64;
    }

    // Update item
    item.placement = placement || item.placement;
    item.printMethod = printMethod || item.printMethod;
    if (savedMockupUrl) {
      item.mockupUrl = savedMockupUrl;
    }

    const now = new Date();
    order.version += 1;
    order.updatedAt = now.toISOString();

    const eventId = `evt_mockup_${now.getTime()}_${crypto.randomBytes(2).toString("hex")}`;
    const event = {
      id: eventId,
      type: "MOCKUP_GENERATED",
      status: order.status,
      actor: session.name ? `${session.name} (${session.email})` : session.email,
      actorRole: session.role.toUpperCase(),
      message: `Designer generated product mockup for ${item.productId} (${item.printMethod || "DTF"}).`,
      metadata: { itemId, placement: item.placement, printMethod: item.printMethod },
      createdAt: now.toISOString(),
    };

    order.events = [event, ...(order.events || [])];
    ORDER_STORE.set(order.id, order);
    ORDER_STORE.set(order.orderNumber, order);

    await writeAudit({
      actor: session.email,
      actorRole: session.role.toUpperCase(),
      action: "order.mockup_generated",
      entityType: "ORDER",
      entityId: order.orderNumber,
      after: { itemId, placement: item.placement, printMethod: item.printMethod, version: order.version },
    });

    return NextResponse.json({
      success: true,
      order,
      item,
      mockupUrl: item.mockupUrl,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save mockup placement";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
