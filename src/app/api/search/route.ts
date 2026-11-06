import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api";
import prisma from "@/lib/prisma";
import { CATALOG_FALLBACK } from "@/lib/pricing";

const searchQuerySchema = z.object({
  q: z.string().default(""),
});

export const GET = createApiHandler(
  {
    querySchema: searchQuerySchema,
    rateLimit: { limit: 100, windowMs: 60000 },
  },
  async ({ query }) => {
    const rawQuery = (query.q || "").trim().toLowerCase();

    if (!rawQuery) {
      return NextResponse.json({
        success: true,
        results: [],
      });
    }

    let results: Array<{
      id: string;
      slug: string;
      name: string;
      shortName: string;
      mrp: number;
      basePrice: number;
      categoryName: string;
      template: string;
    }> = [];

    // Check database if live credentials exist
    if (
      process.env.DATABASE_URL &&
      !process.env.DATABASE_URL.includes("sample-project") &&
      !process.env.DATABASE_URL.includes("user:password")
    ) {
      try {
        const dbProducts = await prisma.product.findMany({
          where: {
            active: true,
            OR: [
              { name: { contains: rawQuery, mode: "insensitive" } },
              { shortName: { contains: rawQuery, mode: "insensitive" } },
              { description: { contains: rawQuery, mode: "insensitive" } },
              { category: { name: { contains: rawQuery, mode: "insensitive" } } },
            ],
          },
          include: {
            category: true,
          },
          take: 8,
          orderBy: { sortOrder: "asc" },
        });

        results = dbProducts.map((p) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          shortName: p.shortName,
          mrp: p.mrp,
          basePrice: p.basePrice,
          categoryName: p.category.name,
          template: p.slug.split("-")[0] || "tee",
        }));
      } catch {
        // Fallback to in-memory catalogue
      }
    }

    // In-memory fallback search if DB was empty or unavailable
    if (results.length === 0) {
      const fallbackList = Object.values(CATALOG_FALLBACK);
      results = fallbackList
        .filter(
          (p) =>
            p.name.toLowerCase().includes(rawQuery) ||
            p.slug.toLowerCase().includes(rawQuery)
        )
        .slice(0, 8)
        .map((p) => ({
          id: p.slug,
          slug: p.slug,
          name: p.name,
          shortName: p.name.split("(")[0].trim(),
          mrp: p.mrp,
          basePrice: p.basePrice,
          categoryName: "Custom Merch",
          template: p.template,
        }));
    }

    return NextResponse.json({
      success: true,
      query: rawQuery,
      count: results.length,
      results,
    });
  }
);

