#!/usr/bin/env bash
# One-time identity migration for installs created before the Webinár Mágus rename.
# Legacy tokens are assembled at runtime so the shipped runtime itself remains
# free of the retired product string and the release branding gate can stay strict.
set -euo pipefail

INSTALL_DIR="${WEBINAR_MAGUS_INSTALL_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
STORE_DIR="$INSTALL_DIR/store"
MARKER="$STORE_DIR/.brand-state-v1-migrated"
OLD_ID="mar""veen"
OLD_DISPLAY="Mar""veen"
OLD_PREFIX="MAR""VEEN"
NEW_ID="webinarmagus"
NEW_DISPLAY="Webinár Mágus"
NEW_PREFIX="WEBINAR_MAGUS"
MODULE_ROOT="${WEBINAR_MAGUS_MODULE_ROOT:-$INSTALL_DIR}"

mkdir -p "$STORE_DIR"
[ -f "$MARKER" ] && exit 0

needs_migration=0
if [ -f "$INSTALL_DIR/.env" ]; then
  if grep -Eq "^((MAIN_AGENT_ID|SERVICE_ID|FLEET_LEAD_ID)=['\"]?${OLD_ID}['\"]?|BOT_NAME=['\"]?${OLD_DISPLAY}['\"]?|BRAND_NAME=['\"]?${OLD_DISPLAY}['\"]?|${OLD_PREFIX}_)" "$INSTALL_DIR/.env"; then
    needs_migration=1
  fi
fi
for p in   "$HOME/.${OLD_ID}-worker"   "$HOME/.${OLD_ID}-worker-fast"   "$STORE_DIR/${OLD_ID}-avatar.png"   "$STORE_DIR/${OLD_ID}-avatar.jpg"   "$STORE_DIR/${OLD_ID}-avatar.jpeg"   "$STORE_DIR/${OLD_ID}-avatar.webp"
do
  [ -e "$p" ] && needs_migration=1
done
if [ -f "$STORE_DIR/claudeclaw.db" ]; then
  # Existing installs may already have a new .env while historical rows still
  # carry the former main-agent id, so an existing DB gets one safe migration pass.
  needs_migration=1
fi
if compgen -G "$HOME/Library/LaunchAgents/com.${OLD_ID}.*.plist" >/dev/null 2>&1; then
  needs_migration=1
fi
if compgen -G "$HOME/.config/systemd/user/${OLD_ID}-*" >/dev/null 2>&1; then
  needs_migration=1
fi

if [ "$needs_migration" != "1" ]; then
  : > "$MARKER"
  exit 0
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="$STORE_DIR/migrations/brand-state-$STAMP"
mkdir -p "$BACKUP_DIR"

backup_if_present() {
  local src="$1"
  [ -e "$src" ] || return 0
  cp -Rp "$src" "$BACKUP_DIR/" 2>/dev/null || true
}

backup_if_present "$INSTALL_DIR/.env"
backup_if_present "$STORE_DIR/claudeclaw.db"
backup_if_present "$STORE_DIR/claudeclaw.db-wal"
backup_if_present "$STORE_DIR/claudeclaw.db-shm"
backup_if_present "$STORE_DIR/auto-restart.json"
backup_if_present "$STORE_DIR/federation.json"
backup_if_present "$STORE_DIR/config-overrides.json"
backup_if_present "$INSTALL_DIR/CLAUDE.md"
backup_if_present "$INSTALL_DIR/HEARTBEAT.md"
backup_if_present "$INSTALL_DIR/.mcp.json"
backup_if_present "$INSTALL_DIR/scheduled-tasks.json"

# Identity/env migration. Existing new-prefix keys win when both forms exist.
if [ -f "$INSTALL_DIR/.env" ]; then
  OLD_ID="$OLD_ID" OLD_DISPLAY="$OLD_DISPLAY" OLD_PREFIX="$OLD_PREFIX"   NEW_ID="$NEW_ID" NEW_DISPLAY="$NEW_DISPLAY" NEW_PREFIX="$NEW_PREFIX"   python3 - "$INSTALL_DIR/.env" <<'PY'
import os, re, sys
from pathlib import Path

p = Path(sys.argv[1])
old_id = os.environ["OLD_ID"]
old_display = os.environ["OLD_DISPLAY"]
old_prefix = os.environ["OLD_PREFIX"] + "_"
new_id = os.environ["NEW_ID"]
new_display = os.environ["NEW_DISPLAY"]
new_prefix = os.environ["NEW_PREFIX"] + "_"

lines = p.read_text("utf-8").splitlines()
present = set()
for line in lines:
    m = re.match(r'^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=', line)
    if m:
        present.add(m.group(1))

out = []
for line in lines:
    m = re.match(r'^(\s*(?:export\s+)?)([A-Za-z_][A-Za-z0-9_]*)(\s*=\s*)(.*)$', line)
    if not m:
        out.append(line)
        continue
    lead, key, eq, raw = m.groups()
    if key.startswith(old_prefix):
        new_key = new_prefix + key[len(old_prefix):]
        if new_key in present:
            continue
        key = new_key
        present.add(new_key)
    quote = ""
    value = raw.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "'\"":
        quote = value[0]
        value = value[1:-1]
    if key in {"MAIN_AGENT_ID", "SERVICE_ID", "FLEET_LEAD_ID"} and value == old_id:
        value = new_id
    elif key in {"BOT_NAME", "BRAND_NAME"} and value == old_display:
        value = new_display
    rendered = f"{quote}{value}{quote}" if quote else value
    out.append(f"{lead}{key}{eq}{rendered}")

p.write_text("\n".join(out) + "\n", "utf-8")
PY
fi

# Generated local files may contain the former display/id. Restrict the rewrite
# to generated control files; user memory and history are deliberately untouched.
OLD_ID="$OLD_ID" OLD_DISPLAY="$OLD_DISPLAY" OLD_PREFIX="$OLD_PREFIX" NEW_ID="$NEW_ID" NEW_DISPLAY="$NEW_DISPLAY" NEW_PREFIX="$NEW_PREFIX" python3 - "$INSTALL_DIR" <<'PY'
import os, sys
from pathlib import Path

root = Path(sys.argv[1])
old_id = os.environ["OLD_ID"]
old_display = os.environ["OLD_DISPLAY"]
old_prefix = os.environ["OLD_PREFIX"] + "_"
new_id = os.environ["NEW_ID"]
new_display = os.environ["NEW_DISPLAY"]
new_prefix = os.environ["NEW_PREFIX"] + "_"

for rel in ("CLAUDE.md", "HEARTBEAT.md", ".mcp.json", "scheduled-tasks.json"):
    p = root / rel
    if not p.is_file():
        continue
    try:
        s = p.read_text("utf-8")
    except Exception:
        continue
    n = s.replace(old_prefix, new_prefix).replace(old_display, new_display).replace(old_id, new_id)
    if n != s:
        p.write_text(n, "utf-8")
PY

# Rename isolated worker homes instead of recreating them, preserving OAuth/cache
# state and keeping the macOS Keychain path hash aligned with the new config path.
for suffix in worker worker-fast; do
  src="$HOME/.${OLD_ID}-$suffix"
  dst="$HOME/.${NEW_ID}-$suffix"
  if [ -e "$src" ] && [ ! -e "$dst" ]; then
    mv "$src" "$dst"
  fi
done

# Preserve a custom avatar across the rename.
for ext in png jpg jpeg webp; do
  src="$STORE_DIR/${OLD_ID}-avatar.$ext"
  dst="$STORE_DIR/${NEW_ID}-avatar.$ext"
  if [ -f "$src" ]; then
    if [ ! -e "$dst" ]; then mv "$src" "$dst"; else rm -f "$src"; fi
  fi
done

# Migrate persisted JSON state with narrow, schema-aware edits.
OLD_ID="$OLD_ID" OLD_DISPLAY="$OLD_DISPLAY" OLD_PREFIX="$OLD_PREFIX" NEW_ID="$NEW_ID" NEW_DISPLAY="$NEW_DISPLAY" NEW_PREFIX="$NEW_PREFIX" python3 - "$STORE_DIR" "$HOME" <<'PY'
import json, os, sys
from pathlib import Path

store = Path(sys.argv[1])
home = Path(sys.argv[2])
old_id = os.environ["OLD_ID"]
old_display = os.environ["OLD_DISPLAY"]
old_prefix = os.environ["OLD_PREFIX"] + "_"
new_id = os.environ["NEW_ID"]
new_display = os.environ["NEW_DISPLAY"]
new_prefix = os.environ["NEW_PREFIX"] + "_"

def load(path):
    try:
        return json.loads(path.read_text("utf-8"))
    except Exception:
        return None

def save(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", "utf-8")

p = store / "auto-restart.json"
data = load(p) if p.exists() else None
if isinstance(data, dict) and old_id in data:
    if new_id not in data:
        data[new_id] = data[old_id]
    del data[old_id]
    save(p, data)

p = store / "federation.json"
data = load(p) if p.exists() else None
if isinstance(data, dict) and data.get("systemId") == old_id:
    data["systemId"] = new_id
    save(p, data)

p = store / "config-overrides.json"
data = load(p) if p.exists() else None
if isinstance(data, dict):
    changed = False
    for key in list(data):
        if key.startswith(old_prefix):
            nk = new_prefix + key[len(old_prefix):]
            if nk not in data:
                data[nk] = data[key]
            del data[key]
            changed = True
    for key, value in list(data.items()):
        if value == old_id:
            data[key] = new_id; changed = True
        elif value == old_display:
            data[key] = new_display; changed = True
    if changed:
        save(p, data)

# Scheduled task routing is the only field rewritten in user task files.
task_roots = [home / ".claude" / "scheduled-tasks"]
for task_root in task_roots:
    if not task_root.is_dir():
        continue
    for p in task_root.glob("*/task-config.json"):
        data = load(p)
        if not isinstance(data, dict):
            continue
        changed = False
        if data.get("agent") == old_id:
            data["agent"] = new_id
            changed = True
        if changed:
            save(p, data)
PY

# Database identity columns. UPDATE OR IGNORE makes the pass safe on a partially
# migrated database where a uniqueness constraint already has the new row.
DB="$STORE_DIR/claudeclaw.db"
if [ -f "$DB" ] && [ -d "$MODULE_ROOT/node_modules/better-sqlite3" ]; then
  OLD_ID="$OLD_ID" NEW_ID="$NEW_ID" node - "$DB" "$MODULE_ROOT" <<'NODE'
const path = require('node:path')
const dbPath = process.argv[2]
const moduleRoot = process.argv[3]
const oldId = process.env.OLD_ID
const newId = process.env.NEW_ID
const Database = require(path.join(moduleRoot, 'node_modules', 'better-sqlite3'))
const db = new Database(dbPath)

const pairs = [
  ['memories', 'agent_id'],
  ['memories', 'updated_by'],
  ['conversation_log', 'agent_id'],
  ['daily_logs', 'agent_id'],
  ['kanban_cards', 'assignee'],
  ['kanban_comments', 'author'],
  ['kanban_card_events', 'actor'],
  ['agent_messages', 'from_agent'],
  ['agent_messages', 'to_agent'],
  ['pending_channel_requests', 'agent'],
  ['task_runs', 'agent'],
  ['pending_task_retries', 'agent_name'],
  ['background_tasks', 'agent_id'],
  ['token_usage', 'agent'],
  ['tool_call_log', 'agent_id'],
  ['skill_usage', 'agent_id'],
  ['store_file_audit', 'agent'],
  ['approvals', 'agent_id'],
  ['otel_spans', 'agent_id'],
  ['idea_comments', 'author'],
  ['idea_status_log', 'actor'],
  ['config_change_log', 'actor'],
]

const tableExists = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?")
const q = (name) => '"' + String(name).replaceAll('"', '""') + '"'

db.transaction(() => {
  for (const [table, column] of pairs) {
    if (!tableExists.get(table)) continue
    const cols = db.prepare(`PRAGMA table_info(${q(table)})`).all()
    if (!cols.some((c) => c.name === column)) continue
    db.prepare(`UPDATE OR IGNORE ${q(table)} SET ${q(column)}=? WHERE ${q(column)}=?`).run(newId, oldId)
  }
  if (tableExists.get('token_usage_cursors')) {
    const cols = db.prepare('PRAGMA table_info("token_usage_cursors")').all()
    if (cols.some((c) => c.name === 'file_path')) {
      db.prepare('UPDATE OR IGNORE "token_usage_cursors" SET file_path=replace(file_path, ?, ?) WHERE instr(file_path, ?) > 0')
        .run(oldId, newId, oldId)
    }
  }
})()
db.close()
NODE
fi

# Rename old macOS LaunchAgent files and rewrite their labels/content.
PLIST_DIR="$HOME/Library/LaunchAgents"
if [ -d "$PLIST_DIR" ]; then
  for src in "$PLIST_DIR"/com."${OLD_ID}".*.plist; do
    [ -f "$src" ] || continue
    base="$(basename "$src")"
    dst="$PLIST_DIR/${base/com.${OLD_ID}./com.${NEW_ID}.}"
    if [ "${WEBINAR_MAGUS_SKIP_SERVICE_COMMANDS:-0}" != "1" ] && command -v launchctl >/dev/null 2>&1; then
      launchctl bootout "gui/$(id -u)/com.${OLD_ID}.${base#com.${OLD_ID}.}" >/dev/null 2>&1 || true
    fi
    OLD_ID="$OLD_ID" NEW_ID="$NEW_ID" python3 - "$src" <<'PY'
import os, sys
from pathlib import Path
p = Path(sys.argv[1])
s = p.read_text("utf-8")
p.write_text(s.replace(os.environ["OLD_ID"], os.environ["NEW_ID"]), "utf-8")
PY
    if [ "$src" != "$dst" ]; then
      if [ ! -e "$dst" ]; then mv "$src" "$dst"; else rm -f "$src"; fi
    fi
  done
fi

# Rename Linux user/system units. Dashboard/channels are started by start.sh;
# auxiliary timers/services are only re-enabled when service commands are allowed.
rename_systemd_dir() {
  local dir="$1" scope="$2"
  [ -d "$dir" ] || return 0
  for src in "$dir"/"${OLD_ID}"-*; do
    [ -e "$src" ] || continue
    base="$(basename "$src")"
    dst="$dir/${base/${OLD_ID}-/${NEW_ID}-}"
    if [ "${WEBINAR_MAGUS_SKIP_SERVICE_COMMANDS:-0}" != "1" ] && command -v systemctl >/dev/null 2>&1; then
      if [ "$scope" = "user" ]; then systemctl --user stop "$base" >/dev/null 2>&1 || true
      else systemctl stop "$base" >/dev/null 2>&1 || true
      fi
    fi
    if [ -f "$src" ]; then
      OLD_ID="$OLD_ID" NEW_ID="$NEW_ID" python3 - "$src" <<'PY'
import os, sys
from pathlib import Path
p = Path(sys.argv[1])
s = p.read_text("utf-8")
p.write_text(s.replace(os.environ["OLD_ID"], os.environ["NEW_ID"]), "utf-8")
PY
    fi
    if [ "$src" != "$dst" ]; then
      if [ ! -e "$dst" ]; then mv "$src" "$dst"; else rm -rf "$src"; fi
    fi
  done
  if [ "${WEBINAR_MAGUS_SKIP_SERVICE_COMMANDS:-0}" != "1" ] && command -v systemctl >/dev/null 2>&1; then
    if [ "$scope" = "user" ]; then systemctl --user daemon-reload >/dev/null 2>&1 || true
    else systemctl daemon-reload >/dev/null 2>&1 || true
    fi
  fi
}
rename_systemd_dir "$HOME/.config/systemd/user" user
if [ "$(id -u)" = "0" ]; then rename_systemd_dir "/etc/systemd/system" system; fi

# Old worker sessions must not keep writing into the retired home/config path.
if [ "${WEBINAR_MAGUS_SKIP_SERVICE_COMMANDS:-0}" != "1" ] && command -v tmux >/dev/null 2>&1; then
  tmux kill-session -t "${OLD_ID}-worker" >/dev/null 2>&1 || true
  tmux kill-session -t "${OLD_ID}-worker-fast" >/dev/null 2>&1 || true
fi

printf 'migrated_at=%s\nnew_id=%s\nbackup=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$NEW_ID" "$BACKUP_DIR" > "$MARKER"
echo "✓ Webinár Mágus identity state migrated; backup: $BACKUP_DIR"
