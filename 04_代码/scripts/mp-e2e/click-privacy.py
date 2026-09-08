# Click WeChat native dialog buttons (隐私同意 / 定位允许) inside 微信开发者工具.
# Only clicks if the simulator screenshot contains a dialog-sized green button.
import sys
import ctypes
from ctypes import wintypes

user32 = ctypes.windll.user32
try:
    user32.SetProcessDPIAware()
except Exception:
    pass

EnumWindowsProc = ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)

class RECT(ctypes.Structure):
    _fields_ = [("left", ctypes.c_long), ("top", ctypes.c_long),
                ("right", ctypes.c_long), ("bottom", ctypes.c_long)]

def window_title(hwnd):
    n = user32.GetWindowTextLengthW(hwnd)
    if n == 0:
        return ""
    buf = ctypes.create_unicode_buffer(n + 1)
    user32.GetWindowTextW(hwnd, buf, n + 1)
    return buf.value

def green_groups(img, x0=0, x1=None, y0=0, y1=None, min_run=18):
    pix = img.load()
    w, h = img.size
    if x1 is None:
        x1 = w
    if y1 is None:
        y1 = h
    cands = []
    for y in range(y0, y1):
        xs = []
        for x in range(x0, x1):
            r, g, b = pix[x, y][:3]
            if g > 140 and r < 100 and b < 140 and g > r + 35:
                xs.append(x)
        if len(xs) > min_run:
            cands.append((y, min(xs), max(xs), len(xs)))
    groups = []
    if not cands:
        return groups
    gy0, xmin, xmax, n = cands[0]
    ymax = gy0
    tot = n
    for y, a, b, n in cands[1:]:
        if y <= ymax + 4:
            ymax = y
            xmin = min(xmin, a)
            xmax = max(xmax, b)
            tot += n
        else:
            groups.append((gy0, ymax, xmin, xmax, tot))
            gy0, ymax, xmin, xmax, tot = y, y, a, b, n
    groups.append((gy0, ymax, xmin, xmax, tot))
    return groups

def dialog_button(img):
    """Return (cx, cy, w, h) of a dialog-sized green button in the lower half, else None."""
    w, h = img.size
    groups = green_groups(img, y0=int(h * 0.45))
    best = None
    for y0, y1, x0, x1, _tot in groups:
        bw, bh = x1 - x0, y1 - y0
        if 120 <= bw <= 280 and 28 <= bh <= 90:
            score = abs(bw - 180) + abs(bh - 56)
            if best is None or score < best[0]:
                best = (score, (x0 + x1) // 2, (y0 + y1) // 2, bw, bh, x0, y0, x1, y1)
    if not best:
        return None
    return best[1:]

def main():
    from PIL import Image, ImageGrab

    sim_path = sys.argv[1] if len(sys.argv) > 1 else None
    if not sim_path:
        print("no-sim")
        return 1
    sim = Image.open(sim_path).convert("RGB")
    btn = dialog_button(sim)
    if not btn:
        print("no-dialog")
        return 0
    cx, cy, bw, bh, *_rest = btn
    print("sim-btn", cx, cy, bw, bh)

    hits = []
    def cb(hwnd, _lp):
        if not user32.IsWindowVisible(hwnd):
            return True
        t = window_title(hwnd)
        if t == "锐涞经销商":
            hits.append(hwnd)
        return True
    user32.EnumWindows(EnumWindowsProc(cb), 0)
    if not hits:
        print("no-window")
        return 2
    hwnd = hits[0]
    user32.ShowWindow(hwnd, 9)
    user32.SetForegroundWindow(hwnd)
    rect = RECT()
    user32.GetWindowRect(hwnd, ctypes.byref(rect))
    grab = ImageGrab.grab(bbox=(rect.left, rect.top, rect.right, rect.bottom))
    # Match a same-sized green button, prefer right half (simulator pane).
    gw, gh = grab.size
    groups = green_groups(grab)
    scored = []
    for y0, y1, x0, x1, _tot in groups:
        w, h = x1 - x0, y1 - y0
        if abs(w - bw) <= 30 and abs(h - bh) <= 18:
            scored.append((abs(w - bw) + abs(h - bh) - (50 if x0 > gw * 0.35 else 0), x0, y0, x1, y1))
    if not scored:
        print("no-match-in-window")
        return 3
    scored.sort()
    _s, x0, y0, x1, y1 = scored[0]
    lx = (x0 + x1) // 2
    ly = (y0 + y1) // 2
    sx = rect.left + lx
    sy = rect.top + ly
    print("click", sx, sy, "local", lx, ly)
    user32.SetCursorPos(sx, sy)
    ctypes.windll.kernel32.Sleep(180)
    user32.mouse_event(0x0002, 0, 0, 0, 0)
    ctypes.windll.kernel32.Sleep(50)
    user32.mouse_event(0x0004, 0, 0, 0, 0)
    print("clicked")
    return 0

if __name__ == "__main__":
    sys.exit(main() or 0)
