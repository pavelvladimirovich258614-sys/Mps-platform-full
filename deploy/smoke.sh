#!/usr/bin/env bash
set -euo pipefail

: "${BASE_URL:?Usage: BASE_URL=https://example.ru $0}"
post_slug=${POST_SLUG:-}
curl -fsSI "$BASE_URL/" | grep -Eiq '^HTTP/.* 200'
curl -fsS "$BASE_URL/sitemap.xml" | grep -q '<urlset'
curl -fsS "$BASE_URL/robots.txt" | grep -q 'Sitemap:'
curl -fsSI "$BASE_URL/" | grep -qi '^strict-transport-security:'
if [[ -n "$post_slug" ]]; then
  curl -fsS -A Googlebot "$BASE_URL/posts/$post_slug" | grep -q 'og:title'
fi
echo "[OK] smoke passed: $BASE_URL"
