"""Procedural 'old master' Alpine paintings, parchment and heraldry for the Helvetia deck."""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import gaussian_filter, zoom

rng = np.random.default_rng(1499)
W, H = 1920, 1080
OUT = "img/"


def fbm1d(n, octaves=7, seed=0, rough=0.55):
    r = np.random.default_rng(seed)
    out = np.zeros(n)
    amp, total = 1.0, 0.0
    for o in range(octaves):
        pts = 2 ** (o + 2) + 1
        ctrl = r.uniform(-1, 1, pts)
        out += amp * np.interp(np.linspace(0, pts - 1, n), np.arange(pts), ctrl)
        total += amp
        amp *= rough
    return out / total


def fbm2d(h, w, seed=0, octaves=6, base=4):
    r = np.random.default_rng(seed)
    out = np.zeros((h, w))
    amp, total = 1.0, 0.0
    for o in range(octaves):
        s = base * 2 ** o
        g = r.uniform(-1, 1, (s + 1, int(s * w / h) + 1))
        out += amp * zoom(g, (h / g.shape[0], w / g.shape[1]), order=3)[:h, :w]
        total += amp
        amp *= 0.5
    return out / total


def lerp(a, b, t):
    return a + (b - a) * t


def c(hexs):
    return np.array([int(hexs[i:i + 2], 16) for i in (0, 2, 4)], float) / 255


def landscape(seed, sky_top, sky_low, haze, ridges, lake=None, sun=None, snow=0.0):
    img = np.zeros((H, W, 3))
    y = np.linspace(0, 1, H)[:, None, None]
    img[:] = lerp(c(sky_top), c(sky_low), y ** 0.8)
    # soft painted clouds
    cl = fbm2d(H, W, seed + 3, octaves=5, base=2)
    cl = np.clip((cl + 0.1) * 1.8, 0, 1) * np.clip(1.1 - y[..., 0] * 1.6, 0, 1)
    img = lerp(img, c(haze)[None, None] * 1.05, cl[..., None] * 0.55)
    if sun is not None:
        sx, sy, scol = sun
        yy, xx = np.mgrid[0:H, 0:W]
        d = np.sqrt((xx / W - sx) ** 2 * 3.1 + (yy / H - sy) ** 2)
        glow = np.exp(-d * 6.0)[..., None]
        img = img + (c(scol) - img) * glow * 0.85
    rows = np.arange(H)[:, None]
    for i, (base_y, amp, col, sd, oct_, sharp) in enumerate(ridges):
        prof = fbm1d(W, oct_, seed * 31 + sd, rough=0.5)
        if sharp:
            env = fbm1d(W, 3, seed * 7 + sd, rough=0.6)
            prof = (1 - np.abs(prof)) ** 3  # ridged noise -> sharp alpine peaks
            prof = (prof - prof.min()) / (prof.max() - prof.min())
            prof = prof * (0.55 + 0.45 * (env - env.min()) / (env.max() - env.min()))
        line = (base_y - amp * prof) * H
        mask = (rows >= line[None, :]).astype(float)
        mask = gaussian_filter(mask, 1.2)
        depth = i / max(1, len(ridges) - 1)
        colv = lerp(c(haze), c(col), 0.35 + 0.65 * depth)
        # vertical shading on each ridge + rock texture
        tex = fbm2d(H, W, seed + 50 + i, octaves=6, base=6)
        shade = np.clip((rows - line[None, :]) / (H * 0.25), 0, 1)
        layer = colv[None, None] * (1 - 0.35 * shade[..., None]) * (1 + 0.12 * tex[..., None])
        if snow > 0 and sharp:
            thr = (base_y - amp * (0.75 - 0.2 * snow)) * H
            streak = gaussian_filter(rng.normal(0, 1, (H, W)), (14, 1.2))
            sm = np.clip((thr + 40 * tex + 25 * streak - rows) / 18, 0, 1) * mask
            layer = lerp(layer, lerp(c("F2EEE4"), c(haze), 0.3 * (1 - depth))[None, None], sm[..., None] * 0.9)
        img = lerp(img, layer, mask[..., None])
    if lake is not None:
        ly, lcol = lake
        top = int(ly * H)
        refl = img[max(0, 2 * top - H):top][::-1]
        refl = gaussian_filter(refl, (6, 2, 0))
        band = np.zeros_like(img[top:])
        band[: refl.shape[0]] = refl
        t = np.linspace(0, 1, H - top)[:, None, None]
        water = lerp(band * 0.8 + c(lcol) * 0.2, c(lcol), t ** 0.7)
        ripple = fbm2d(H - top, W, seed + 9, octaves=4, base=8)
        water *= 1 + 0.05 * ripple[..., None]
        img[top:] = water
    return np.clip(img, 0, 1)


def age(img, blur_mask_strength=1.0, seed=0):
    """Sfumato + varnish + craquelure + vignette."""
    h, w, _ = img.shape
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    # blurred 'замылено' areas: edges + random soft patches
    soft = gaussian_filter(img, (14, 14, 0))
    softer = gaussian_filter(img, (30, 30, 0))
    patch = fbm2d(h, w, seed + 77, octaves=3, base=2)
    m = np.clip((r - 0.45) * 1.4 + patch * 0.6, 0, 1) * blur_mask_strength
    out = lerp(img, soft, np.clip(m * 1.6, 0, 1)[..., None])
    out = lerp(out, softer, np.clip((m - 0.5) * 2, 0, 1)[..., None])
    # brush texture
    brush = gaussian_filter(rng.normal(0, 1, (h, w)), (0.6, 3.5))
    out *= 1 + 0.035 * brush[..., None]
    # varnish yellowing
    lum = out.mean(axis=2, keepdims=True)
    varnish = c("C9A25E")
    out = out * lerp(np.ones(3), varnish * 1.25, 0.45)
    out = lerp(out, lum * varnish * 1.3, 0.18)
    # craquelure
    crack = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(crack)
    cr = np.random.default_rng(seed + 5)
    for _ in range(900):
        x, y = cr.uniform(0, w), cr.uniform(0, h)
        for _ in range(cr.integers(3, 8)):
            nx, ny = x + cr.normal(0, 18), y + cr.normal(0, 18)
            d.line([(x, y), (nx, ny)], fill=int(cr.uniform(60, 140)), width=1)
            x, y = nx, ny
    crack = np.asarray(crack.filter(ImageFilter.GaussianBlur(0.6)), float) / 255
    out *= 1 - 0.22 * crack[..., None]
    # vignette
    rx, ry = np.abs(xx - w / 2) / (w / 2), np.abs(yy - h / 2) / (h / 2)
    rr = (rx ** 4 + ry ** 4) ** 0.25
    out *= np.clip(1.08 - 0.6 * rr ** 3, 0.3, 1)[..., None]
    out = np.clip(out, 0, 1)
    return Image.fromarray((out * 255).astype(np.uint8))


def save(im, name, q=88):
    im.save(OUT + name, quality=q, optimize=True)


import os
os.makedirs(OUT, exist_ok=True)

# 1. Dawn over the high Alps (title / finale)
a = landscape(11, "2B2F3A", "D9B98A", "C9B9A0",
              [(0.62, 0.38, "8A8C95", 1, 7, True), (0.70, 0.30, "5E6470", 2, 7, True),
               (0.80, 0.16, "3C4A3A", 3, 6, False), (0.92, 0.10, "1F2A1E", 4, 6, False)],
              sun=(0.62, 0.42, "F4D9A0"), snow=1.0)
save(age(a, 1.2, 1), "alps_dawn.jpg")

# 2. Lake Geneva in the manner of Konrad Witz
b = landscape(23, "6F8597", "E3D3AE", "B9BBA8",
              [(0.50, 0.28, "A8ACB0", 5, 7, True), (0.58, 0.14, "6D7A6A", 6, 6, False),
               (0.63, 0.06, "48573F", 7, 5, False)],
              lake=(0.63, "3E5A5E"), sun=(0.3, 0.3, "F3E3B8"), snow=0.8)
save(age(b, 0.9, 2), "lake.jpg")

# 3. Dusk valley, deep reds
d = landscape(37, "3A1E1A", "C77C4A", "B88A66",
              [(0.55, 0.34, "6E4A44", 8, 7, True), (0.68, 0.24, "4A3430", 9, 7, True),
               (0.82, 0.12, "2E2420", 10, 6, False), (0.95, 0.08, "1A1412", 11, 6, False)],
              sun=(0.45, 0.55, "F2B070"), snow=0.5)
save(age(d, 1.1, 3), "dusk.jpg")

# 4. Winter pass
e = landscape(41, "5A6470", "D8D4CA", "CFCBC0",
              [(0.48, 0.30, "B4B6BA", 12, 7, True), (0.62, 0.30, "8C9096", 13, 7, True),
               (0.80, 0.20, "5A5E60", 14, 6, True), (0.96, 0.10, "2E3230", 15, 6, False)],
              sun=(0.75, 0.25, "F0E6D0"), snow=1.6)
save(age(e, 1.0, 4), "winter.jpg")

# Parchment
p = np.ones((H, W, 3)) * c("E6D3AE")
n1 = fbm2d(H, W, 101, octaves=7, base=3)
n2 = fbm2d(H, W, 102, octaves=4, base=2)
p *= (1 + 0.07 * n1[..., None])
p = lerp(p, c("B68E55"), np.clip(n2 * 1.4 - 0.25, 0, 1)[..., None] * 0.35)  # stains
fib = gaussian_filter(rng.normal(0, 1, (H, W)), (0.5, 6))
p *= 1 + 0.025 * fib[..., None]
yy, xx = np.mgrid[0:H, 0:W]
r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
burn = np.clip((r - 0.75) * 1.6, 0, 1) ** 1.5
p = lerp(p, c("6B4423"), burn[..., None] * 0.75)
save(Image.fromarray((np.clip(p, 0, 1) * 255).astype(np.uint8)), "parchment.jpg", 90)

# Dark walnut / smoke background
dk = np.ones((H, W, 3)) * c("1E1611")
dk *= 1 + 0.35 * fbm2d(H, W, 202, octaves=6, base=2)[..., None]
dk = lerp(dk, c("4A2418"), np.clip(1 - r, 0, 1)[..., None] ** 2 * 0.6)
save(Image.fromarray((np.clip(dk, 0, 1) * 255).astype(np.uint8)), "walnut.jpg", 90)


# Heraldic shield: Swiss cross, gilt rim, aged
def shield(size=1200):
    S = size * 4
    im = Image.new("RGBA", (S, int(S * 1.18)), (0, 0, 0, 0))
    dr = ImageDraw.Draw(im)
    w, h = S, int(S * 1.18)

    def outline(inset):
        pts = []
        for t in np.linspace(0, 1, 200):  # right curve
            pts.append((w - inset - 0 * t, inset + t * (h * 0.55 - inset)))
        for t in np.linspace(0, 1, 200):
            ang = t * np.pi / 2
            pts.append((w / 2 + (w / 2 - inset) * np.cos(ang), h * 0.55 + (h * 0.45 - inset) * np.sin(ang)))
        for x, y in reversed(pts[:]):
            pts.append((w - x, y))
        return pts

    dr.polygon(outline(0), fill=(122, 88, 40, 255))
    dr.polygon(outline(S * 0.035), fill=(196, 152, 78, 255))
    dr.polygon(outline(S * 0.06), fill=(140, 28, 26, 255))
    arm, ln = S * 0.13, S * 0.30
    cx, cy = w / 2, h * 0.47
    dr.rectangle([cx - arm / 2, cy - ln, cx + arm / 2, cy + ln], fill=(236, 226, 205, 255))
    dr.rectangle([cx - ln, cy - arm / 2, cx + ln, cy + arm / 2], fill=(236, 226, 205, 255))
    im = im.resize((size, int(size * 1.18)), Image.LANCZOS)
    a = np.asarray(im).astype(float) / 255
    hh, ww = a.shape[:2]
    tex = fbm2d(hh, ww, 303, octaves=6, base=4)
    yy, xx = np.mgrid[0:hh, 0:ww]
    light = 1.15 - 0.5 * np.sqrt(((xx - ww * 0.35) / ww) ** 2 + ((yy - hh * 0.3) / hh) ** 2)
    a[..., :3] *= (light * (1 + 0.12 * tex))[..., None]
    a[..., :3] = np.clip(a[..., :3], 0, 1)
    return Image.fromarray((a * 255).astype(np.uint8), "RGBA")


shield().save(OUT + "shield.png", optimize=True)
print("done")
