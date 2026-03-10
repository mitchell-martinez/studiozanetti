#!/usr/bin/env bash
set -u

TARGET="${1:-${SITE_URL:-https://studiozanetti.com.au}}"
TARGET="${TARGET%/}"

pass_count=0
fail_count=0

check_status() {
  local url="$1"
  local expected="$2"
  local label="$3"

  local status
  status="$(curl -sSI "$url" | head -n 1 | awk '{print $2}')"

  if [[ "$status" == "$expected" ]]; then
    echo "PASS  $label ($url) -> $status"
    pass_count=$((pass_count + 1))
  else
    echo "FAIL  $label ($url) -> got ${status:-none}, expected $expected"
    fail_count=$((fail_count + 1))
  fi
}

check_body_contains() {
  local url="$1"
  local needle="$2"
  local label="$3"

  if curl -sL "$url" | grep -Fqi "$needle"; then
    echo "PASS  $label contains '$needle'"
    pass_count=$((pass_count + 1))
  else
    echo "FAIL  $label missing '$needle'"
    fail_count=$((fail_count + 1))
  fi
}

echo "SEO smoke checks for: $TARGET"
echo

check_status "$TARGET/" "200" "Home"
check_status "$TARGET/robots.txt" "200" "robots.txt"
check_status "$TARGET/sitemap.xml" "200" "sitemap.xml"

check_body_contains "$TARGET/robots.txt" "User-agent: *" "robots.txt"
check_body_contains "$TARGET/robots.txt" "Sitemap:" "robots.txt"
check_body_contains "$TARGET/sitemap.xml" "<urlset" "sitemap.xml"

check_body_contains "$TARGET/" "rel=\"canonical\"" "homepage HTML"
check_body_contains "$TARGET/" "application/ld+json" "homepage HTML"

echo

echo "Summary: ${pass_count} passed, ${fail_count} failed"

if [[ "$fail_count" -gt 0 ]]; then
  exit 1
fi

echo "SEO smoke checks passed"
