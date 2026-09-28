#!/usr/bin/env bash
set -euo pipefail

RUNTIME_DIR="${WEBINAR_MAGUS_RUNTIME:-$HOME/webinar-magus}"
BUNDLED_RUNTIME="${WEBINAR_MAGUS_BUNDLED_RUNTIME:-}"

say() { printf '[Webinár Mágus] %s\n' "$*"; }

if ! command -v brew >/dev/null 2>&1; then
  say "NEEDS_HOMEBREW"
  exit 20
fi

if [ -z "$BUNDLED_RUNTIME" ] || [ ! -f "$BUNDLED_RUNTIME/package.json" ]; then
  say "A beépített runtime nem található."
  exit 21
fi

say "Függőségek ellenőrzése…"

if ! command -v node >/dev/null 2>&1 || ! node -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 22 ? 0 : 1)' >/dev/null 2>&1; then
  brew install node@22
  export PATH="/opt/homebrew/opt/node@22/bin:/usr/local/opt/node@22/bin:$PATH"
fi

for formula in tmux git ffmpeg python pipx; do
  if ! brew list "$formula" >/dev/null 2>&1; then
    brew install "$formula"
  fi
done

if ! command -v claude >/dev/null 2>&1; then
  say "Agent runtime telepítése…"
  npm install -g @anthropic-ai/claude-code
fi

if ! command -v bun >/dev/null 2>&1; then
  say "Bun telepítése…"
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
fi

if [ ! -f "$RUNTIME_DIR/package.json" ]; then
  say "Webinár Mágus runtime telepítése a helyi csomagból…"
  mkdir -p "$(dirname "$RUNTIME_DIR")"
  cp -R "$BUNDLED_RUNTIME" "$RUNTIME_DIR"
else
  say "Meglévő runtime megtartása."
fi

cd "$RUNTIME_DIR"
say "Node csomagok telepítése…"
npm install --silent
say "Runtime build…"
npm run build --silent

node scripts/seed-autowebinar-mcp.mjs || true
bash scripts/install-ai-provider-bridge.sh || true

if [ ! -f .env ]; then
  umask 077
  cat > .env <<'EOF'
MAIN_AGENT_ID=webinar-magus
BOT_NAME=Webinár Mágus
BRAND_NAME=Webinár Mágus
WEB_PORT=3420
IDENTITY_CONFIRMED=0
EOF
  chmod 600 .env
fi

say "READY"
