"""Story backgrounds for the Helvetia deck: a lake castle, a pike battle, a walled town, a winter village.

Reuses the landscape / ageing pipeline from gen_images.py and paints buildings and figures on top
as supersampled silhouettes with side-lighting, stone texture and water reflections.
"""
import math
import numpy as np
from PIL import Image, ImageDraw

exec(open("gen_images.py").read().split("import os")[0])  # fbm1d, fbm2d, lerp, c, landscape, age, save, W, H

S = 2  # supersampling factor for crisp edges
R = np.random.default_rng(1315)


def hexc(h, k=1.0, a=255):
    v = c(h) * k
    return tuple(int(max(0, min(1, x)) * 255) for x in v) + (a,)


def new_layer():
    im = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


def finish(im, seed, tex=0.14):
    arr = np.asarray(im.resize((W, H), Image.LANCZOS)).astype(float) / 255
    n = fbm2d(H, W, seed, octaves=7, base=12)
    big = fbm2d(H, W, seed + 1, octaves=3, base=3)
    grain = gaussian_filter(R.normal(0, 1, (H, W)), (1.2, 0.6))
    arr[..., :3] *= (1 + (tex * 1.6) * n + 0.12 * big + 0.05 * grain)[..., None]
    # soot and weathering collect low on walls: darken toward each shape's bottom edge
    a = arr[..., 3]
    below = gaussian_filter(np.roll(a, -18, axis=0), (10, 2))
    arr[..., :3] *= (1 - 0.28 * np.clip(a - below + 0.2, 0, 1) * 0)[..., None]
    occl = gaussian_filter(a, 6)
    arr[..., :3] *= (0.78 + 0.22 * occl)[..., None]
    arr[..., :3] = lerp(arr[..., :3], gaussian_filter(arr[..., :3], (0.7, 0.7, 0)), 0.5)
    return np.clip(arr, 0, 1)


def comp(img, arr, haze=None, amount=0.0):
    rgb = arr[..., :3]
    if haze is not None:
        rgb = lerp(rgb, c(haze)[None, None], amount)
    a = arr[..., 3:4]
    return img * (1 - a) + rgb * a


def reflect(img, arr, water_y, strength=0.55, blur=(5, 2)):
    """Mirror a layer below the waterline, softened and darkened."""
    wy = int(water_y)
    top = arr[max(0, 2 * wy - H):wy][::-1]
    ref = np.zeros_like(arr)
    ref[wy:wy + top.shape[0]] = top
    ref = gaussian_filter(ref, (blur[0] + 3, blur[1] + 1, 0))
    for row in range(wy, H):  # ripples break the mirror image up
        k = row - wy
        ref[row] = np.roll(ref[row], int(4 * math.sin(k * 0.35) + 3 * math.sin(k * 0.11 + 1)), axis=0)
        if (k // 3) % 5 == 0:
            ref[row, :, 3] *= 0.55
    ref[..., 3] *= strength
    ref[..., :3] *= 0.75
    return comp(img, ref)


def P(x, y):  # fractions of the canvas -> supersampled pixels
    return (x * W * S, y * H * S)


# ── building blocks ────────────────────────────────────────────────────────────

def block(d, x, y, w, h, stone, side=0.22, k_side=0.62):
    """A lit front face plus a darker right-hand side face. x,y = bottom-left in px."""
    sw = w * side
    d.rectangle([x, y - h, x + w, y], fill=hexc(stone))
    d.polygon([(x + w, y), (x + w, y - h), (x + w + sw, y - h - sw * 0.35), (x + w + sw, y - sw * 0.35)], fill=hexc(stone, k_side))
    return sw


def roof(d, x, y, w, h, col, sw=0.0, kind="pyramid"):
    """Two-tone roof: lit left slope, shaded right slope."""
    apex = (x + w / 2 + sw * 0.5, y - h)
    if kind == "gable":
        d.polygon([(x - w * 0.05, y), apex, (x + w / 2 + sw * 0.5, y)], fill=hexc(col, 1.1))
        d.polygon([(x + w / 2 + sw * 0.5, y), apex, (x + w + sw + w * 0.05, y - sw * 0.35)], fill=hexc(col, 0.62))
    else:
        d.polygon([(x - w * 0.04, y), apex, (x + w * 0.62, y)], fill=hexc(col, 1.08))
        d.polygon([(x + w * 0.62, y), apex, (x + w + sw, y - sw * 0.35)], fill=hexc(col, 0.6))


def windows(d, x, y, w, h, rows, cols, col="1A120C", size=0.16):
    for r in range(rows):
        for q in range(cols):
            if R.random() < 0.25:
                continue
            wx = x + w * (q + 0.5) / cols
            wy = y - h * (r + 0.55) / rows
            ww, wh = w * size / cols * 1.3, h * 0.2 / rows
            d.rectangle([wx - ww / 2, wy - wh / 2, wx + ww / 2, wy + wh / 2], fill=hexc(col))
            d.ellipse([wx - ww / 2, wy - wh / 2 - ww / 2, wx + ww / 2, wy - wh / 2 + ww / 2], fill=hexc(col))


def crenels(d, x, y, w, size, stone):
    n = max(2, int(w / (size * 2)))
    step = w / n
    for i in range(n):
        d.rectangle([x + i * step, y - size, x + i * step + step * 0.55, y], fill=hexc(stone))


def tower(d, x, y, w, h, stone, roof_col, roof_h, kind="pyramid", win=True, cren=False):
    sw = block(d, x, y, w, h, stone)
    if win:
        windows(d, x, y - h * 0.15, w, h * 0.8, max(1, int(h / (w * 0.9))), 1 if w < 60 else 2)
    if cren:
        crenels(d, x, y - h, w, w * 0.12, stone)
    if roof_h > 0:
        roof(d, x, y - h, w, roof_h, roof_col, sw, kind)


# ── 1 · Lake castle (Chillon on Lake Geneva) ──────────────────────────────────

def castle_scene():
    img = landscape(61, "3D4552", "E6CFA0", "C8BFA8",
                    [(0.50, 0.30, "9A9CA2", 61, 7, True), (0.58, 0.20, "66705F", 62, 7, True),
                     (0.64, 0.07, "45523C", 63, 5, False)],
                    lake=(0.64, "3E5658"), sun=(0.24, 0.30, "F6E3B0"), snow=1.0)
    lay, d = new_layer()
    wy = 0.70 * H * S
    # rocky island
    pts = [P(0.30, 0.70)]
    for i in range(30):
        t = i / 29
        pts.append((P(0.30 + 0.47 * t, 0)[0], wy - (18 + 22 * math.sin(t * math.pi) + R.uniform(-6, 6)) * S))
    pts.append(P(0.77, 0.70))
    d.polygon(pts, fill=hexc("4A4338"))
    base = wy - 34 * S
    stone, roofc = "CDBA98", "6E3A26"
    # curtain wall along the island
    block(d, *P(0.32, 0)[:1], base, 0.43 * W * S, 70 * S, stone)
    crenels(d, P(0.32, 0)[0], base - 70 * S, 0.43 * W * S, 9 * S, stone)
    windows(d, P(0.32, 0)[0], base, 0.43 * W * S, 70 * S, 1, 14, size=0.05)
    # buildings behind the wall, left → right
    parts = [
        (0.315, 0.040, 120, 70, "cone"), (0.36, 0.06, 150, 60, "gable"), (0.42, 0.05, 140, 55, "gable"),
        (0.47, 0.055, 300, 95, "pyramid"),  # main keep
        (0.535, 0.07, 165, 60, "gable"), (0.61, 0.045, 190, 85, "cone"), (0.66, 0.06, 150, 55, "gable"),
        (0.725, 0.04, 175, 80, "cone"),
    ]
    for (fx, fw, fh, rh, kind) in parts:
        x, w = fx * W * S, fw * W * S
        tower(d, x, base - 20 * S, w, fh * S, stone, roofc, rh * S, "gable" if kind == "gable" else "pyramid",
              cren=(kind == "pyramid"))
    arr = finish(lay, 71, 0.16)
    img = reflect(img, arr, 0.70 * H, 0.6)
    img = comp(img, arr, "C8BFA8", 0.08)
    return img


# ── 4 · Battle: Swiss pike square against mounted knights ─────────────────────

def figure(d, x, y, s, col, pike=None, flag=False, halberd=False):
    """A foot soldier with a kettle hat; y = feet. pike = angle from vertical in degrees (+ leans right)."""
    h = 60 * s
    d.line([(x - 4 * s, y), (x - 2 * s, y - h * 0.45)], fill=col, width=max(1, int(3.2 * s)))
    d.line([(x + 4 * s, y), (x + 2 * s, y - h * 0.45)], fill=col, width=max(1, int(3.2 * s)))
    d.polygon([(x - 7 * s, y - h * 0.42), (x + 7 * s, y - h * 0.42), (x + 8 * s, y - h * 0.82), (x - 8 * s, y - h * 0.82)], fill=col)
    d.ellipse([x - 4.2 * s, y - h * 0.98, x + 4.2 * s, y - h * 0.84], fill=col)
    d.ellipse([x - 7.5 * s, y - h * 0.97, x + 7.5 * s, y - h * 0.92], fill=col)  # hat brim
    if pike is not None:
        a = math.radians(pike)
        L = h * (3.6 if not halberd else 1.6)
        hx, hy = x + 6 * s, y - h * 0.7
        tx, ty = hx + math.sin(a) * L, hy - math.cos(a) * L
        bx, by = hx - math.sin(a) * L * 0.18, hy + math.cos(a) * L * 0.18
        d.line([(bx, by), (tx, ty)], fill=col, width=max(1, int(1.6 * s)))
        if halberd:
            d.polygon([(tx, ty), (tx + 9 * s, ty + 4 * s), (tx + 8 * s, ty + 13 * s), (tx, ty + 10 * s)], fill=col)
        if flag:
            fw, fh = 46 * s, 34 * s
            pts_top = [(tx + i / 10 * fw, ty + 4 * s + math.sin(i / 10 * math.pi * 1.6) * 5 * s) for i in range(11)]
            pts_bot = [(px, py + fh) for (px, py) in reversed(pts_top)]
            d.polygon(pts_top + pts_bot, fill=hexc("9B1C18"))
            cx, cy = tx + fw * 0.5, ty + 4 * s + fh * 0.5
            arm, ln = fh * 0.17, fh * 0.36
            d.rectangle([cx - arm, cy - ln, cx + arm, cy + ln], fill=hexc("EDE3CC"))
            d.rectangle([cx - ln, cy - arm, cx + ln, cy + arm], fill=hexc("EDE3CC"))


def knight(d, x, y, s, col):
    """Mounted knight charging left with a lowered lance; y = hooves."""
    d.ellipse([x - 32 * s, y - 62 * s, x + 30 * s, y - 34 * s], fill=col)  # horse body
    d.polygon([(x - 26 * s, y - 56 * s), (x - 44 * s, y - 84 * s), (x - 54 * s, y - 80 * s), (x - 40 * s, y - 46 * s)], fill=col)  # neck
    d.polygon([(x - 44 * s, y - 86 * s), (x - 64 * s, y - 72 * s), (x - 60 * s, y - 66 * s), (x - 46 * s, y - 74 * s)], fill=col)  # head
    for lx, ang in ((-24, -20), (-14, 12), (16, -10), (24, 22)):
        a = math.radians(ang)
        d.line([(x + lx * s, y - 40 * s), (x + lx * s + math.sin(a) * 40 * s, y)], fill=col, width=max(1, int(4 * s)))
    d.line([(x + 30 * s, y - 56 * s), (x + 44 * s, y - 30 * s)], fill=col, width=max(1, int(4 * s)))  # tail
    d.polygon([(x - 8 * s, y - 60 * s), (x + 8 * s, y - 60 * s), (x + 6 * s, y - 92 * s), (x - 7 * s, y - 92 * s)], fill=col)  # rider
    d.ellipse([x - 7 * s, y - 108 * s, x + 7 * s, y - 90 * s], fill=col)  # helm
    d.polygon([(x - 2 * s, y - 108 * s), (x + 3 * s, y - 124 * s), (x + 6 * s, y - 106 * s)], fill=hexc("E6DCC4"))  # plume
    d.line([(x + 20 * s, y - 80 * s), (x - 120 * s, y - 70 * s)], fill=col, width=max(1, int(2.4 * s)))  # lance
    d.polygon([(x - 36 * s, y - 62 * s), (x + 20 * s, y - 62 * s), (x + 24 * s, y - 34 * s), (x - 30 * s, y - 34 * s)], fill=hexc("6B5A2C", 0.9))  # caparison


def battle_scene():
    img = landscape(71, "4A4A48", "D9C7A0", "BCB29C",
                    [(0.46, 0.22, "8E9096", 71, 7, True), (0.56, 0.14, "6A6E60", 72, 7, True),
                     (0.64, 0.05, "5C5A3E", 73, 5, False), (0.76, 0.04, "4B4A30", 74, 5, False)],
                    sun=(0.68, 0.30, "F2DCA8"), snow=0.8)
    # meadow
    yy = np.arange(H)[:, None]
    ground = np.clip((yy - 0.72 * H) / 20, 0, 1)[..., None]
    meadow = lerp(c("6A6340"), c("3A3320"), np.clip((yy - 0.72 * H) / (0.28 * H), 0, 1)[..., None])
    meadow = meadow * (1 + 0.1 * fbm2d(H, W, 75, octaves=6, base=8)[..., None])
    img = lerp(img, np.broadcast_to(meadow, img.shape), ground)
    rows = 9
    for r in range(rows):  # far → near
        t = r / (rows - 1)
        y = (0.70 + 0.27 * t) * H * S
        s = (0.55 + 1.15 * t) * S
        lay, d = new_layer()
        col = hexc("2B1E14")
        # Swiss square on the left
        n = int(16 - 4 * t)
        for i in range(n):
            x = (0.04 + 0.52 * i / n + R.uniform(-0.01, 0.01) + (0.02 if r % 2 else 0)) * W * S
            front = r >= rows - 2
            ang = 72 + R.uniform(-6, 6) if front else R.uniform(-9, 11)
            flag = (not front) and r in (1, 3, 5) and i in (n // 3, 2 * n // 3)
            figure(d, x, y + R.uniform(-4, 4) * S, s, col, pike=ang, flag=flag, halberd=(r == 4 and i % 4 == 0))
        # knights on the right
        k = int(5 - 1.5 * t)
        for i in range(max(2, k)):
            x = (0.70 + 0.30 * i / max(2, k) + R.uniform(-0.015, 0.015)) * W * S
            knight(d, x, y, s * 0.9, col)
        arr = finish(lay, 80 + r, 0.18)
        img = comp(img, arr, "BCB29C", 0.55 * (1 - t) ** 1.6)
        if r == 4:  # dust and gun smoke drifting through the middle ranks
            smoke = np.clip(fbm2d(H, W, 91, octaves=6, base=3) * 1.6 + 0.2, 0, 1)
            band = np.exp(-((yy - 0.66 * H) / (0.16 * H)) ** 2)
            img = lerp(img, c("D2C6AA")[None, None], (smoke * band * 0.55)[..., None])
    return img


# ── 5 · Walled town on a river at dusk (Lucerne) ──────────────────────────────

def town_scene():
    img = landscape(81, "2E2230", "D88E58", "B98D72",
                    [(0.44, 0.26, "6A5A5E", 81, 7, True), (0.55, 0.10, "4A4038", 82, 6, False)],
                    lake=(0.74, "3A3C40"), sun=(0.30, 0.40, "F6C27A"), snow=0.6)
    lay, d = new_layer()
    wall_y = 0.555 * H * S
    stone, roofc = "8C7A64", "5A2E22"
    # Musegg wall with its towers along the hill
    hill = [P(0, 0.62)] + [P(t, 0.58 - 0.04 * math.sin(t * math.pi * 1.3)) for t in np.linspace(0, 1, 40)] + [P(1, 0.62)]
    d.polygon(hill + [P(1, 0.75), P(0, 0.75)], fill=hexc("40382A"))
    block(d, 0.08 * W * S, wall_y, 0.84 * W * S, 26 * S, stone)
    crenels(d, 0.08 * W * S, wall_y - 26 * S, 0.84 * W * S, 6 * S, stone)
    for i in range(9):
        x = (0.09 + i * 0.1) * W * S
        tower(d, x, wall_y + 4 * S, 34 * S, (70 + (i % 3) * 18) * S, stone, roofc, 70 * S, "pyramid")
    # houses packed between the wall and the water
    lit = []
    for r in range(4):
        y = (0.63 + r * 0.035) * H * S
        x = -20 * S
        while x < W * S:
            w = R.uniform(40, 80) * S
            h = R.uniform(50, 90) * S * (0.9 + r * 0.1)
            plaster = R.choice(["C9B08A", "B89A74", "D2BE98", "A88E6C", "BFA37C"])
            sw = block(d, x, y, w, h, plaster)
            roof(d, x, y - h, w, R.uniform(35, 60) * S, R.choice(["5A2E22", "6E3A26", "4A2A1E"]), sw, "gable")
            for q in range(int(w / (18 * S))):
                for k in range(int(h / (24 * S))):
                    if R.random() < 0.45:
                        lit.append((x + 8 * S + q * 18 * S, y - 14 * S - k * 24 * S))
            x += w + sw + R.uniform(-4, 6) * S
    # Hofkirche twin spires
    for dx in (0.0, 0.035):
        x = (0.62 + dx) * W * S
        tower(d, x, 0.64 * H * S, 30 * S, 190 * S, "B8A688", "3E3A36", 120 * S, "pyramid", win=False)
    for (wx, wy) in lit:
        d.rectangle([wx, wy, wx + 6 * S, wy + 9 * S], fill=hexc("F2B45A"))
    arr = finish(lay, 85, 0.14)
    img = comp(img, arr, "B98D72", 0.06)
    # Chapel Bridge with the Water Tower
    lay2, d2 = new_layer()
    y0, y1 = 0.79 * H * S, 0.74 * H * S
    x0, x1 = 0.05 * W * S, 0.62 * W * S
    for i in range(24):
        px = x0 + (x1 - x0) * i / 23
        py = y0 + (y1 - y0) * i / 23
        d2.line([(px, py), (px, py + 40 * S)], fill=hexc("2A1E14"), width=int(4 * S))
    d2.polygon([(x0, y0), (x1, y1), (x1, y1 - 16 * S), (x0, y0 - 16 * S)], fill=hexc("5A3E26"))
    d2.polygon([(x0, y0 - 16 * S), (x1, y1 - 16 * S), (x1 - 10 * S, y1 - 34 * S), (x0 - 10 * S, y0 - 34 * S)], fill=hexc("6E3424"))
    tx = 0.36 * W * S
    ty = y0 + (y1 - y0) * ((tx - x0) / (x1 - x0)) + 10 * S
    tower(d2, tx, ty, 64 * S, 150 * S, "9E8A6C", "4A2A1E", 60 * S, "pyramid", cren=False)
    arr2 = finish(lay2, 86, 0.16)
    img = reflect(img, np.maximum(arr, 0) * 0 + arr, 0.74 * H, 0.45)
    img = reflect(img, arr2, 0.79 * H, 0.5)
    img = comp(img, arr2)
    return img


# ── 6 · Winter village with a church ──────────────────────────────────────────

def village_scene():
    img = landscape(91, "5A6470", "DCD6CA", "CFCBC0",
                    [(0.46, 0.30, "B4B6BA", 91, 7, True), (0.60, 0.26, "8C9096", 92, 7, True)],
                    sun=(0.72, 0.26, "F0E6D0"), snow=1.6)
    yy = np.arange(H)[:, None]
    snowfield = lerp(c("E9E4DA"), c("BDB8B0"), np.clip((yy - 0.68 * H) / (0.32 * H), 0, 1)[..., None])
    snowfield = snowfield * (1 + 0.04 * fbm2d(H, W, 95, octaves=6, base=6)[..., None])
    img = lerp(img, np.broadcast_to(snowfield, img.shape), np.clip((yy - 0.68 * H) / 12, 0, 1)[..., None])
    lay, d = new_layer()
    # pines
    for i in range(70):
        x = R.uniform(0, 1) * W * S
        if 0.28 * W * S < x < 0.72 * W * S and R.random() < 0.7:
            continue
        y = R.uniform(0.66, 0.74) * H * S
        h = R.uniform(60, 130) * S
        for k in range(4):
            yy0 = y - h * k / 4
            w = h * 0.36 * (1 - k / 5)
            d.polygon([(x - w, yy0), (x, yy0 - h * 0.42), (x + w, yy0)], fill=hexc("26302A"))
            d.polygon([(x - w * 0.5, yy0 - h * 0.21), (x, yy0 - h * 0.42), (x + w * 0.5, yy0 - h * 0.21)], fill=hexc("E8E4DA"))
    # chalets
    for (fx, fy, fw) in ((0.33, 0.76, 0.07), (0.42, 0.79, 0.08), (0.58, 0.77, 0.075), (0.66, 0.80, 0.085), (0.25, 0.81, 0.08)):
        x, y, w = fx * W * S, fy * H * S, fw * W * S
        h = w * 0.55
        sw = block(d, x, y, w, h, "5A3A22")
        windows(d, x, y, w, h, 2, 3, col="F0B860", size=0.18)
        d.polygon([(x - w * 0.12, y - h), (x + w / 2 + sw / 2, y - h - w * 0.28), (x + w + sw + w * 0.12, y - h - sw * 0.35)], fill=hexc("EDE9E0"))
        d.polygon([(x - w * 0.12, y - h), (x + w + sw + w * 0.12, y - h - sw * 0.35), (x + w + sw + w * 0.12, y - h - sw * 0.35 + 8 * S), (x - w * 0.12, y - h + 8 * S)], fill=hexc("3A281A"))
    # church
    cx, cy = 0.49 * W * S, 0.73 * H * S
    sw = block(d, cx - 40 * S, cy, 150 * S, 90 * S, "E2DCCE")
    roof(d, cx - 40 * S, cy - 90 * S, 150 * S, 50 * S, "EDE9E0", sw, "gable")
    tower(d, cx - 70 * S, cy, 44 * S, 200 * S, "E2DCCE", "3E3A36", 120 * S, "pyramid", win=False)
    d.ellipse([cx - 58 * S, cy - 170 * S, cx - 38 * S, cy - 150 * S], fill=hexc("2A2420"))  # clock face
    d.line([(cx - 48 * S, cy - 160 * S), (cx - 48 * S, cy - 167 * S)], fill=hexc("E6DCC4"), width=int(2 * S))
    arr = finish(lay, 97, 0.12)
    img = comp(img, arr, "CFCBC0", 0.05)
    return img


if __name__ == "__main__":
    save(age(castle_scene(), 0.8, 11), "castle.jpg")
    save(age(battle_scene(), 0.8, 12), "battle.jpg")
    save(age(town_scene(), 0.8, 13), "town.jpg")
    save(age(village_scene(), 0.8, 14), "village.jpg")
    print("scenes done")
