#!/usr/bin/env bash
# One-shot: upload the mini program at 08:40 today (Asia/Shanghai) with remark 更新.
set -euo pipefail

export PATH="$HOME/.local/node/bin:$HOME/.local/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"
export TZ="${TZ:-Asia/Shanghai}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
UPLOAD="$ROOT/scripts/upload-mp-experience.sh"
LABEL="${1:-com.ruilai.mp-upload-0840}"
PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"
LOG_DIR="$HOME/Library/Logs"
LOG="$LOG_DIR/ruilai-mp-upload-0840.log"
WAKE_LOG="$LOG_DIR/ruilai-mp-upload-0840-wake.log"

mkdir -p "$LOG_DIR" "$HOME/Library/LaunchAgents"
chmod +x "$UPLOAD"

NOW_EPOCH="$(date +%s)"
TARGET_EPOCH="$(date -j -f '%Y-%m-%d %H:%M:%S' "$(date +%Y-%m-%d) 08:40:00" +%s)"
if [[ "$NOW_EPOCH" -ge "$TARGET_EPOCH" ]]; then
  echo "08:40 today has already passed; not scheduling."
  exit 4
fi
HOUR=8
MINUTE=40

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-lc</string>
    <string>export TZ=Asia/Shanghai PATH="$HOME/.local/node/bin:$HOME/.local/bin:/usr/local/bin:/opt/homebrew/bin:\$PATH"; if [ "$(date +%Y-%m-%d)" != "2026-09-09" ]; then exit 0; fi; if [ -f /tmp/ruilai-mp-upload-0840.done ]; then exit 0; fi; export RUILAI_WX_VERSION=0.2.9 RUILAI_WX_DESC=更新 RUILAI_WX_LOG="${LOG}"; "${UPLOAD}" &amp;&amp; date &gt; /tmp/ruilai-mp-upload-0840.done; launchctl unload "${PLIST}" >/dev/null 2>&amp;1 || true</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>${HOUR}</integer>
    <key>Minute</key>
    <integer>${MINUTE}</integer>
  </dict>
  <key>StandardOutPath</key>
  <string>${LOG}</string>
  <key>StandardErrorPath</key>
  <string>${LOG}</string>
  <key>RunAtLoad</key>
  <false/>
</dict>
</plist>
EOF

launchctl unload "$PLIST" >/dev/null 2>&1 || true
launchctl load "$PLIST"

# Keep the Mac from sleeping through 08:40 so launchd can fire.
WAKE_SECS=$((TARGET_EPOCH - NOW_EPOCH + 120))
nohup caffeinate -dims -t "$WAKE_SECS" >> "$WAKE_LOG" 2>&1 &
echo $! > /tmp/ruilai-mp-upload-0840-caffeinate.pid

echo "scheduled ${LABEL} for today ${HOUR}:$(printf '%02d' "$MINUTE")"
echo "log: ${LOG}"
echo "keep-awake seconds: ${WAKE_SECS}"
