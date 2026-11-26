#!/usr/bin/env bash
# Copy the generated brand web kit from a checkout of antinode-style-assets.
#   scripts/sync-brand.sh ../antinode-style-assets
# Run after a brand release, then commit. Never edit site/assets/brand/ by hand.
set -euo pipefail
src="${1:?usage: scripts/sync-brand.sh PATH-TO-antinode-style-assets}"
here="$(cd "$(dirname "$0")/.." && pwd)"
dst="$here/site"
web="$src/templates/web"; exp="$src/brand/export"
[[ -f "$web/antinode.css" ]] || { echo "not a brand repo: $src" >&2; exit 1; }

rm -rf "$dst/assets/brand"; mkdir -p "$dst/assets/brand/fonts" "$dst/assets/img"
cp "$web/antinode.css" "$web/antinode.js" "$dst/assets/brand/"
cp "$web"/fonts/*.woff2 "$dst/assets/brand/fonts/"
cp "$exp/favicon.svg" "$exp/favicon.ico" "$dst/"
cp "$exp/antinode-app-icon-180.png" "$dst/apple-touch-icon.png"
cp "$exp/antinode-app-icon-512.png" "$dst/assets/img/icon-512.png"
sed -n 's/^version *= *"\(.*\)"/\1/p' "$src/brand/brand.toml" | head -1 > "$dst/assets/brand/VERSION"
echo "brand $(cat "$dst/assets/brand/VERSION") synced from $src"
echo "If the logo changed, regenerate the social image: npm run og-image"
