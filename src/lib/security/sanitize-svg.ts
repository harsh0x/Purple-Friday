import DOMPurify from "isomorphic-dompurify";

export interface SvgSanitizeResult {
  sanitizedSvg: string;
  hadScripts: boolean;
  isPolyglot: boolean;
}

/**
 * Sanitizes SVG markup to strictly prevent XSS, scripts, and polyglot execution.
 * Configured with SVG profile and strict tag/attribute prohibitions.
 */
export function sanitizeSvg(rawSvg: string | Buffer): SvgSanitizeResult {
  const content = typeof rawSvg === "string" ? rawSvg : rawSvg.toString("utf-8");

  // Check for polyglot markers (e.g. HTML containers mixed with SVG)
  const lower = content.toLowerCase();
  const isPolyglot =
    lower.includes("<html") ||
    lower.includes("<body") ||
    lower.includes("<!doctype html") ||
    lower.includes("<iframe") ||
    lower.includes("<embed") ||
    lower.includes("<object");

  const hadScripts =
    lower.includes("<script") ||
    lower.includes("javascript:") ||
    lower.includes("onload=") ||
    lower.includes("onerror=") ||
    lower.includes("onclick=");

  // DOMPurify with strict SVG Profile
  const cleaned = DOMPurify.sanitize(content, {
    USE_PROFILES: { svg: true, svgFilters: false },
    FORBID_TAGS: [
      "script",
      "foreignObject",
      "iframe",
      "embed",
      "object",
      "use",
      "image",
      "style",
      "link",
      "meta",
      "base",
      "a",
    ],
    FORBID_ATTR: [
      "onerror",
      "onload",
      "onclick",
      "onmouseover",
      "onfocus",
      "onblur",
      "href",
      "xlink:href",
      "src",
    ],
    ALLOW_DATA_ATTR: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  });

  // Ensure output is valid SVG and does not contain remaining dangerous tags
  if (!cleaned.toLowerCase().includes("<svg")) {
    throw new Error("Invalid SVG: Missing root <svg> element.");
  }

  if (cleaned.toLowerCase().includes("<script")) {
    throw new Error("Dangerous SVG: Script tags could not be completely neutralized.");
  }

  return {
    sanitizedSvg: cleaned,
    hadScripts,
    isPolyglot,
  };
}
