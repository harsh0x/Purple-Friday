import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/admin/audit";

async function safeRevalidateTag(tag: string) {
  try {
    const { revalidateTag } = await import("next/cache");
    revalidateTag(tag);
  } catch {}
}

async function safeRevalidatePath(path: string) {
  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath(path);
  } catch {}
}
import {
  StorefrontCmsDocument,
  StorefrontCmsDocumentSchema,
  DEFAULT_CMS_DOCUMENT,
} from "./schema";

export interface CmsVersionSnapshot {
  id: string;
  version: number;
  content: StorefrontCmsDocument;
  publishedBy: string;
  publishedAt: string;
  note?: string;
}

// In-memory persistent state (fallback when database is not connected or in tests)
let publishedDocument: StorefrontCmsDocument = JSON.parse(JSON.stringify(DEFAULT_CMS_DOCUMENT));
let draftDocument: StorefrontCmsDocument = JSON.parse(JSON.stringify(DEFAULT_CMS_DOCUMENT));
let currentVersionNumber = 1;
const versionHistory: CmsVersionSnapshot[] = [
  {
    id: "ver-init-1",
    version: 1,
    content: JSON.parse(JSON.stringify(DEFAULT_CMS_DOCUMENT)),
    publishedBy: "System (Default Baseline)",
    publishedAt: new Date().toISOString(),
    note: "Initial system default baseline",
  },
];

const PREVIEW_SECRET = process.env.ADMIN_JWT_SECRET || "purple-friday-preview-secret-key-2026";

/**
 * Creates an HMAC-signed preview token for previewing draft content.
 */
export function createCmsPreviewToken(actor: string = "Admin"): string {
  const payload = `${actor}:${Date.now()}`;
  const sig = crypto.createHmac("sha256", PREVIEW_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

/**
 * Verifies an HMAC-signed preview token (expires after 2 hours).
 */
export function verifyCmsPreviewToken(token: string): boolean {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const parts = raw.split(":");
    if (parts.length < 3) return false;
    const [actor, timestampStr, sig] = parts;
    const timestamp = Number(timestampStr);
    if (isNaN(timestamp) || Date.now() - timestamp > 2 * 3600 * 1000) {
      return false; // expired
    }
    const expectedSig = crypto
      .createHmac("sha256", PREVIEW_SECRET)
      .update(`${actor}:${timestampStr}`)
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
  } catch {
    return false;
  }
}

/**
 * Get active published CMS document with caching and sensible fallback.
 * If a valid preview token is provided, returns the draft document.
 */
export async function getPublishedCms(previewToken?: string | null): Promise<StorefrontCmsDocument> {
  if (previewToken && verifyCmsPreviewToken(previewToken)) {
    return getDraftCms();
  }

  try {
    if (prisma && process.env.DATABASE_URL) {
      const row = await prisma.cmsContent.findUnique({ where: { id: "active" } });
      if (row && row.content) {
        const parsed = StorefrontCmsDocumentSchema.safeParse(row.content);
        if (parsed.success) {
          publishedDocument = parsed.data;
          currentVersionNumber = row.version;
          return parsed.data;
        }
      }
    }
  } catch {
    // Database unavailable, fallback to memory
  }

  return publishedDocument;
}

/**
 * Get current draft CMS document.
 */
export async function getDraftCms(): Promise<StorefrontCmsDocument> {
  try {
    if (prisma && process.env.DATABASE_URL) {
      const row = await prisma.cmsContent.findUnique({ where: { id: "draft" } });
      if (row && row.content) {
        const parsed = StorefrontCmsDocumentSchema.safeParse(row.content);
        if (parsed.success) {
          draftDocument = parsed.data;
          return parsed.data;
        }
      }
    }
  } catch {
    // Database unavailable, fallback to memory
  }

  return draftDocument;
}

/**
 * Save draft CMS document (does not publish to live storefront).
 */
export async function saveDraftCms(
  content: unknown,
  actor: { name: string; role: string }
): Promise<{ success: boolean; draft: StorefrontCmsDocument }> {
  const validated = StorefrontCmsDocumentSchema.parse(content);
  draftDocument = validated;

  try {
    if (prisma && process.env.DATABASE_URL) {
      const jsonValue = validated as unknown as Prisma.InputJsonValue;
      await prisma.cmsContent.upsert({
        where: { id: "draft" },
        create: {
          id: "draft",
          status: "DRAFT",
          version: currentVersionNumber,
          content: jsonValue,
          publishedBy: actor.name,
        },
        update: {
          content: jsonValue,
          publishedBy: actor.name,
        },
      });
    }
  } catch {
    // Fallback to memory
  }

  await writeAudit({
    actor: actor.name,
    actorRole: actor.role,
    action: "cms.draft_saved",
    entityType: "CMS",
    entityId: "draft",
    after: { sectionsCount: validated.sections.length, faqsCount: validated.faqs.length },
  });

  return { success: true, draft: validated };
}

/**
 * Publish CMS document to live storefront.
 * Trims version history to keep the last 10 versions.
 * Revalidates cache tags and storefront path.
 */
export async function publishCms(
  content: unknown,
  actor: { name: string; role: string },
  note?: string
): Promise<{ success: boolean; published: StorefrontCmsDocument; version: number }> {
  const validated = StorefrontCmsDocumentSchema.parse(content);
  publishedDocument = validated;
  draftDocument = validated;
  currentVersionNumber += 1;

  const versionSnapshot: CmsVersionSnapshot = {
    id: `ver-${currentVersionNumber}-${Date.now()}`,
    version: currentVersionNumber,
    content: JSON.parse(JSON.stringify(validated)),
    publishedBy: actor.name,
    publishedAt: new Date().toISOString(),
    note: note || "Published CMS Update",
  };

  // Keep last 10 versions
  versionHistory.unshift(versionSnapshot);
  if (versionHistory.length > 10) {
    versionHistory.length = 10;
  }

  try {
    if (prisma && process.env.DATABASE_URL) {
      const jsonValue = validated as unknown as Prisma.InputJsonValue;
      await prisma.cmsContent.upsert({
        where: { id: "active" },
        create: {
          id: "active",
          status: "PUBLISHED",
          version: currentVersionNumber,
          content: jsonValue,
          publishedAt: new Date(),
          publishedBy: actor.name,
        },
        update: {
          status: "PUBLISHED",
          version: currentVersionNumber,
          content: jsonValue,
          publishedAt: new Date(),
          publishedBy: actor.name,
        },
      });

      await prisma.cmsVersion.create({
        data: {
          id: versionSnapshot.id,
          version: currentVersionNumber,
          content: jsonValue,
          publishedBy: actor.name,
          note: note || "Published CMS Update",
        },
      });

      // Trim database versions to keep last 10
      const allDbVersions = await prisma.cmsVersion.findMany({
        orderBy: { publishedAt: "desc" },
        select: { id: true },
      });
      if (allDbVersions.length > 10) {
        const toDelete = allDbVersions.slice(10).map((v) => v.id);
        await prisma.cmsVersion.deleteMany({
          where: { id: { in: toDelete } },
        });
      }
    }
  } catch {
    // Fallback to memory
  }

  // Next.js cache revalidation
  try {
    safeRevalidateTag("cms");
    safeRevalidateTag("cms-content");
    safeRevalidatePath("/");
  } catch {
    // Ignore in non-request test contexts
  }

  await writeAudit({
    actor: actor.name,
    actorRole: actor.role,
    action: "cms.published",
    entityType: "CMS",
    entityId: `version_${currentVersionNumber}`,
    after: {
      version: currentVersionNumber,
      heroHeadline: validated.hero.headline,
      announcementsCount: validated.announcements.length,
      note,
    },
  });

  return { success: true, published: validated, version: currentVersionNumber };
}

/**
 * Restore a previous version from the version history.
 */
export async function restoreCmsVersion(
  versionId: string,
  actor: { name: string; role: string }
): Promise<{ success: boolean; restored: StorefrontCmsDocument; version: number }> {
  let targetVersion = versionHistory.find((v) => v.id === versionId);

  if (!targetVersion && prisma) {
    try {
      const dbVer = await prisma.cmsVersion.findUnique({ where: { id: versionId } });
      if (dbVer && dbVer.content) {
        const parsed = StorefrontCmsDocumentSchema.safeParse(dbVer.content);
        if (parsed.success) {
          targetVersion = {
            id: dbVer.id,
            version: dbVer.version,
            content: parsed.data,
            publishedBy: dbVer.publishedBy,
            publishedAt: dbVer.publishedAt.toISOString(),
            note: dbVer.note || undefined,
          };
        }
      }
    } catch {
      // ignore
    }
  }

  if (!targetVersion) {
    throw new Error(`Version ${versionId} not found in history`);
  }

  const result = await publishCms(
    targetVersion.content,
    actor,
    `Restored from Version #${targetVersion.version} (originally published by ${targetVersion.publishedBy})`
  );

  await writeAudit({
    actor: actor.name,
    actorRole: actor.role,
    action: "cms.version_restored",
    entityType: "CMS",
    entityId: versionId,
    after: { restoredVersion: targetVersion.version, newVersion: result.version },
  });

  return { success: true, restored: result.published, version: result.version };
}

/**
 * Get the version history list (last 10 versions).
 */
export async function getCmsVersionHistory(): Promise<CmsVersionSnapshot[]> {
  try {
    if (prisma && process.env.DATABASE_URL) {
      const dbVersions = await prisma.cmsVersion.findMany({
        orderBy: { publishedAt: "desc" },
        take: 10,
      });
      if (dbVersions.length > 0) {
        return dbVersions.map((v) => ({
          id: v.id,
          version: v.version,
          content: v.content as unknown as StorefrontCmsDocument,
          publishedBy: v.publishedBy,
          publishedAt: v.publishedAt.toISOString(),
          note: v.note || undefined,
        }));
      }
    }
  } catch {
    // Fallback to memory
  }

  return versionHistory;
}
