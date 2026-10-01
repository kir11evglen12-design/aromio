"""Oil-paint pass: Kuwahara brush regions, soft sfumato, uneven paint thickness, softened edges."""
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import uniform_filter, gaussian_filter


def kuwahara(img, r):
    lum = img.mean(axis=2)
    k = r + 1
    best_var = np.full(lum.shape, np.inf)
    out = np.zeros_like(img)
    m = uniform_filter(lum, k)
    m2 = uniform_filter(lum * lum, k)
    var = m2 - m * m
    mc = np.stack([uniform_filter(img[..., i], k) for i in range(3)], -1)
    for dy, dx in ((-r // 2, -r // 2), (-r // 2, r // 2), (r // 2, -r // 2), (r // 2, r // 2)):
        v = np.roll(var, (dy, dx), (0, 1))
        mean = np.roll(mc, (dy, dx), (0, 1))
        sel = v < best_var
        best_var = np.where(sel, v, best_var)
        out[sel] = mean[sel]
    return out


def paint(path, out, seed=0, R1=5, R2=3):
    img = np.asarray(Image.open(path).convert("RGB")).astype(float) / 255
    h, w, _ = img.shape
    rng = np.random.default_rng(seed)
    p = kuwahara(img, R1)
    p = kuwahara(p, R2)
    p = p * 0.7 + gaussian_filter(img, (2.0, 2.0, 0)) * 0.3  # keep tones continuous, no posterised blotches
    # soften everything a little, the far half of the picture more (sfumato)
    soft = gaussian_filter(p, (1.6, 1.6, 0))
    softer = gaussian_filter(p, (4.5, 4.5, 0))
    yy = np.linspace(0, 1, h)[:, None, None]
    far = np.clip(1 - yy * 1.4, 0, 1) * 0.6
    p = soft * (1 - far) + softer * far
    # uneven paint thickness: soft mottling, no regular pattern
    mott = gaussian_filter(rng.normal(0, 1, (h, w)), 3.0)
    p *= (1 + 0.035 * mott / mott.std())[..., None]
    # soften hard silhouette edges so nothing reads as a vector cut-out
    p = p * 0.55 + gaussian_filter(p, (1.3, 1.3, 0)) * 0.45
    Image.fromarray((np.clip(p, 0, 1) * 255).astype(np.uint8)).save(out, quality=95, subsampling=0)


if __name__ == "__main__":
    for i, name in enumerate(["castle", "battle", "town", "village", "lake"]):
        r = (3, 2) if name == "battle" else (5, 3)  # thin pikes survive a smaller brush
        paint(f"raw/{name}.jpg", f"img/{name}.jpg", i, *r)
        print("painted", name)
