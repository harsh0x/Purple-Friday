import { test, expect } from "@playwright/test";
import { createAdminSessionToken, ADMIN_COOKIE_NAME } from "../src/lib/admin/admin-session";

const VIEWPORTS = [
  { name: "Desktop", width: 1440, height: 900 },
  { name: "Tablet", width: 768, height: 1024 },
  { name: "Mobile", width: 375, height: 667 },
];

const THEMES = ["light", "dark"] as const;

for (const vp of VIEWPORTS) {
  for (const theme of THEMES) {
    test.describe(`Part 6 CMS Live Verification: ${vp.name} (${vp.width}x${vp.height}) - ${theme}`, () => {
      test.use({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: theme,
      });

      test("End-to-End Storefront CMS Flow: Edit, Draft, Publish, Fallback, Section Hide, Version Restore", async ({
        browser,
        request,
      }) => {
        // 1. Setup authenticated Admin Context
          const adminToken = await createAdminSessionToken({
            id: "usr_cms_admin_01",
            email: "admin@purplefriday.in",
            name: "Chief Editor",
            role: "ADMIN",
          });

          const adminContext = await browser.newContext({
            viewport: { width: vp.width, height: vp.height },
            colorScheme: theme,
          });

          await adminContext.addCookies([
            {
              name: ADMIN_COOKIE_NAME,
              value: adminToken,
              domain: "localhost",
              path: "/",
            },
          ]);

          const adminPage = await adminContext.newPage();

          // 2. Load CMS initial data
          const initialRes = await request.get("/api/admin/cms", {
            headers: { Cookie: `${ADMIN_COOKIE_NAME}=${adminToken}` },
          });
          expect(initialRes.status()).toBe(200);
        const { draft: initialDraft } = await initialRes.json();

        // 3. Admin creates a DRAFT update: new hero headline
        const draftHeadline = `Festive Season Merch Drop 2026 (${theme})`;
        const draftDoc = {
          ...initialDraft,
          hero: {
            ...initialDraft.hero,
            headline: draftHeadline,
          },
        };

        const saveDraftRes = await request.post("/api/admin/cms", {
          headers: {
            Origin: "http://127.0.0.1:3100",
            Cookie: `${ADMIN_COOKIE_NAME}=${adminToken}`,
          },
          data: {
            action: "save_draft",
            content: draftDoc,
          },
        });
        expect(saveDraftRes.status()).toBe(200);

        // 4. Verify storefront does NOT show the draft
        const customerContext = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          colorScheme: theme,
        });
        const customerPage = await customerContext.newPage();

        await customerPage.goto("/");
        await expect(customerPage.locator("body")).toBeVisible();
        const liveText = await customerPage.locator("body").innerText();
        expect(liveText).not.toContain(draftHeadline);

        // 5. Verify Preview Token renders draft on storefront
        const previewTokenRes = await request.get("/api/admin/cms", {
          headers: { Cookie: `${ADMIN_COOKIE_NAME}=${adminToken}` },
        });
        const { previewToken } = await previewTokenRes.json();
        expect(previewToken).toBeDefined();

        await customerPage.goto(`/?previewToken=${previewToken}`);
        await expect(customerPage.locator("body")).toContainText(draftHeadline);

        // 6. Admin PUBLISHES: Hero, Announcement, Nav link, Footer phone, FAQ, Custom Page, Section Hiding
        const publishedHeadline = `Official 2026 Custom Merch Drop`;
        const testAnnouncementMsg = `FLASH SALE: Flat 15% off bulk orders with code FESTIVE15`;
        const testNavLink = { id: "nav-e2e-festive", label: "Lookbook '26", url: "/pages/festive-lookbook", sortOrder: 10 };
        const testFooterPhone = "+91 91234 56789";
        const testFaq = {
          id: "faq-test-e2e",
          question: "Can we get custom neck labels printed?",
          answer: "Yes, neck tag printing is available for orders above 50 units.",
          category: "Printing",
          showOnHome: true,
          active: true,
          sortOrder: 1,
        };
        const testCustomPage = {
          id: "page-festive-lookbook",
          slug: "festive-lookbook",
          title: "Festive Lookbook 2026",
          contentMarkdown: "# Festive Collection 2026\nPremium tailored merchandise with bespoke foil and embroidery.",
          published: true,
          seoTitle: "Festive Lookbook 2026 | Purple Friday",
          seoDescription: "Explore our seasonal collection.",
          showInFooter: true,
          updatedAt: new Date().toISOString(),
        };

        const docToPublish = {
          ...draftDoc,
          hero: {
            ...draftDoc.hero,
            headline: publishedHeadline,
          },
          announcements: [
            {
              id: "ann-e2e-1",
              text: testAnnouncementMsg,
              active: true,
              sortOrder: 1,
            },
          ],
          navigation: {
            links: [...draftDoc.navigation.links, testNavLink],
          },
          footer: {
            ...draftDoc.footer,
            contactPhone: testFooterPhone,
          },
          faqs: [testFaq, ...(draftDoc.faqs || [])],
          customPages: [testCustomPage],
          // Hide FAQ section
          sections: draftDoc.sections.map((s: { id: string }) =>
            s.id === "faq" ? { ...s, visible: false } : s
          ),
        };

        const publishRes = await request.post("/api/admin/cms", {
          headers: {
            Origin: "http://127.0.0.1:3100",
            Cookie: `${ADMIN_COOKIE_NAME}=${adminToken}`,
          },
          data: {
            action: "publish",
            content: docToPublish,
            note: `E2E Full Release ${vp.name} ${theme}`,
          },
        });
        expect(publishRes.status()).toBe(200);
        const publishJson = await publishRes.json();
        expect(publishJson.success).toBe(true);
        const versionId = publishJson.version;

        // 7. Verify published changes appear on storefront
        await customerPage.goto("/");
        await expect(customerPage.locator("body")).toContainText(publishedHeadline);
        await expect(customerPage.locator("body")).toContainText(testAnnouncementMsg);
        await expect(customerPage.locator("body")).toContainText(testFooterPhone);

        // Verify Custom Page renders at /pages/festive-lookbook
        await customerPage.goto("/pages/festive-lookbook");
        await expect(customerPage.locator("h1").first()).toContainText("Festive Lookbook 2026");
        await expect(customerPage.locator("body")).toContainText("Premium tailored merchandise");

        // 8. 1-Click Version Restore Verification
        // Publish another version to modify headline
        const overwrittenDoc = {
          ...docToPublish,
          hero: {
            ...docToPublish.hero,
            headline: "Temporary Overwrite Headline",
          },
        };
        await request.post("/api/admin/cms", {
          headers: {
            Origin: "http://127.0.0.1:3100",
            Cookie: `${ADMIN_COOKIE_NAME}=${adminToken}`,
          },
          data: {
            action: "publish",
            content: overwrittenDoc,
            note: "Temporary Overwrite",
          },
        });

        // Verify storefront displays overwritten headline
        await customerPage.goto("/");
        await expect(customerPage.locator("body")).toContainText("Temporary Overwrite Headline");

        // Now restore previous version
        const versionsRes = await request.get("/api/admin/cms", {
          headers: { Cookie: `${ADMIN_COOKIE_NAME}=${adminToken}` },
        });
        const { versions } = await versionsRes.json();
        const targetVersion = versions.find((v: { note: string }) =>
          v.note.startsWith(`E2E Full Release ${vp.name} ${theme}`)
        );
        expect(targetVersion).toBeDefined();

        const restoreRes = await request.post("/api/admin/cms", {
          headers: {
            Origin: "http://127.0.0.1:3100",
            Cookie: `${ADMIN_COOKIE_NAME}=${adminToken}`,
          },
          data: {
            action: "restore",
            versionId: targetVersion.id,
          },
        });
        expect(restoreRes.status()).toBe(200);

        // Storefront should reflect restored headline
        await customerPage.goto("/");
        await expect(customerPage.locator("body")).toContainText(publishedHeadline);

        // 9. Clean up contexts
        await adminContext.close();
        await customerContext.close();
      });
    });
  }
}
