import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ORDER_STORE } from "@/server/orders/state-machine";
import { validateSplitDispatchCsv, generateErrorCsv } from "@/server/shipping/shipping-service";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ orderNumber: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderNumber } = await props.params;
  const order =
    ORDER_STORE.get(orderNumber) ||
    Array.from(ORDER_STORE.values()).find((o) => o.orderNumber === orderNumber);

  if (!order) {
    return NextResponse.json({ error: `Order ${orderNumber} not found.` }, { status: 404 });
  }

  try {
    const body = await req.json();
    const csvContent = body.csvContent as string;
    if (!csvContent || typeof csvContent !== "string") {
      return NextResponse.json({ error: "Missing or invalid csvContent." }, { status: 400 });
    }

    const expectedTotalQty = order.items.reduce((sum, item) => sum + item.qty, 0);
    const validation = validateSplitDispatchCsv(csvContent, expectedTotalQty);
    const errorCsv = validation.invalidRowsCount > 0 ? generateErrorCsv(validation) : undefined;

    return NextResponse.json({
      success: true,
      validation,
      errorCsv,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to validate CSV";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
