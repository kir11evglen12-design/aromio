"""Turn the user's two pictures into 'old painting' backgrounds that match the rest of the deck."""
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

exec(open("gen_images.py").read().split("import os")[0])   # age(), fbm2d(), c(), lerp()
from paint import kuwahara

UP = "/root/.claude/uploads/4773d0d7-f4b0-52ec-883b-d79eba009dcc/"


def oldify(src, box, out, seed, warmth=0.35, wide=False):
    im = Image.open(src).convert("RGB").crop(box)
    w = 1920
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    a = np.asarray(im).astype(float) / 255
    # tone into the deck's palette: less saturation, warm sepia, softer contrast
    lum = a.mean(axis=2, keepdims=True)
    a = lerp(a, lum, 0.30)
    sepia = lum * c("D9B07A") * 1.25
    a = lerp(a, sepia, warmth)
    a = 0.06 + a * 0.88
    # brushwork: merge fine detail into strokes, then soften
    p = kuwahara(a, 2)
    p = kuwahara(p, 1)
    a = p * 0.8 + a * 0.2
    a = a * 0.85 + gaussian_filter(a, (0.8, 0.8, 0)) * 0.15
    if wide:  # full-slide background: crop to 16:9, keeping the waterline
        top = int((a.shape[0] - 1080) * 0.4)
        a = a[top:top + 1080]
    img = age(np.clip(a, 0, 1), 0.7, seed)   # varnish, craquelure, vignette, soft edges
    img.save(out, quality=95, subsampling=0)
    print("saved", out, img.size)


oldify(UP + "368b9b45-image.jpg", (24, 22, 998, 668), "img/sion.jpg", 21, 0.2)        # Sion, Valais: two castles on rocks
oldify(UP + "5acd8ab8-image.jpg", (0, 0, 960, 640), "img/oldtown.jpg", 22, 0.25, wide=True)  # old town on the water
