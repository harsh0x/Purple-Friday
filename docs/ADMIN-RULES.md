# ADMIN-RULES.md

## TOKEN RULES
- Do not re-read whole project; read docs first, then only needed files via targeted search.
- Edit in place with small changes; never regenerate whole files. No long logs or file dumps in chat.
- After each step run typecheck and affected tests; run lint, build, full tests once at prompt end.
- No screenshots unless a test fails and reason is unclear. Add max 10 lines to docs/ADMIN-PROGRESS.md per prompt. Final report max 12 lines.

## CODE RULES
- Smallest correct code; one line if one line works; reuse what exists.
- Delete anything replaced or removed (code, routes, tests, scripts, unused imports, env vars, dependencies).
- No new library unless essential and compatible; no TODO or dead code.
- Migrations never delete real data; drop a table only if it holds demo data only; never touch AuditLog rows.
- Money is integer paise. Dates UTC, shown in India time (Asia/Kolkata).

## SECURITY RULES
- Every admin page, server action, and API route calls requireAdmin() on server.
- Validate input with Zod; rate limit; check Origin on mutations; generic error messages; secrets only in server env.
- Uploads type-checked by bytes and re-encoded; no raw HTML rendering.
- Every editable record has version field; stale save shows "Someone changed this, refresh".
- Colours only via CSS variables (light and dark). Admin never shows storefront chrome.
