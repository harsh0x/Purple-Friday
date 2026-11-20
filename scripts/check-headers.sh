#!/usr/bin/env bash
# Header validation script for Purple Friday production server

set -e

BASE_URL="${1:-http://localhost:3000}"

echo "========================================="
echo "Checking Security Headers on: $BASE_URL"
echo "========================================="

check_header() {
  local url="$1"
  local header_name="$2"
  local expected_substr="$3"

  local val
  val=$(curl -s -I "$url" | grep -i "^$header_name:" | tr -d '\r\n')

  if [[ -z "$val" ]]; then
    echo "❌ MISSING: $header_name on $url"
    return 1
  elif [[ -n "$expected_substr" && "$val" != *"$expected_substr"* ]]; then
    echo "⚠️ MISMATCH: $header_name found, but expected '$expected_substr'. Got: '$val'"
    return 1
  else
    echo "✅ PASS: $header_name ($val)"
    return 0
  fi
}

echo ""
echo "--- Testing Public Storefront Root (/) ---"
check_header "$BASE_URL/" "Content-Security-Policy" "frame-ancestors 'none'"
check_header "$BASE_URL/" "Strict-Transport-Security" "max-age="
check_header "$BASE_URL/" "X-Content-Type-Options" "nosniff"
check_header "$BASE_URL/" "Referrer-Policy" "strict-origin-when-cross-origin"
check_header "$BASE_URL/" "Permissions-Policy" "camera="
check_header "$BASE_URL/" "X-Frame-Options" "DENY"

echo ""
echo "--- Testing Admin Route (/admin) ---"
check_header "$BASE_URL/admin" "Cache-Control" "no-store"
check_header "$BASE_URL/admin" "Pragma" "no-cache"

echo ""
echo "--- Checking Absence of X-Powered-By ---"
POWERED_BY=$(curl -s -I "$BASE_URL/" | grep -i "^x-powered-by:" || true)
if [[ -z "$POWERED_BY" ]]; then
  echo "✅ PASS: X-Powered-By is absent"
else
  echo "❌ FAIL: X-Powered-By found ($POWERED_BY)"
  exit 1
fi

echo ""
echo "========================================="
echo "All Header Checks Completed Successfully!"
echo "========================================="
