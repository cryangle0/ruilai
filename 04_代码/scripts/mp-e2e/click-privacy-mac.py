#!/usr/bin/env python3
"""Click WeChat native 同意 / 允许 dialogs on macOS (privacy + location)."""
import subprocess
import sys
import time


PROCESS_NAMES = ("wechatwebdevtools", "微信开发者工具", "Electron")
BUTTONS = ("同意", "允许", "确定", "好")


def osascript(source: str) -> tuple[int, str]:
    r = subprocess.run(
        ["osascript", "-e", source],
        capture_output=True,
        text=True,
    )
    out = (r.stdout or "") + (r.stderr or "")
    return r.returncode, out.strip()


def click_named_buttons() -> bool:
    clicked = False
    for proc in PROCESS_NAMES:
        for label in BUTTONS:
            script = f'''
tell application "System Events"
  if not (exists process "{proc}") then return "no-proc"
  tell process "{proc}"
    set frontmost to true
    delay 0.2
    try
      click button "{label}" of window 1
      return "clicked-{label}"
    end try
    repeat with w in windows
      try
        click button "{label}" of w
        return "clicked-{label}"
      end try
      try
        click button "{label}" of sheet 1 of w
        return "clicked-{label}"
      end try
    end repeat
  end tell
end tell
return "miss"
'''
            code, out = osascript(script)
            if "clicked-" in out:
                print(out)
                clicked = True
                time.sleep(0.4)
    return clicked


def click_green_in_screenshot(sim_path: str) -> bool:
    try:
        from PIL import Image
    except ImportError:
        print("no-pil")
        return False
    img = Image.open(sim_path).convert("RGB")
    w, h = img.size
    pix = img.load()
    groups = []
    y0 = int(h * 0.45)
    run = None
    for y in range(y0, h):
        xs = []
        for x in range(w):
            r, g, b = pix[x, y][:3]
            if g > 140 and r < 100 and b < 140 and g > r + 35:
                xs.append(x)
        if len(xs) > 18:
            a, b = min(xs), max(xs)
            if run and y <= run[1] + 4:
                run = (run[0], y, min(run[2], a), max(run[3], b))
            else:
                if run:
                    groups.append(run)
                run = (y, y, a, b)
    if run:
        groups.append(run)
    best = None
    for gy0, gy1, gx0, gx1 in groups:
        bw, bh = gx1 - gx0, gy1 - gy0
        if 120 <= bw <= 280 and 28 <= bh <= 90:
            score = abs(bw - 180) + abs(bh - 56)
            if best is None or score < best[0]:
                best = (score, (gx0 + gx1) // 2, (gy0 + gy1) // 2)
    if not best:
        print("no-dialog")
        return False
    _, cx, cy = best
    print("sim-btn", cx, cy)
    # Map simulator image coords onto the DevTools window via AppleScript position.
    # Native dialog is often aligned with the simulator pane (right side).
    pos_script = '''
tell application "System Events"
  repeat with pname in {"wechatwebdevtools", "微信开发者工具"}
    if exists process pname then
      tell process pname
        set frontmost to true
        set p to position of window 1
        set s to size of window 1
        return ((item 1 of p) as text) & "," & ((item 2 of p) as text) & "," & ((item 1 of s) as text) & "," & ((item 2 of s) as text)
      end tell
    end if
  end repeat
end tell
return ""
'''
    code, out = osascript(pos_script)
    if not out or "," not in out:
        print("no-window")
        return False
    left, top, ww, hh = [int(float(x)) for x in out.split(",")]
    # Assume simulator sits on the right ~375px of the window in liteMode, or centered.
    sim_left = left + max(0, ww - w)
    sim_top = top + max(0, (hh - h) // 2)
    sx = sim_left + cx
    sy = sim_top + cy
    print("click", sx, sy)
    click_script = f'''
tell application "System Events"
  click at {{{sx}, {sy}}}
end tell
'''
    osascript(click_script)
    print("clicked")
    return True


def main() -> int:
    sim_path = sys.argv[1] if len(sys.argv) > 1 else None
    if click_named_buttons():
        return 0
    if sim_path:
        click_green_in_screenshot(sim_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
