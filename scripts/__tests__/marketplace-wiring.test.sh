#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

node <<'NODE'
const fs = require('node:fs')
const m = JSON.parse(fs.readFileSync('.claude-plugin/marketplace.json', 'utf8'))
if (m.name !== 'webinarmagus-marketplace') throw new Error('unexpected marketplace name')
const names = new Set((m.plugins || []).map(p => p.name))
for (const required of ['slack-channel', 'teams']) {
  if (!names.has(required)) throw new Error('missing plugin: ' + required)
}
for (const p of m.plugins || []) {
  if (!p.source || p.source.source !== 'url' || !/^https:\/\/github\.com\//.test(p.source.url || '')) {
    throw new Error('plugin source is not a GitHub URL: ' + p.name)
  }
}
NODE

for f in install-macos.sh install-linux.sh; do
  grep -q 'PLUGIN_MARKETPLACE="tmisi76/webinarmagus"' "$f"
  if grep -q 'PLUGIN_MARKETPLACE="tmisi76/webinarmagus-marketplace"' "$f"; then
    echo "stale nonexistent marketplace source in $f" >&2
    exit 1
  fi
done

grep -q 'slack-channel@webinarmagus-marketplace' .claude/settings.json
grep -q "slack-channel@webinarmagus-marketplace" src/web/plugin-ids.ts
grep -q "teams@webinarmagus-marketplace" src/web/plugin-ids.ts

echo "marketplace-wiring: ok"
