#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/wm-brand-migration.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT
INSTALL="$TMP/install"
TEST_HOME="$TMP/home"
mkdir -p "$INSTALL/store" "$INSTALL/scripts" "$TEST_HOME/.claude/scheduled-tasks/demo"   "$TEST_HOME/Library/LaunchAgents" "$TEST_HOME/.config/systemd/user"

OLD_ID="mar""veen"
OLD_DISPLAY="Mar""veen"
OLD_PREFIX="MAR""VEEN"
NEW_ID="webinarmagus"

printf 'MAIN_AGENT_ID=%s\nSERVICE_ID=%s\nFLEET_LEAD_ID=%s\nBOT_NAME=%s\nBRAND_NAME=%s\n%s_ENV=linux-server\nWEB_PORT=3420\n'   "$OLD_ID" "$OLD_ID" "$OLD_ID" "$OLD_DISPLAY" "$OLD_DISPLAY" "$OLD_PREFIX" > "$INSTALL/.env"
printf 'Te %s vagy. agent=%s %s_WORKER_MODEL=x\n' "$OLD_DISPLAY" "$OLD_ID" "$OLD_PREFIX" > "$INSTALL/CLAUDE.md"
printf '{"agent":"%s"}\n' "$OLD_ID" > "$INSTALL/scheduled-tasks.json"
printf '{"%s":{"enabled":true}}\n' "$OLD_ID" > "$INSTALL/store/auto-restart.json"
printf '{"enabled":false,"systemId":"%s","peers":[]}\n' "$OLD_ID" > "$INSTALL/store/federation.json"
printf '{"%s_WORKER_MODEL":"x","MAIN_AGENT_ID":"%s"}\n' "$OLD_PREFIX" "$OLD_ID" > "$INSTALL/store/config-overrides.json"
printf '{"agent":"%s","prompt":"demo"}\n' "$OLD_ID" > "$TEST_HOME/.claude/scheduled-tasks/demo/task-config.json"

mkdir -p "$TEST_HOME/.${OLD_ID}-worker/.claude-config" "$TEST_HOME/.${OLD_ID}-worker-fast/.claude-config"
printf 'slow\n' > "$TEST_HOME/.${OLD_ID}-worker/state.txt"
printf 'fast\n' > "$TEST_HOME/.${OLD_ID}-worker-fast/state.txt"
printf 'png' > "$INSTALL/store/${OLD_ID}-avatar.png"

printf '<plist><string>com.%s.dashboard</string></plist>\n' "$OLD_ID"   > "$TEST_HOME/Library/LaunchAgents/com.${OLD_ID}.dashboard.plist"
printf '[Unit]\nDescription=%s channels\n' "$OLD_ID"   > "$TEST_HOME/.config/systemd/user/${OLD_ID}-channels.service"

ROOT="$ROOT" DB="$INSTALL/store/claudeclaw.db" OLD_ID="$OLD_ID" node <<'NODE'
const path = require('node:path')
const Database = require(path.join(process.env.ROOT, 'node_modules', 'better-sqlite3'))
const db = new Database(process.env.DB)
db.exec(`
  CREATE TABLE memories(id INTEGER PRIMARY KEY, agent_id TEXT, updated_by TEXT);
  CREATE TABLE agent_messages(id INTEGER PRIMARY KEY, from_agent TEXT, to_agent TEXT);
  CREATE TABLE pending_task_retries(id INTEGER PRIMARY KEY, agent_name TEXT);
  CREATE TABLE token_usage_cursors(file_path TEXT PRIMARY KEY);
`)
db.prepare('INSERT INTO memories(agent_id,updated_by) VALUES (?,?)').run(process.env.OLD_ID, process.env.OLD_ID)
db.prepare('INSERT INTO agent_messages(from_agent,to_agent) VALUES (?,?)').run(process.env.OLD_ID, process.env.OLD_ID)
db.prepare('INSERT INTO pending_task_retries(agent_name) VALUES (?)').run(process.env.OLD_ID)
db.prepare('INSERT INTO token_usage_cursors(file_path) VALUES (?)').run('/tmp/.' + process.env.OLD_ID + '-worker/x')
db.close()
NODE

HOME="$TEST_HOME" WEBINAR_MAGUS_INSTALL_DIR="$INSTALL" WEBINAR_MAGUS_MODULE_ROOT="$ROOT" WEBINAR_MAGUS_SKIP_SERVICE_COMMANDS=1 bash "$ROOT/scripts/migrate-legacy-brand-state.sh"

grep -q '^MAIN_AGENT_ID=webinarmagus$' "$INSTALL/.env"
grep -q '^SERVICE_ID=webinarmagus$' "$INSTALL/.env"
grep -q '^FLEET_LEAD_ID=webinarmagus$' "$INSTALL/.env"
grep -q '^BOT_NAME=Webinár Mágus$' "$INSTALL/.env"
grep -q '^BRAND_NAME=Webinár Mágus$' "$INSTALL/.env"
grep -q '^WEBINAR_MAGUS_ENV=linux-server$' "$INSTALL/.env"
! grep -q "^$OLD_PREFIX" "$INSTALL/.env"
! grep -q "$OLD_ID" "$INSTALL/CLAUDE.md"

test -f "$TEST_HOME/.webinarmagus-worker/state.txt"
test -f "$TEST_HOME/.webinarmagus-worker-fast/state.txt"
test -f "$INSTALL/store/webinarmagus-avatar.png"
test ! -e "$TEST_HOME/.${OLD_ID}-worker"
test ! -e "$INSTALL/store/${OLD_ID}-avatar.png"

test -f "$TEST_HOME/Library/LaunchAgents/com.webinarmagus.dashboard.plist"
test ! -e "$TEST_HOME/Library/LaunchAgents/com.${OLD_ID}.dashboard.plist"
grep -q 'com.webinarmagus.dashboard' "$TEST_HOME/Library/LaunchAgents/com.webinarmagus.dashboard.plist"

test -f "$TEST_HOME/.config/systemd/user/webinarmagus-channels.service"
test ! -e "$TEST_HOME/.config/systemd/user/${OLD_ID}-channels.service"

ROOT="$ROOT" DB="$INSTALL/store/claudeclaw.db" OLD_ID="$OLD_ID" NEW_ID="$NEW_ID" INSTALL="$INSTALL" TEST_HOME="$TEST_HOME" node <<'NODE'
const fs = require('node:fs')
const path = require('node:path')
const Database = require(path.join(process.env.ROOT, 'node_modules', 'better-sqlite3'))
const db = new Database(process.env.DB)
if (db.prepare('SELECT agent_id FROM memories').get().agent_id !== process.env.NEW_ID) process.exit(1)
if (db.prepare('SELECT updated_by FROM memories').get().updated_by !== process.env.NEW_ID) process.exit(1)
const m = db.prepare('SELECT from_agent,to_agent FROM agent_messages').get()
if (m.from_agent !== process.env.NEW_ID || m.to_agent !== process.env.NEW_ID) process.exit(1)
if (db.prepare('SELECT agent_name FROM pending_task_retries').get().agent_name !== process.env.NEW_ID) process.exit(1)
if (!db.prepare('SELECT file_path FROM token_usage_cursors').get().file_path.includes(process.env.NEW_ID)) process.exit(1)
db.close()

const auto = JSON.parse(fs.readFileSync(path.join(process.env.INSTALL, 'store/auto-restart.json'), 'utf8'))
if (!auto[process.env.NEW_ID] || auto[process.env.OLD_ID]) process.exit(1)
const fed = JSON.parse(fs.readFileSync(path.join(process.env.INSTALL, 'store/federation.json'), 'utf8'))
if (fed.systemId !== process.env.NEW_ID) process.exit(1)
const ov = JSON.parse(fs.readFileSync(path.join(process.env.INSTALL, 'store/config-overrides.json'), 'utf8'))
if (ov.MAIN_AGENT_ID !== process.env.NEW_ID || !('WEBINAR_MAGUS_WORKER_MODEL' in ov)) process.exit(1)
const task = JSON.parse(fs.readFileSync(path.join(process.env.TEST_HOME, '.claude/scheduled-tasks/demo/task-config.json'), 'utf8'))
if (task.agent !== process.env.NEW_ID) process.exit(1)
NODE

test -f "$INSTALL/store/.brand-state-v1-migrated"
test -d "$INSTALL/store/migrations"
test "$(find "$INSTALL/store/migrations" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')" = "1"

# Second run is a no-op and must not create another backup.
HOME="$TEST_HOME" WEBINAR_MAGUS_INSTALL_DIR="$INSTALL" WEBINAR_MAGUS_MODULE_ROOT="$ROOT" WEBINAR_MAGUS_SKIP_SERVICE_COMMANDS=1 bash "$ROOT/scripts/migrate-legacy-brand-state.sh"
test "$(find "$INSTALL/store/migrations" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')" = "1"

echo "legacy-brand-migration: ok"
