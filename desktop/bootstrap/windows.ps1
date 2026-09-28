$ErrorActionPreference = "Stop"

function Say([string]$Message) { Write-Output "[Webinár Mágus] $Message" }

$bundledRuntime = $env:WEBINAR_MAGUS_BUNDLED_RUNTIME
if ([string]::IsNullOrWhiteSpace($bundledRuntime) -or -not (Test-Path (Join-Path $bundledRuntime "package.json"))) {
  Say "A beépített runtime nem található."
  exit 21
}

try {
  $status = (& wsl.exe --status 2>&1 | Out-String) -replace [char]0, ""
} catch {
  Say "NEEDS_WSL"
  exit 30
}

if ($LASTEXITCODE -ne 0 -and $status -notmatch "Default Distribution") {
  Say "NEEDS_WSL"
  exit 30
}

$wslBundledRuntime = (& wsl.exe wslpath -a $bundledRuntime 2>$null | Out-String).Trim()
if ([string]::IsNullOrWhiteSpace($wslBundledRuntime)) {
  Say "A beépített runtime WSL útvonala nem határozható meg."
  exit 22
}

Say "Windows runtime előkészítése WSL-ben…"

$rootScript = @'
set -e
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y curl ca-certificates gnupg git tmux ffmpeg python3 pipx build-essential
if ! command -v node >/dev/null 2>&1 || ! node -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 22 ? 0 : 1)' >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
if ! command -v claude >/dev/null 2>&1; then
  npm install -g @anthropic-ai/claude-code
fi
'@
& wsl.exe -u root -- bash -lc $rootScript
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$userScript = @'
set -e
RUNTIME_DIR="$HOME/webinar-magus"
export PATH="$HOME/.local/bin:$HOME/.bun/bin:$PATH"

if ! command -v bun >/dev/null 2>&1; then
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
fi

if [ ! -f "$RUNTIME_DIR/package.json" ]; then
  mkdir -p "$(dirname "$RUNTIME_DIR")"
  cp -R "$WEBINAR_MAGUS_BUNDLED_RUNTIME_WSL" "$RUNTIME_DIR"
fi

cd "$RUNTIME_DIR"
npm install --silent
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

echo "[Webinár Mágus] READY"
'@
& wsl.exe env "WEBINAR_MAGUS_BUNDLED_RUNTIME_WSL=$wslBundledRuntime" bash -lc $userScript
exit $LASTEXITCODE
