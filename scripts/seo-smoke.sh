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

check_structured_data_graph() {
  local url="$1"
  local label="$2"
  local html
  html="$(curl -sL "$url")"

  if printf '%s' "$html" | node -e '
    let html = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => { html += chunk; });
    process.stdin.on("end", () => {
      const scripts = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
      const graphs = scripts
        .map((match) => {
          try { return JSON.parse(match[1]); } catch { return null; }
        })
        .filter((value) => value && Array.isArray(value["@graph"]));
      if (graphs.length !== 1) process.exit(1);
      const nodes = graphs[0]["@graph"];
      const hasId = (suffix) => nodes.some((node) => typeof node["@id"] === "string" && node["@id"].endsWith(suffix));
      const hasType = (type) => nodes.some((node) => node["@type"] === type);
      if (!hasId("/#business") || !hasId("/#website") || !hasType("WebPage") || !hasType("BreadcrumbList")) process.exit(1);
    });
  '; then
    echo "PASS  $label contains one parseable connected graph"
    pass_count=$((pass_count + 1))
  else
    echo "FAIL  $label must contain one graph with #business, #website, WebPage, and BreadcrumbList"
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
check_structured_data_graph "$TARGET/" "homepage HTML"

echo

echo "Summary: ${pass_count} passed, ${fail_count} failed"

if [[ "$fail_count" -gt 0 ]]; then
  exit 1
fi

echo "SEO smoke checks passed"
