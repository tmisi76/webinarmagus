#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BASE_URL="${WEBINAR_MAGUS_DOWNLOAD_BASE:-https://autowebinar.hu/downloads/webinar-magus}"
CHANNEL="${WEBINAR_MAGUS_CHANNEL:-latest}"
ARCHIVE_URL="$BASE_URL/$CHANNEL/webinar-magus-runtime.tar.gz"
CHECKSUM_URL="$ARCHIVE_URL.sha256"
STORE_DIR="$INSTALL_DIR/store"
RESULT_FILE="$STORE_DIR/update.last-result"
LOG_FILE="$STORE_DIR/update.log"

mkdir -p "$STORE_DIR"
touch "$LOG_FILE"
exec > >(tee -a "$LOG_FILE") 2>&1

STATUS="failed"
PHASE="init"
MESSAGE=""
START_TS="$(date +%s)"

json_escape() {
  python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))' <<<"$1"
}

write_result() {
  local code="$1"
  printf '{"status":%s,"phase":%s,"code":%s,"old":%s,"new":%s,"message":%s,"ts":%s}\n'     "$(json_escape "$STATUS")"     "$(json_escape "$PHASE")"     "$code"     "$(json_escape "${OLD_VERSION:-unknown}")"     "$(json_escape "${NEW_VERSION:-unknown}")"     "$(json_escape "$MESSAGE")"     "$(date +%s)" > "$RESULT_FILE"
}
trap 'rc=$?; write_result "$rc"' EXIT

TMP="$(mktemp -d "${TMPDIR:-/tmp}/webinar-magus-update.XXXXXX")"
trap 'rc=$?; write_result "$rc"; rm -rf "$TMP"' EXIT
STAGE="$TMP/runtime"
mkdir -p "$STAGE"

OLD_VERSION="$(node -e "try{console.log(require('$INSTALL_DIR/package.json').version||'unknown')}catch(e){console.log('unknown')}" 2>/dev/null || echo unknown)"

echo ""
echo "🪄 Webinár Mágus frissítés"
echo "Jelenlegi verzió: $OLD_VERSION"

PHASE="download"
echo "Legfrissebb runtime letöltése…"
curl -fL --retry 3 --retry-delay 2 "$ARCHIVE_URL" -o "$TMP/runtime.tar.gz"
curl -fL --retry 3 --retry-delay 2 "$CHECKSUM_URL" -o "$TMP/runtime.tar.gz.sha256"

EXPECTED="$(awk '{print $1}' "$TMP/runtime.tar.gz.sha256" | tr -d '[:space:]')"
if command -v shasum >/dev/null 2>&1; then
  ACTUAL="$(shasum -a 256 "$TMP/runtime.tar.gz" | awk '{print $1}')"
else
  ACTUAL="$(sha256sum "$TMP/runtime.tar.gz" | awk '{print $1}')"
fi
if [ -z "$EXPECTED" ] || [ "$EXPECTED" != "$ACTUAL" ]; then
  MESSAGE="SHA-256 ellenőrzés sikertelen."
  echo "$MESSAGE" >&2
  exit 5
fi

PHASE="stage"
tar -xzf "$TMP/runtime.tar.gz" -C "$STAGE"
for required in package.json update.sh scripts/start.sh scripts/stop.sh; do
  [ -e "$STAGE/$required" ] || { MESSAGE="Hiányzó runtime fájl: $required"; echo "$MESSAGE" >&2; exit 6; }
done

# Never overwrite runtime/user state.
for protected in .env .lang store agents CLAUDE.md SOUL.md .mcp.json HEARTBEAT.md MEMORY.md HOT_MEMORY.md WARM_MEMORY.md COLD_MEMORY.md scheduled-tasks.json; do
  rm -rf "$STAGE/$protected"
done
rm -rf "$STAGE/assets/meetings" 2>/dev/null || true

NEW_VERSION="$(node -e "const p=require('$STAGE/package.json'); console.log(p.version||'unknown')")"
echo "Célverzió: $NEW_VERSION"

PHASE="build"
echo "Függőségek és build ellenőrzése stagingben…"
(
  cd "$STAGE"
  npm install --silent
  npm run build --silent
)

PHASE="stop"
echo "Szolgáltatások leállítása…"
bash "$INSTALL_DIR/scripts/stop.sh"

PHASE="deploy"
echo "Runtime frissítése…"
cp -R "$STAGE"/. "$INSTALL_DIR"/
chmod +x "$INSTALL_DIR/update.sh" "$INSTALL_DIR/scripts/update-runtime-bundle.sh" "$INSTALL_DIR/scripts/start.sh" "$INSTALL_DIR/scripts/stop.sh" 2>/dev/null || true

PHASE="start"
echo "Szolgáltatások indítása…"
bash "$INSTALL_DIR/scripts/start.sh"

PHASE="health"
PORT="$(grep -E '^WEB_PORT=' "$INSTALL_DIR/.env" 2>/dev/null | head -1 | cut -d= -f2- | tr -d ' "' || true)"
PORT="${PORT:-3420}"
ok=0
for _ in $(seq 1 30); do
  if curl -fsS -m 2 -o /dev/null "http://127.0.0.1:$PORT/" 2>/dev/null; then ok=1; break; fi
  sleep 1
done
if [ "$ok" -ne 1 ]; then
  MESSAGE="A frissített dashboard nem lett elérhető 30 másodpercen belül."
  echo "$MESSAGE" >&2
  exit 7
fi

STATUS="success"
PHASE="done"
MESSAGE="Webinár Mágus frissítve: $OLD_VERSION -> $NEW_VERSION"
echo "✓ $MESSAGE"
