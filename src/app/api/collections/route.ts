import { NextRequest, NextResponse } from "next/server";
import { getCachedProducts } from "@/lib/catalogue";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category") || "all";
    const audience = searchParams.get("audience") || "all"; // "all" | "team" | "gifting"
    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : null;
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null;
    const moq = searchParams.get("moq") ? Number(searchParams.get("moq")) : null;
    const color = searchParams.get("color")?.toLowerCase() || null;
    const sort = searchParams.get("sort") || "popularity";
    const cursor = searchParams.get("cursor") || null;
    const limit = Math.min(Number(searchParams.get("limit")) || 12, 48);

    // Get all products for category
    const allProducts = await getCachedProducts(category);

    // Compute audience counts for this category BEFORE applying audience filter
    const totalCountAll = allProducts.length;
    const totalCountTeam = allProducts.filter(
      (p) => p.audience === "TEAM" || p.audience === "BOTH"
    ).length;
    const totalCountGifting = allProducts.filter(
      (p) => p.audience === "GIFTING" || p.audience === "BOTH"
    ).length;

    // Filter by Audience
    let filtered = allProducts.filter((p) => {
      if (audience === "team") return p.audience === "TEAM" || p.audience === "BOTH";
      if (audience === "gifting") return p.audience === "GIFTING" || p.audience === "BOTH";
      return true;
    });

    // Filter by Price Range
    if (minPrice !== null && !isNaN(minPrice)) {
      filtered = filtered.filter((p) => p.basePrice >= minPrice);
    }
    if (maxPrice !== null && !isNaN(maxPrice)) {
      filtered = filtered.filter((p) => p.basePrice <= maxPrice);
    }

    // Filter by MOQ (Maximum MOQ allowed)
    if (moq !== null && !isNaN(moq)) {
      filtered = filtered.filter((p) => p.minQty <= moq);
    }

    // Filter by Color
    if (color && color !== "all") {
      filtered = filtered.filter((p) =>
        p.colors?.some((c) => c.name.toLowerCase().includes(color))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sort === "price-asc") return a.basePrice - b.basePrice;
      if (sort === "price-desc") return b.basePrice - a.basePrice;
      if (sort === "newest") return b.id.localeCompare(a.id);
      // default: popularity / reviewCount
      return (b.reviewCount || 0) - (a.reviewCount || 0);
    });

    // Cursor pagination
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = filtered.findIndex((p) => p.slug === cursor || p.id === cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const paginatedItems = filtered.slice(startIndex, startIndex + limit);
    const nextItem = filtered[startIndex + limit];
    const nextCursor = nextItem ? nextItem.slug : null;

    return NextResponse.json({
      items: paginatedItems,
      nextCursor,
      totalCount: filtered.length,
      counts: {
        all: totalCountAll,
        team: totalCountTeam,
        gifting: totalCountGifting,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

