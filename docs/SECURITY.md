# Purple Friday Security Architecture & Threat Model

This document outlines the security controls, defensive countermeasures, threat model, and vulnerability disclosure protocols enforced across the **Purple Friday** custom merchandise e-commerce platform.

---

## 1. Threat Model & Key Attack Vectors

| Attack Vector | Threat Scenario | Defensive Implementation |
| :--- | :--- | :--- |
| **Malicious File Uploads** | Polyglot files, embedded script execution in SVGs, web shells disguised as images. | Magic byte inspection via `file-type`, strict DOMPurify SVG profile stripping all script/foreign tags, PNG rasterization via `sharp`, dimension caps (4000px), EXIF stripping, randomized UUID storage names. |
| **Formula Injection (DDE CSV)** | Admin exporting orders containing malicious payloads (`=cmd|...`, `+`, `-`, `@`) executing on staff machines. | `sanitizeCsvCell` prepends single quotes (`'`) to any cell beginning with `=`, `+`, `-`, `@`, `\t`, or `\r`. |
| **Price Tampering** | Attacker modifying line totals, discounts, or unit prices in client cart payloads. | Server-side price recalculation (`calculateCartPricing`). The server strictly computes line items and quantities against authoritative tier structures, discarding any client price claims. |
| **Authentication Brute-Force** | Credential stuffing against customer and admin accounts. | Account lockout for 15 minutes after 5 consecutive failures, bcrypt (cost factor 12), and zxcvbn-style dictionary blacklists enforcing 10+ character multi-entropy passwords. |
| **Timing Attacks** | Timing disparity during payment signature or token verification. | `crypto.timingSafeEqual` used on all Razorpay HMAC-SHA256 signatures and authentication token validations. |
| **Cross-Site Scripting (XSS)** | Injected JavaScript in customer reviews, design text, or chat inputs. | Strict enforcing Content-Security-Policy (CSP) with dynamic base64 nonces, `strict-dynamic`, `object-src 'none'`, and plain-text-only rendering in the assistant widget. |
| **Cross-Site Request Forgery (CSRF)** | Unauthorized state mutations triggered from external origins. | Strict same-origin header checking (`isSameOrigin`), SameSite cookies, and `strict-origin-when-cross-origin` referrer policy. |
| **Insecure Direct Object Reference (IDOR)** | User attempting to download or modify another user's pre-press proof or order. | Uploader session signature verification (`verifyUploadOwnership`) and user ID / email authorization boundaries on `/api/orders/*`. |
| **Denial of Service (DoS)** | Automated hammering of resource-heavy endpoints (Sharp re-encoding, PDF generation). | Sliding-window token-bucket rate limiters backed by Redis / LRU memory fallback on all API endpoints. |

---

## 2. Secure Upload Pipeline (`POST /api/uploads`)

1. **Rate Limiting**: Clamped to 20 uploads/minute per uploader session.
2. **Size Enforcement**: 5 MB hard limit for images, 10 MB for brief documents (PDF).
3. **Magic Byte Verification**: `file-type` inspects binary headers; files whose headers do not match their declared MIME type are immediately rejected.
4. **SVG Sanitization**:
   - `isomorphic-dompurify` applies a restricted SVG profile.
   - All `<script>`, `<foreignObject>`, `<iframe>`, `onload`, and external URL references are stripped.
   - The sanitized SVG is immediately rasterized into a high-density PNG using `sharp`.
5. **Image Normalization**:
   - Every PNG/JPG/WebP is re-encoded with `sharp`.
   - Dimensions are clamped to a max bounding box of 4000 × 4000 px.
   - All EXIF metadata, GPS coordinates, and embedded payload segments are permanently removed.
6. **Opaque Storage**:
   - Files are stored with random UUID filenames (`de099999-19e6-4654-ac7b-d1f46624eedd.png`).
   - Served via `/api/uploads/[id]` with `X-Content-Type-Options: nosniff`.
   - PDFs are served exclusively with `Content-Disposition: attachment`.

---

## 3. Authentication & Account Security Policy

- **Password Requirements**: Minimum 10 characters, at least one uppercase letter, one lowercase letter, one number, and one symbol. Rejects common passwords (e.g. `password`, `welcome123`).
- **Lockout Mechanism**: Tracked by email address. 5 failed password attempts trigger an immediate 15-minute lock.
- **Session Tokens**: Handled via NextAuth JWT with secure, HTTP-only, SameSite cookies.
- **Password Reset**: Constant-time generic responses preventing account enumeration. Reset tokens are single-use, 64-character cryptographic hex strings expiring in 60 minutes.

---

## 4. Rate Limits Schedule

| Route | Quota | Window | Fallback Action |
| :--- | :--- | :--- | :--- |
| `/api/uploads` | 20 requests | 60 seconds | 429 Too Many Requests |
| `/api/orders` | 10 requests | 60 seconds | 429 Too Many Requests |
| `/api/auth/*` | 5 requests | 60 seconds | 429 Too Many Requests |
| `/api/assistant` | 10 requests | 60 seconds | 429 Too Many Requests |
| `/api/reviews` | 5 requests | 60 seconds | 429 Too Many Requests |

---

## 5. Content Security Policy (Enforcing Mode)

The following enforcing policy is issued on all responses by `middleware.ts`:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{RANDOM_BASE64}' 'strict-dynamic' https://checkout.razorpay.com https://challenges.cloudflare.com; frame-src 'self' https://api.razorpay.com https://challenges.cloudflare.com; connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://res.cloudinary.com https://challenges.cloudflare.com https://generativelanguage.googleapis.com; img-src 'self' data: blob: https://res.cloudinary.com; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; report-uri /api/csp-report;
```

### Security Headers Suite
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(self on /design, () elsewhere), microphone=(), geolocation=(), payment=(self "https://checkout.razorpay.com")`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (in production)

---

## 6. Vulnerability Disclosure Policy

Purple Friday welcomes responsible vulnerability reports from the security research community.

- **Security Contact**: `security@purplefriday.in`
- **Response Commitment**: We acknowledge all reports within **48 hours** with an initial triage assessment.
- **Resolution Target**: Critical vulnerabilities will be patched within 7 business days.
- **Safe Harbor**: Security researchers who test within reasonable bounds, do not access other customers' private data, and report findings responsibly will not be subject to legal action.

