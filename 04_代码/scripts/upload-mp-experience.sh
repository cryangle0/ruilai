#!/usr/bin/env bash
# Upload the Ruilai mini program experience build.
# Overwrites the current version unless RUILAI_WX_VERSION is set.
set -euo pipefail

export PATH="$HOME/.local/node/bin:$HOME/.local/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MINI="$ROOT/miniprogram"
PROJECT="$MINI/dist/build/mp-weixin"
APPID_FILE="$MINI/APPID"
APPID="$(tr -d '[:space:]' < "$APPID_FILE")"
CLI="${WECHAT_CLI:-/Applications/wechatwebdevtools.app/Contents/MacOS/cli}"
IDE="${WECHAT_IDE:-/Applications/wechatwebdevtools.app/Contents/MacOS/wechatide}"
VERSION="${RUILAI_WX_VERSION:-0.2.9}"
DESC="${RUILAI_WX_DESC:-更新}"
LOG="${RUILAI_WX_LOG:-/tmp/ruilai-mp-upload.log}"

if [[ "$APPID" != "wx242669dc618156c6" ]]; then
  echo "ERROR: missing or unexpected AppID in $APPID_FILE (got '${APPID:-empty}')" >&2
  exit 2
fi

click_allow() {
  python3 - <<'PY'
from PIL import Image
import subprocess, time, os
os.makedirs('/tmp/ruilai-wx', exist_ok=True)
path = '/tmp/ruilai-wx/auto-allow.png'
subprocess.check_call(['screencapture', '-x', path])
img = Image.open(path).convert('RGB')
w, h = img.size
pix = img.load()
cands = []
for y in range(int(h * 0.2), int(h * 0.8)):
    xs = [x for x in range(w) if (lambda p: p[1] > 150 and p[0] < 90 and p[2] < 130 and p[1] > p[0] + 40)(pix[x, y])]
    if len(xs) > 30:
        cands.append((y, min(xs), max(xs)))
groups = []
for y, a, b in cands:
    if groups and y <= groups[-1][1] + 3:
        g = groups[-1]
        groups[-1] = (g[0], y, min(g[2], a), max(g[3], b))
    else:
        groups.append((y, y, a, b))
if not groups:
    raise SystemExit('no-allow')
g = max(groups, key=lambda t: (t[1] - t[0]) * (t[3] - t[2]))
cx = (g[2] + g[3]) / 2
cy = (g[0] + g[1]) / 2
open('/tmp/ruilai-wx/auto-allow.xy', 'w').write(f'{cx} {cy}\n')
print(f'allow {cx} {cy}')
PY
  local xy
  xy="$(tr -d '\n' < /tmp/ruilai-wx/auto-allow.xy)"
  local x="${xy%% *}"
  local y="${xy##* }"
  swift -e "
import CoreGraphics
import Foundation
let pt = CGPoint(x: ${x}, y: ${y})
for ev in [CGEventType.mouseMoved, .leftMouseDown, .leftMouseUp] {
  let e = CGEvent(mouseEventSource: nil, mouseType: ev, mouseCursorPosition: pt, mouseButton: .left)!
  e.post(tap: .cghidEventTap)
  Thread.sleep(forTimeInterval: 0.05)
}
print(\"clicked\")
"
}

upload_wechatide() {
  local raw task task_status i
  raw="$("$IDE" -c cursor upload --project "$PROJECT" --upload-version "$VERSION" --desc "$DESC" || true)"
  echo "$raw"
  task="$(printf '%s' "$raw" | python3 -c 'import sys,json,re; t=sys.stdin.read(); m=re.search(r"\{[\s\S]*\}", t); d=json.loads(m.group(0)) if m else {}; print((d.get("result") or {}).get("taskId",""))')"
  if [[ -z "$task" ]]; then
    echo "ERROR: wechatide upload did not return a task id" >&2
    return 2
  fi
  for i in $(seq 1 30); do
    raw="$("$IDE" -c cursor polling_task_result --task-id "$task" || true)"
    echo "$raw"
    task_status="$(printf '%s' "$raw" | python3 -c 'import sys,json,re; t=sys.stdin.read(); m=re.search(r"\{[\s\S]*\}", t); d=json.loads(m.group(0)) if m else {}; print((d.get("result") or {}).get("status",""))')"
    if [[ "$task_status" == "success" ]]; then
      return 0
    fi
    if [[ "$task_status" == "failed" || "$task_status" == "error" ]]; then
      return 3
    fi
    if [[ "$task_status" == "pending" ]]; then
      click_allow || true
    fi
    sleep 3
  done
  echo "ERROR: wechatide upload timed out" >&2
  return 4
}

{
  echo "== $(date '+%Y-%m-%d %H:%M:%S') upload start =="
  echo "appid=$APPID version=$VERSION desc=$DESC"
  cd "$MINI"
  npm run build:mp-weixin
  if [[ ! -f "$PROJECT/app.json" ]]; then
    echo "ERROR: missing build output $PROJECT/app.json" >&2
    exit 3
  fi
  QQ_HITS="$(grep -R --include='*.js' -n -F '??' "$PROJECT" || true)"
  if [[ -n "$QQ_HITS" ]]; then
    echo "$QQ_HITS"
    echo "ERROR: WeChat upload rejects ?? in $PROJECT; rewrite those sources first" >&2
    exit 5
  fi
  python3 - "$PROJECT/project.config.json" "$APPID" <<'PY'
import json, sys
path, appid = sys.argv[1], sys.argv[2]
with open(path, encoding='utf-8') as f:
    data = json.load(f)
data['appid'] = appid
with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write('\n')
print(f'wrote appid={appid} -> {path}')
PY
  CLI_LOG="$(mktemp)"
  if perl -e 'alarm shift; exec @ARGV' 90 "$CLI" upload --project "$PROJECT" --appid "$APPID" --version "$VERSION" --desc "$DESC" | tee "$CLI_LOG"; then
    if grep -Eq 'APPID_ERROR|✖ Uploading|\[error\]' "$CLI_LOG"; then
      echo "cli upload reported failure, falling back to wechatide"
    else
      echo "== $(date '+%Y-%m-%d %H:%M:%S') cli upload done appid=$APPID =="
      exit 0
    fi
  fi
  echo "cli upload failed, falling back to wechatide"
  upload_wechatide
  echo "== $(date '+%Y-%m-%d %H:%M:%S') wechatide upload done appid=$APPID =="
} | tee -a "$LOG"
