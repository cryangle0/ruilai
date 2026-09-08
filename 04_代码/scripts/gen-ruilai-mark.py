from __future__ import annotations

from pathlib import Path

from fontTools.misc.transform import Identity
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTCollection
from PIL import Image, ImageDraw, ImageFont

WEB_PUBLIC = Path(r"E:\angsa\angsa_data\项目\锐涞经销商管理系统\04_代码\web\public")
MINI_LOGO = Path(r"E:\angsa\angsa_data\项目\锐涞经销商管理系统\04_代码\miniprogram\src\static\logo")
WEB_PUBLIC.mkdir(parents=True, exist_ok=True)
MINI_LOGO.mkdir(parents=True, exist_ok=True)

BLUE = "#1A68D7"
BLUE_RGB = (26, 104, 215)
WHITE = "#FFFFFF"
FONT_PATH = r"C:\Windows\Fonts\msyhbd.ttc"

ttc = TTCollection(FONT_PATH)
font = ttc.fonts[0]
glyph_name = font.getBestCmap()[ord("锐")]
gs = font.getGlyphSet()
bp = BoundsPen(gs)
gs[glyph_name].draw(bp)
xmin, ymin, xmax, ymax = bp.bounds
gw, gh = xmax - xmin, ymax - ymin

SIZE = 64
RX = round(SIZE * 10 / 36)
PAD_RATIO = 0.18
inner = SIZE * (1 - 2 * PAD_RATIO)
s = inner / max(gw, gh)
ox = (SIZE - gw * s) / 2
oy = (SIZE - gh * s) / 2

t = Identity
t = t.scale(1, -1)
t = t.translate(0, -SIZE)
t = t.translate(ox, oy)
t = t.scale(s)
t = t.translate(-xmin, -ymin)

pen = SVGPathPen(gs)
tp = TransformPen(pen, t)
gs[glyph_name].draw(tp)
d = pen.getCommands()

svg = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}" fill="none">\n'
    f'  <rect width="{SIZE}" height="{SIZE}" rx="{RX}" fill="{BLUE}"/>\n'
    f'  <path d="{d}" fill="{WHITE}"/>\n'
    f"</svg>\n"
)

for p in [WEB_PUBLIC / "logo.svg", WEB_PUBLIC / "favicon.svg", MINI_LOGO / "logo.svg"]:
    p.write_text(svg, encoding="utf-8")
    print("wrote", p)


def rounded_mark(px: int) -> Image.Image:
    img = Image.new("RGBA", (px, px), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    r = max(1, round(px * 10 / 36))
    draw.rounded_rectangle([0, 0, px - 1, px - 1], radius=r, fill=BLUE_RGB + (255,))
    fsize = max(8, round(px * 18 / 36))
    face = ImageFont.truetype(FONT_PATH, fsize, index=0)
    bbox = draw.textbbox((0, 0), "锐", font=face)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (px - tw) / 2 - bbox[0]
    y = (px - th) / 2 - bbox[1]
    draw.text((x, y), "锐", font=face, fill=(255, 255, 255, 255))
    return img


png16 = rounded_mark(16)
png32 = rounded_mark(32)
png48 = rounded_mark(48)
png180 = rounded_mark(180)
png192 = rounded_mark(192)
png512 = rounded_mark(512)

png32.save(WEB_PUBLIC / "favicon-32x32.png")
png192.save(WEB_PUBLIC / "favicon-192x192.png")
png180.save(WEB_PUBLIC / "apple-touch-icon.png")
png16.save(
    WEB_PUBLIC / "favicon.ico",
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48)],
    append_images=[png32, png48],
)
png512.save(MINI_LOGO / "logo.png")
png192.save(MINI_LOGO / "logo-192.png")

share_w, share_h = 500, 400
share = Image.new("RGBA", (share_w, share_h), (243, 245, 249, 255))
mark = rounded_mark(160)
sx = (share_w - mark.width) // 2
sy = (share_h - mark.height) // 2
share.alpha_composite(mark, (sx, sy))
share.convert("RGB").save(MINI_LOGO / "share.png", quality=95)

print("RX", RX)
print("glyph bounds", xmin, ymin, xmax, ymax)
print("scale", round(s, 5), "ox", round(ox, 2), "oy", round(oy, 2))
print("done")
