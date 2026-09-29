#!/bin/bash
# Shared launchd starter for the macOS entry points (install-macos.sh and
# scripts/start.sh). Sourced, never executed.
#
# `launchctl load` is not `launchctl start`. It only PENDS a RunAtLoad spawn on
# modern macOS. Measured on 26.5.1 with a throwaway agent carrying
# RunAtLoad=true + KeepAlive=true:
#
#   launchctl load <plist>                rc=0, runs = 0, never starts
#   launchctl bootstrap gui/$UID <plist>  rc=0, runs = 0, never starts
#   launchctl print gui/$UID/<label>      "pended nondemand spawn = speculative",
#                                         still `state = not running` after 30s
#   launchctl kickstart gui/$UID/<label>  starts immediately, runs = 1
#
# Both call sites used to `launchctl load ... 2>/dev/null || true` and then print
# a success line unconditionally, so an install (or a manual start) ended with
# two units that had NEVER run while the operator was told they were up -- the
# bot answered nobody and nothing anywhere explained why.
#
# Safe to source into a script running with `set -e` and an exiting ERR trap:
# no bare `cmd && cmd` list is the last command of any construct here.

# start_launchd_unit LABEL -- bootstrap/load, kickstart, then VERIFY.
# Echoes the running pid, or nothing at all when the unit never came up.
# PLIST_DIR defaults to the user LaunchAgents directory.
start_launchd_unit() {
  _slu_label="$1"
  _slu_dir="${PLIST_DIR:-$HOME/Library/LaunchAgents}"
  _slu_domain="gui/$(id -u)"
  launchctl bootstrap "$_slu_domain" "$_slu_dir/${_slu_label}.plist" 2>/dev/null \
    || launchctl load "$_slu_dir/${_slu_label}.plist" 2>/dev/null \
    || true
  launchctl kickstart "$_slu_domain/${_slu_label}" >/dev/null 2>&1 || true
  _slu_pid=""
  _slu_try=0
  while [ "$_slu_try" -lt "${LAUNCHD_START_TRIES:-10}" ]; do
    _slu_pid="$(launchctl print "$_slu_domain/${_slu_label}" 2>/dev/null \
      | awk '/^\tpid = /{print $3; exit}')"
    # NOT `[ -n "$_slu_pid" ] && break`: as the last command of the loop body
    # that list would return 1 on the final miss and abort an errexit caller.
    if [ -n "$_slu_pid" ]; then break; fi
    _slu_try=$((_slu_try + 1))
    sleep 1
  done
  # A first pid is not proof the unit STAYED up. Measured with a unit whose
  # program does not exist: launchd reports a transient `state = xpcproxy` pid
  # for about a second, and only two seconds on does it read
  # `state = spawn scheduled`, no pid, `last exit code = 78: EX_CONFIG`. Confirm
  # after a settle so a crash-looping unit is not counted as started.
  if [ -n "$_slu_pid" ]; then
    sleep 2
    _slu_pid="$(launchctl print "$_slu_domain/${_slu_label}" 2>/dev/null \
      | awk '/^\tpid = /{print $3; exit}')"
  fi
  printf '%s' "$_slu_pid"
  unset _slu_label _slu_dir _slu_domain _slu_try
}


# ensure_core_launchd_units SERVICE_ID INSTALL_DIR
# Create/repair the two core macOS LaunchAgents used by start.sh.
# Safe to call on every start: files are rewritten only when missing or stale.
ensure_core_launchd_units() {
  _elu_id="$1"
  _elu_install="$2"
  _elu_dir="${PLIST_DIR:-$HOME/Library/LaunchAgents}"
  _elu_domain="gui/$(id -u)"

  mkdir -p "$_elu_dir" "$_elu_install/store"

  _elu_node=""
  if [ -n "${WEBINAR_MAGUS_NODE_PATH:-}" ] && [ -x "${WEBINAR_MAGUS_NODE_PATH:-}" ]; then
    _elu_node="$WEBINAR_MAGUS_NODE_PATH"
  elif command -v brew >/dev/null 2>&1; then
    _elu_prefix="$(brew --prefix node@22 2>/dev/null || true)"
    if [ -n "$_elu_prefix" ] && [ -x "$_elu_prefix/bin/node" ]; then
      _elu_node="$_elu_prefix/bin/node"
    fi
  fi
  if [ -z "$_elu_node" ]; then
    _elu_node="$(command -v node 2>/dev/null || true)"
  fi
  if [ -z "$_elu_node" ] || [ ! -x "$_elu_node" ]; then
    echo "ERROR: Node.js nem található a macOS háttérszolgáltatásokhoz." >&2
    return 1
  fi
  _elu_node_dir="$(dirname "$_elu_node")"

  _elu_dashboard="com.${_elu_id}.dashboard"
  _elu_channels="com.${_elu_id}.channels"
  _elu_dashboard_plist="$_elu_dir/${_elu_dashboard}.plist"
  _elu_channels_plist="$_elu_dir/${_elu_channels}.plist"

  _elu_rewrite_dashboard=0
  if [ ! -f "$_elu_dashboard_plist" ] \
    || ! grep -Fq "<string>${_elu_node}</string>" "$_elu_dashboard_plist" 2>/dev/null \
    || ! grep -Fq "<string>${_elu_install}/dist/index.js</string>" "$_elu_dashboard_plist" 2>/dev/null \
    || ! grep -Fq "<string>${_elu_install}</string>" "$_elu_dashboard_plist" 2>/dev/null; then
    _elu_rewrite_dashboard=1
  fi

  _elu_rewrite_channels=0
  if [ ! -f "$_elu_channels_plist" ] \
    || ! grep -Fq "<string>${_elu_install}/scripts/channels.sh</string>" "$_elu_channels_plist" 2>/dev/null \
    || ! grep -Fq "<string>${_elu_install}</string>" "$_elu_channels_plist" 2>/dev/null; then
    _elu_rewrite_channels=1
  fi

  if [ "$_elu_rewrite_dashboard" = "1" ]; then
    launchctl bootout "$_elu_domain/${_elu_dashboard}" >/dev/null 2>&1 || true
    _elu_tmp="${_elu_dashboard_plist}.tmp.$$"
    cat >"$_elu_tmp" <<PLISTEOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${_elu_dashboard}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${_elu_node}</string>
    <string>${_elu_install}/dist/index.js</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${_elu_install}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${_elu_install}/store/dashboard.log</string>
  <key>StandardErrorPath</key>
  <string>${_elu_install}/store/dashboard.error.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>${_elu_node_dir}:$HOME/.local/bin:/opt/homebrew/bin:$HOME/.bun/bin:/usr/local/bin:/usr/bin:/bin</string>
    <key>HOME</key>
    <string>$HOME</string>
  </dict>
  <key>SoftResourceLimits</key>
  <dict>
    <key>NumberOfFiles</key>
    <integer>16384</integer>
  </dict>
  <key>HardResourceLimits</key>
  <dict>
    <key>NumberOfFiles</key>
    <integer>32768</integer>
  </dict>
</dict>
</plist>
PLISTEOF
    chmod 644 "$_elu_tmp"
    mv "$_elu_tmp" "$_elu_dashboard_plist"
  fi

  if [ "$_elu_rewrite_channels" = "1" ]; then
    launchctl bootout "$_elu_domain/${_elu_channels}" >/dev/null 2>&1 || true
    _elu_tmp="${_elu_channels_plist}.tmp.$$"
    cat >"$_elu_tmp" <<PLISTEOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${_elu_channels}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${_elu_install}/scripts/channels.sh</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${_elu_install}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>ThrottleInterval</key>
  <integer>30</integer>
  <key>StandardOutPath</key>
  <string>${_elu_install}/store/channels.log</string>
  <key>StandardErrorPath</key>
  <string>${_elu_install}/store/channels.error.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>${_elu_node_dir}:$HOME/.local/bin:/opt/homebrew/bin:$HOME/.bun/bin:/usr/local/bin:/usr/bin:/bin</string>
    <key>HOME</key>
    <string>$HOME</string>
    <key>USER</key>
    <string>${USER:-$(id -un)}</string>
    <key>TERM</key>
    <string>xterm-256color</string>
    <key>LANG</key>
    <string>${LANG:-en_US.UTF-8}</string>
  </dict>
</dict>
</plist>
PLISTEOF
    chmod 644 "$_elu_tmp"
    mv "$_elu_tmp" "$_elu_channels_plist"
  fi

  plutil -lint "$_elu_dashboard_plist" >/dev/null 2>&1 || {
    echo "ERROR: hibás dashboard LaunchAgent: $_elu_dashboard_plist" >&2
    return 1
  }
  plutil -lint "$_elu_channels_plist" >/dev/null 2>&1 || {
    echo "ERROR: hibás channels LaunchAgent: $_elu_channels_plist" >&2
    return 1
  }

  unset _elu_id _elu_install _elu_dir _elu_domain _elu_node _elu_prefix _elu_node_dir
  unset _elu_dashboard _elu_channels _elu_dashboard_plist _elu_channels_plist
  unset _elu_rewrite_dashboard _elu_rewrite_channels _elu_tmp
  return 0
}
