#!/usr/bin/env bash
set -euo pipefail

RUNTIME_DIR="${WEBINAR_MAGUS_RUNTIME:-$HOME/webinar-magus}"
REPO_URL="https://github.com/tmisi76/webinar-magus.git"

say() { printf '[Webinár Mágus] %s\n' "$*"; }

if ! command -v brew >/dev/null 2>&1; then
  say "NEEDS_HOMEBREW"
  exit 20
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
  say "Claude Code runtime telepítése…"
  npm install -g @anthropic-ai/claude-code
fi

if ! command -v bun >/dev/null 2>&1; then
  say "Bun telepítése…"
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
fi

if [ ! -d "$RUNTIME_DIR/.git" ]; then
  say "Webinár Mágus runtime letöltése…"
  git clone --depth 1 --branch main "$REPO_URL" "$RUNTIME_DIR"
else
  say "Meglévő runtime frissítése…"
  git -C "$RUNTIME_DIR" fetch origin main
  git -C "$RUNTIME_DIR" checkout main
  git -C "$RUNTIME_DIR" pull --ff-only origin main
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
