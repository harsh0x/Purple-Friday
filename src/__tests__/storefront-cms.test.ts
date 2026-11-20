import { describe, it, expect, beforeEach } from "vitest";
import {
  getPublishedCms,
  getDraftCms,
  saveDraftCms,
  publishCms,
  restoreCmsVersion,
  getCmsVersionHistory,
  createCmsPreviewToken,
  verifyCmsPreviewToken,
} from "@/server/cms/cms-service";
import {
  DEFAULT_CMS_DOCUMENT,
  StorefrontCmsDocumentSchema,
  sanitizePlainText,
} from "@/server/cms/schema";

describe("Part 6: No-Code Storefront CMS & Version Control", () => {
  const mockSuperAdmin = { name: "Ananya SuperAdmin", role: "SUPER_ADMIN" };

  beforeEach(async () => {
    // Reset to defaults before each test
    await publishCms(DEFAULT_CMS_DOCUMENT, mockSuperAdmin, "Reset baseline");
  });

  it("returns sensible default CMS document when storage is unpopulated", async () => {
    const cms = await getPublishedCms();
    expect(cms).toBeDefined();
    expect(cms.hero.headline).toContain("India's Cleanest Custom Merch");
    expect(cms.sections.length).toBeGreaterThanOrEqual(10);
    expect(cms.announcements.length).toBeGreaterThan(0);
    expect(cms.faqs.length).toBeGreaterThan(0);
  });

  it("sanitizes plain text and enforces strict field length limits", () => {
    const raw = "<script>alert('xss')</script>Hello <b>World</b>";
    const clean = sanitizePlainText(raw);
    expect(clean).not.toContain("<script>");
    expect(clean).not.toContain("<b>");
    expect(clean).toBe("alert('xss')Hello World");

    // Fails on overly long headline (>100 chars)
    const invalidDoc = {
      ...DEFAULT_CMS_DOCUMENT,
      hero: {
        ...DEFAULT_CMS_DOCUMENT.hero,
        headline: "A".repeat(150),
      },
    };
    const parsed = StorefrontCmsDocumentSchema.safeParse(invalidDoc);
    expect(parsed.success).toBe(false);
  });

  it("saves draft without altering published storefront", async () => {
    const modifiedDraft = {
      ...DEFAULT_CMS_DOCUMENT,
      hero: {
        ...DEFAULT_CMS_DOCUMENT.hero,
        headline: "Draft Festive Headline Test",
      },
    };

    const draftResult = await saveDraftCms(modifiedDraft, mockSuperAdmin);
    expect(draftResult.success).toBe(true);

    // Published content must still be unchanged
    const published = await getPublishedCms();
    expect(published.hero.headline).not.toBe("Draft Festive Headline Test");

    // Draft getter retrieves the updated draft
    const draft = await getDraftCms();
    expect(draft.hero.headline).toBe("Draft Festive Headline Test");
  });

  it("publishes updates to live storefront and creates version snapshot", async () => {
    const modifiedDoc = {
      ...DEFAULT_CMS_DOCUMENT,
      hero: {
        ...DEFAULT_CMS_DOCUMENT.hero,
        headline: "Brand New Live Published Headline",
      },
    };

    const pubResult = await publishCms(modifiedDoc, mockSuperAdmin, "Holiday 2026 Launch");
    expect(pubResult.success).toBe(true);
    expect(pubResult.version).toBeGreaterThan(1);

    const live = await getPublishedCms();
    expect(live.hero.headline).toBe("Brand New Live Published Headline");

    const history = await getCmsVersionHistory();
    expect(history.length).toBeGreaterThan(1);
    expect(history[0].note).toBe("Holiday 2026 Launch");
    expect(history[0].publishedBy).toBe("Ananya SuperAdmin");
  });

  it("restores a previous version with 1-click rollback", async () => {
    // 1. Publish Version A
    const docA = {
      ...DEFAULT_CMS_DOCUMENT,
      hero: { ...DEFAULT_CMS_DOCUMENT.hero, headline: "Headline Version A" },
    };
    await publishCms(docA, mockSuperAdmin, "Version A");

    const historyAfterA = await getCmsVersionHistory();
    const versionAId = historyAfterA[0].id;

    // 2. Publish Version B
    const docB = {
      ...DEFAULT_CMS_DOCUMENT,
      hero: { ...DEFAULT_CMS_DOCUMENT.hero, headline: "Headline Version B" },
    };
    await publishCms(docB, mockSuperAdmin, "Version B");

    const liveBeforeRestore = await getPublishedCms();
    expect(liveBeforeRestore.hero.headline).toBe("Headline Version B");

    // 3. Restore Version A
    const restoreResult = await restoreCmsVersion(versionAId, mockSuperAdmin);
    expect(restoreResult.success).toBe(true);

    const liveAfterRestore = await getPublishedCms();
    expect(liveAfterRestore.hero.headline).toBe("Headline Version A");
  });

  it("generates and verifies HMAC-signed preview tokens for draft viewing", async () => {
    const token = createCmsPreviewToken("Ananya SuperAdmin");
    expect(typeof token).toBe("string");
    expect(verifyCmsPreviewToken(token)).toBe(true);

    // Invalid tokens rejected
    expect(verifyCmsPreviewToken("tampered-token-value")).toBe(false);

    // Draft is returned when preview token is passed to getPublishedCms
    const draftDoc = {
      ...DEFAULT_CMS_DOCUMENT,
      hero: { ...DEFAULT_CMS_DOCUMENT.hero, headline: "Sneak Peek Headline" },
    };
    await saveDraftCms(draftDoc, mockSuperAdmin);

    const liveWithoutToken = await getPublishedCms();
    expect(liveWithoutToken.hero.headline).not.toBe("Sneak Peek Headline");

    const previewWithToken = await getPublishedCms(token);
    expect(previewWithToken.hero.headline).toBe("Sneak Peek Headline");
  });

  it("limits version history to last 10 snapshots", async () => {
    for (let i = 1; i <= 15; i++) {
      await publishCms(
        {
          ...DEFAULT_CMS_DOCUMENT,
          hero: { ...DEFAULT_CMS_DOCUMENT.hero, headline: `Iteration #${i}` },
        },
        mockSuperAdmin,
        `Iter ${i}`
      );
    }

    const history = await getCmsVersionHistory();
    expect(history.length).toBeLessThanOrEqual(10);
  });
});
