#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/release-cli}"
STAGE="$(mktemp -d "${TMPDIR:-/tmp}/webinar-magus-runtime.XXXXXX")"
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$OUT" "$STAGE/runtime"
tar -C "$ROOT" --exclude='.git' --exclude='.github' --exclude='.env' --exclude='.env.*' --exclude='node_modules' --exclude='desktop' --exclude='dist' --exclude='store' --exclude='release' --exclude='release-cli' --exclude='*.log' -cf - . | tar -C "$STAGE/runtime" -xf -
VERSION="$(node -e "const p=require('$ROOT/package.json'); process.stdout.write(String(p.version || '0.0.0'))")"
printf '{"version":"%s"}\n' "$VERSION" > "$OUT/version.json"
ARCHIVE="$OUT/webinar-magus-runtime.tar.gz"
tar -C "$STAGE/runtime" -czf "$ARCHIVE" .
if command -v shasum >/dev/null 2>&1; then
  shasum -a 256 "$ARCHIVE" | awk '{print $1 "  webinar-magus-runtime.tar.gz"}' > "$ARCHIVE.sha256"
else
  sha256sum "$ARCHIVE" | awk '{print $1 "  webinar-magus-runtime.tar.gz"}' > "$ARCHIVE.sha256"
fi
echo "Created $ARCHIVE"
echo "Created $OUT/version.json"
