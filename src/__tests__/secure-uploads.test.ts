import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { processAndStoreUpload, getUploadById, verifyUploadOwnership } from "@/lib/uploads";
import { sanitizeSvg } from "@/lib/security/sanitize-svg";

describe("Secure Uploads Engine (Step 3A)", () => {
  const dummyUploader = "anon_session_test_12345";

  it("rejects an empty 0-byte file", async () => {
    const emptyBuffer = Buffer.alloc(0);
    await expect(
      processAndStoreUpload({
        buffer: emptyBuffer,
        originalFilename: "empty.png",
        uploaderId: dummyUploader,
      })
    ).rejects.toThrow(/empty/i);
  });

  it("rejects an oversized image file (>5 MB)", async () => {
    // Generate valid small PNG and append padding to exceed 5 MB
    const realPng = await sharp({
      create: { width: 10, height: 10, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } },
    })
      .png()
      .toBuffer();
    const oversizedPng = Buffer.concat([realPng, Buffer.alloc(5.5 * 1024 * 1024)]);

    await expect(
      processAndStoreUpload({
        buffer: oversizedPng,
        originalFilename: "huge.png",
        uploaderId: dummyUploader,
      })
    ).rejects.toThrow(/exceeds image size limit/i);
  });

  it("rejects any file exceeding the absolute 10 MB limit", async () => {
    const hugeBuffer = Buffer.alloc(11 * 1024 * 1024);
    await expect(
      processAndStoreUpload({
        buffer: hugeBuffer,
        originalFilename: "huge.dat",
        uploaderId: dummyUploader,
      })
    ).rejects.toThrow(/exceeds maximum upload limit/i);
  });

  it("rejects wrong extension vs magic bytes mismatch (fake PNG that is text)", async () => {
    const fakePng = Buffer.from("Hello world, this is just plain text disguised as an image.");
    await expect(
      processAndStoreUpload({
        buffer: fakePng,
        originalFilename: "malicious.png",
        uploaderId: dummyUploader,
      })
    ).rejects.toThrow();
  });

  it("rejects polyglot file (HTML container disguised as SVG)", async () => {
    const polyglotPayload = Buffer.from(
      `<!DOCTYPE html><html><body><svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40"/></svg><script>alert('pwned')</script></body></html>`
    );

    await expect(
      processAndStoreUpload({
        buffer: polyglotPayload,
        originalFilename: "polyglot.svg",
        uploaderId: dummyUploader,
      })
    ).rejects.toThrow(/polyglot/i);
  });

  it("sanitizes an SVG containing a <script> tag and rasterizes it into a clean PNG", async () => {
    const maliciousSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="40" fill="#6A2CFF"/>
        <script type="text/javascript">
          alert(document.cookie);
        </script>
      </svg>
    `;

    // Direct sanitizer check
    const { sanitizedSvg, hadScripts } = sanitizeSvg(maliciousSvg);
    expect(hadScripts).toBe(true);
    expect(sanitizedSvg).not.toContain("<script");
    expect(sanitizedSvg).not.toContain("alert");
    expect(sanitizedSvg).toContain("circle");

    // End-to-end processing: sharp rasterizes to safe PNG
    const upload = await processAndStoreUpload({
      buffer: Buffer.from(maliciousSvg),
      originalFilename: "logo_with_script.svg",
      uploaderId: dummyUploader,
      purpose: "logo",
    });

    expect(upload.id).toBeDefined();
    expect(upload.mimeType).toBe("image/png");
    expect(upload.width).toBeGreaterThan(0);
    expect(upload.height).toBeGreaterThan(0);

    // Verify stored file is accessible and has ownership verification
    const stored = getUploadById(upload.id);
    expect(stored).toBeDefined();
    expect(verifyUploadOwnership(upload.id, dummyUploader)).toBe(true);
    expect(verifyUploadOwnership(upload.id, "different_hacker_session")).toBe(false);
  });

  it("re-encodes valid PNGs with sharp, stripping metadata and keeping opaque ID", async () => {
    // Generate valid 100x100 PNG using sharp
    const validPngBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 106, g: 44, b: 255, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const upload = await processAndStoreUpload({
      buffer: validPngBuffer,
      originalFilename: "brand_logo.png",
      uploaderId: dummyUploader,
      purpose: "logo",
    });

    expect(upload.mimeType).toBe("image/png");
    expect(upload.width).toBe(100);
    expect(upload.height).toBe(100);
    expect(upload.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });
});
