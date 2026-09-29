#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${WEBINAR_MAGUS_DOWNLOAD_BASE:-https://autowebinar.hu/downloads/webinar-magus}"
CHANNEL="${WEBINAR_MAGUS_CHANNEL:-latest}"
INSTALL_DIR="${WEBINAR_MAGUS_INSTALL_DIR:-$HOME/webinar-magus}"
ARCHIVE_URL="$BASE_URL/$CHANNEL/webinar-magus-runtime.tar.gz"
CHECKSUM_URL="$ARCHIVE_URL.sha256"
REPAIR="${WEBINAR_MAGUS_REPAIR:-0}"

for arg in "$@"; do
  case "$arg" in
    --repair|--reinstall) REPAIR=1 ;;
    --help|-h)
      cat <<'EOF'
Webinár Mágus CLI telepítő

Használat:
  curl -fsSL https://autowebinar.hu/webinar-magus/install | bash

Régi/hibás telepítés biztonságos cseréje:
  curl -fsSL https://autowebinar.hu/webinar-magus/install | bash -s -- --repair

A --repair NEM törli a régi mappát: időbélyeges .backup-* könyvtárba mozgatja.
EOF
      exit 0
      ;;
    *) echo "Ismeretlen kapcsoló: $arg (használd: --help)" >&2; exit 2 ;;
  esac
done

echo ""
echo "  🪄 Webinár Mágus"
echo "  Terminálos telepítés"
echo ""

case "$(uname -s)" in
  Darwin|Linux) ;;
  *) echo "Ez a telepítő macOS/Linux rendszerhez készült." >&2; exit 1 ;;
esac

command -v curl >/dev/null 2>&1 || { echo "Hiányzik a curl." >&2; exit 1; }
command -v tar >/dev/null 2>&1 || { echo "Hiányzik a tar." >&2; exit 1; }

if [ -e "$INSTALL_DIR" ]; then
  if [ "$REPAIR" = "1" ]; then
    BACKUP_DIR="${INSTALL_DIR}.backup-$(date +%Y%m%d-%H%M%S)"
    echo "Meglévő telepítés található: $INSTALL_DIR"
    echo "Biztonsági mentés készül ide: $BACKUP_DIR"
    mv "$INSTALL_DIR" "$BACKUP_DIR"
    echo "✓ Régi telepítés biztonságosan félretéve."
  else
    CURRENT_VERSION=""
    if [ -f "$INSTALL_DIR/package.json" ]; then
      CURRENT_VERSION="$(node -p "try{require('$INSTALL_DIR/package.json').version}catch(e){''}" 2>/dev/null || true)"
    fi
    echo "Már létezik Webinár Mágus telepítés itt: $INSTALL_DIR"
    [ -n "$CURRENT_VERSION" ] && echo "Talált verzió: $CURRENT_VERSION"
    echo ""
    echo "Nem írom felül automatikusan, hogy az adataid és beállításaid megmaradjanak."
    echo ""
    echo "Indítás:"
    echo "  cd \"$INSTALL_DIR\" && bash scripts/start.sh"
    echo ""
    echo "Frissítés:"
    echo "  cd \"$INSTALL_DIR\" && bash update.sh"
    echo ""
    echo "Ha ez régi/hibás telepítés és tiszta újratelepítést szeretnél:"
    echo "  curl -fsSL https://autowebinar.hu/webinar-magus/install | bash -s -- --repair"
    echo ""
    exit 3
  fi
fi

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/webinar-magus-cli.XXXXXX")"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "Runtime letöltése…"
curl -fL --retry 3 --retry-delay 2 "$ARCHIVE_URL" -o "$TMP_DIR/runtime.tar.gz"
curl -fL --retry 3 --retry-delay 2 "$CHECKSUM_URL" -o "$TMP_DIR/runtime.tar.gz.sha256"

EXPECTED="$(awk '{print $1}' "$TMP_DIR/runtime.tar.gz.sha256" | tr -d '[:space:]')"
if command -v shasum >/dev/null 2>&1; then
  ACTUAL="$(shasum -a 256 "$TMP_DIR/runtime.tar.gz" | awk '{print $1}')"
else
  ACTUAL="$(sha256sum "$TMP_DIR/runtime.tar.gz" | awk '{print $1}')"
fi

if [ -z "$EXPECTED" ] || [ "$EXPECTED" != "$ACTUAL" ]; then
  echo "Hibás SHA-256 ellenőrzőösszeg. Telepítés megszakítva." >&2
  exit 5
fi

mkdir -p "$INSTALL_DIR"
tar -xzf "$TMP_DIR/runtime.tar.gz" -C "$INSTALL_DIR"
chmod +x "$INSTALL_DIR/install.sh" "$INSTALL_DIR/install-macos.sh" "$INSTALL_DIR/install-linux.sh" 2>/dev/null || true

echo "✓ Runtime ellenőrizve."
cd "$INSTALL_DIR"
export WEBINAR_MAGUS_CLI_BOOTSTRAP=1
# The bootstrap itself may arrive through `curl | bash`, whose stdin is the
# download pipe. Reconnect the real terminal before the interactive onboarding
# installer so prompts never consume/EOF on the curl stream.
if [ -r /dev/tty ]; then
  exec bash ./install.sh </dev/tty
fi
exec bash ./install.sh
