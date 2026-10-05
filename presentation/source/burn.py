"""Realistic burns: ragged charred edges, a scorched brown band, burnt-through holes and scorch spots."""
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, zoom


def noise(h, w, seed, base, octaves=6):
    r = np.random.default_rng(seed)
    out = np.zeros((h, w))
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        s = base * 2 ** o
        g = r.uniform(-1, 1, (s + 1, int(s * w / h) + 2))
        out += amp * zoom(g, (h / g.shape[0], w / g.shape[1]), order=3)[:h, :w]
        tot += amp
        amp *= 0.55
    return out / tot


def burn(img, seed=0, edge=55, holes=(), spots=(), gone=(0.07, 0.05, 0.035), keep_alpha=False):
    """img: HxWx3 float 0..1. edge: average burn depth from the border in px.
    holes: (cx, cy, r) in fractions of width/height and px radius — burnt through.
    spots: (cx, cy, r) — scorched but not burnt through."""
    h, w, _ = img.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(float)
    n_big = noise(h, w, seed, 3) * edge * 1.1      # wavy outline
    n_fine = noise(h, w, seed + 1, 24, 4) * 7       # ragged fibres
    d = np.minimum.reduce([xx, w - 1 - xx, yy, h - 1 - yy]) - edge + n_big + n_fine
    for (cx, cy, r) in holes:
        dh = np.hypot(xx - cx * w, yy - cy * h) - r + noise(h, w, seed + 7, 6) * r * 0.45 + n_fine
        d = np.minimum(d, dh)
    s = np.full((h, w), 1e9)
    for (cx, cy, r) in spots:
        s = np.minimum(s, np.hypot(xx - cx * w, yy - cy * h) - r + noise(h, w, seed + 9, 5) * r * 0.5)

    out = img.copy()
    # scorch: paper darkens and browns toward the burn line
    scorch = np.exp(-np.clip(d, 0, None) / 38.0)
    scorch = np.maximum(scorch, np.exp(-np.clip(s, 0, None) / 30.0) * 0.85)
    brown = np.array([0.36, 0.20, 0.09])
    out = out * (1 - 0.75 * scorch[..., None]) + brown * (0.45 * scorch[..., None]) * (1 - scorch[..., None] * 0.5)
    # charred rim: nearly black, a few px wide, uneven
    char = np.clip(1 - d / (5 + 3 * (noise(h, w, seed + 3, 12, 3) + 1)), 0, 1)
    out = out * (1 - char[..., None]) + np.array([0.05, 0.035, 0.025]) * char[..., None]
    # faint ember glow just inside the black edge
    ember = np.exp(-np.abs(d - 3.5) / 1.8) * (noise(h, w, seed + 5, 18, 3) > 0.35)
    out += np.array([0.35, 0.12, 0.02]) * gaussian_filter(ember, 1.0)[..., None] * 0.6
    alpha = np.clip(d + 1.0, 0, 1)  # burnt away where d < 0
    alpha = gaussian_filter(alpha, 0.6)
    out = np.clip(out, 0, 1)
    if keep_alpha:
        return np.dstack([out, alpha])
    return out * alpha[..., None] + np.array(gone) * (1 - alpha[..., None])


def burn_file(path, out, **kw):
    a = np.asarray(Image.open(path).convert("RGB")).astype(float) / 255
    res = burn(a, **kw)
    if kw.get("keep_alpha"):
        Image.fromarray((res * 255).astype(np.uint8), "RGBA").save(out, optimize=True)
    else:
        Image.fromarray((res * 255).astype(np.uint8)).save(out, quality=95, subsampling=0)
    print("burnt", out)


if __name__ == "__main__":
    # full-slide parchment: bites at the corners, a hole low on the left, a scorch mark along the bottom
    burn_file("raw/parchment.jpg", "img/parchment_burnt.jpg", seed=3, edge=45,
              holes=[(0.0, 0.0, 150), (1.0, 0.0, 70)],
              spots=[(0.50, 0.985, 60), (0.985, 0.42, 40)], gone=(0.08, 0.055, 0.04))
    # the '1707' card: a loose sheet with transparent burnt-away edges
    a = np.asarray(Image.open("raw/parchment.jpg").convert("RGB").resize((1920, 1080))).astype(float) / 255
    card = a[0:1160 if a.shape[0] >= 1160 else a.shape[0], 420:1500]
    card = np.asarray(Image.fromarray((card * 255).astype(np.uint8)).resize((1080, 1160))).astype(float) / 255
    res = burn(card, seed=11, edge=40, holes=[(1.0, 1.0, 110), (0.0, 0.62, 38)], spots=[(0.12, 0.06, 45)], keep_alpha=True)
    Image.fromarray((res * 255).astype(np.uint8), "RGBA").save("img/card_burnt.png", optimize=True)
    print("burnt img/card_burnt.png")
    # full-slide paintings: burnt-photograph edges
    for i, name in enumerate(["castle", "battle", "oldtown", "village"]):
        burn_file(f"img/{name}.jpg", f"img/{name}_burnt.jpg", seed=20 + i, edge=38,
                  holes=[(0.0, 1.0, 90)] if i % 2 else [(1.0, 0.0, 90)],
                  spots=[(0.97, 0.97, 50)] if i % 2 == 0 else [])
