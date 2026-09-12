# -*- coding: utf-8 -*-
"""
Развёртки коробочек для декантов AROMIO — straight tuck end, 1:1 в миллиметрах.
Вся типографика считается от ширины панели: на 14-миллиметровой коробке
текста физически меньше, чем на 24-миллиметровой, и вёрстка это учитывает.
"""
import os, textwrap
import math

# ---- та же сетка, что рисует фон сайта (src/components/Backdrop.tsx) ----
def _height(u, v):
    return (math.sin(v * 7.8 + u * 4.4) * 0.098
            + math.sin(v * 5.0 - u * 3.4) * 0.058
            + math.sin(v * 12.6 + u * 1.9) * 0.018)

def _drift(u, v):
    return (math.sin(u * 6.2 + v * 2.1) * 0.072
            + math.sin(u * 3.0 - v * 2.7) * 0.030
            + math.sin(v * 2.6) * 0.018)

def mesh(x, y, w, h, cols=22, rows=30, colour="#ffffff", op=0.20, sw=0.09):
    """Поле высот в миллиметрах, обрезанное по панели."""
    bleed = 0.16
    sx, ox = (1 + bleed * 2) * w, -bleed * w
    sy, oy = (1 + bleed * 2) * h, -bleed * h
    pts = []
    for r in range(rows + 1):
        v0 = (r / rows) ** 1.12
        row = []
        for c in range(cols + 1):
            u = c / cols
            px = (u + _drift(u, v0)) * sx + ox
            py = (v0 + _height(u, v0)) * sy + oy
            row.append((x + px, y + py))
        pts.append(row)

    d = []
    for row in pts:
        d.append("M" + " L".join(f"{px:.2f},{py:.2f}" for px, py in row))
    for c in range(cols + 1):
        d.append("M" + " L".join(f"{pts[r][c][0]:.2f},{pts[r][c][1]:.2f}" for r in range(rows + 1)))
    return (f'<path d="{" ".join(d)}" fill="none" stroke="{colour}" stroke-width="{sw}" '
            f'stroke-linejoin="round" opacity="{op}"/>')


BLEED, GLUE = 3.0, 8.0
CHAR_W = 0.55        # средняя ширина знака Nunito Bold в долях кегля

# Зазор 3 мм на сторону: флакон входит без усилия и не болтается.
# Размеры флаконов — по каталогам поставщиков, а не на глаз.
BOXES = [
    # ключ,        подпись,  W,    D,     H,     флакон,                                вес текста
    ("01",         "1 мл",  11.0, 11.0,  48.0, "фиола Ø8 × 45 мм",                       "S"),
    ("05-plastic", "5 мл",  17.0, 17.0,  78.0, "атомайзер Ø14 × 75, пластик. колпачок",  "M"),
    ("05-metal",   "5 мл",  22.0, 22.0,  88.0, "атомайзер Ø19 × 85, металл. кофр",       "M"),
    ("10-plastic", "10 мл", 17.0, 17.0, 118.0, "атомайзер Ø14 × 115, пластик. колпачок", "L"),
    ("10-metal",   "10 мл", 20.0, 20.0,  93.0, "атомайзер Ø17 × 90, металл. цилиндр",    "L"),
]

WORDMARK = '''<g transform="translate({x},{y}) scale({s})">
 <g fill="none" stroke="{c}" stroke-width="34" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="52" cy="103" r="35"/><path d="M87 68 V138"/>
  <path d="M140 138 V68"/><path d="M140 92 a35 35 0 0 1 35 -24"/>
  <circle cx="235" cy="103" r="35"/>
  <path d="M300 138 V68"/><path d="M300 92 a30 30 0 0 1 60 0 V138"/>
  <path d="M360 92 a30 30 0 0 1 60 0 V138"/>
  <path d="M455 138 V68"/><circle cx="455" cy="26" r="9" fill="{c}" stroke="none" stroke-width="0"/>
  <circle cx="530" cy="103" r="35"/>
 </g></g>'''

def wordmark(x, y, w, c="#fff"):
    return WORDMARK.format(x=round(x, 3), y=round(y, 3), s=round(w / 600.0, 5), c=c)

def esc(t): return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def txt(x, y, s, size, weight=700, c="#fff", anchor="start", sp=0, op=1):
    return (f'<text x="{x:.2f}" y="{y:.2f}" font-family="Nunito, \'Trebuchet MS\', sans-serif" '
            f'font-size="{size:.2f}" font-weight="{weight}" fill="{c}" text-anchor="{anchor}" '
            f'letter-spacing="{sp:.2f}" opacity="{op}">{esc(s)}</text>')

def fits(s, size, sp=0):
    """ширина строки в мм"""
    return len(s) * (size * CHAR_W + sp)

def wrap(s, max_w, size, sp=0):
    per = max(8, int(max_w / (size * CHAR_W + sp)))
    return textwrap.wrap(s, per)

def shrink(s, max_w, size, sp=0, floor=0.9):
    """уменьшает кегль, пока строка не влезет — вместо того чтобы вылезти за панель"""
    while size > floor and fits(s, size, sp) > max_w:
        size -= 0.05
    return size

def build(key, label, W, D, H, vial, weight):
    tuck = D * 0.82
    flat_w = GLUE + W + D + W + D
    flat_h = tuck + H + tuck
    pw, ph = flat_w + BLEED * 2, flat_h + BLEED * 2 + 4.0
    ox, oy = BLEED, BLEED
    top = oy + tuck
    x_glue = ox; x_back = x_glue + GLUE; x_sA = x_back + W; x_front = x_sA + D; x_sB = x_front + W

    ink, paper, cut = "#ffffff", "#0b0b0c", "#111318"
    pad = max(1.6, W * 0.13)
    inner = W - pad * 2
    base = min(2.1, max(1.15, W * 0.092))     # кегль основного текста

    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{pw:.2f}mm" height="{ph:.2f}mm" '
         f'viewBox="0 0 {pw:.2f} {ph:.2f}">',
         f'<rect width="{pw:.2f}" height="{ph:.2f}" fill="#ffffff"/>',
         f'<rect x="{x_back:.2f}" y="{top:.2f}" width="{W*2+D*2:.2f}" height="{H:.2f}" fill="{paper}"/>',
         f'<clipPath id="body"><rect x="{x_back:.2f}" y="{top:.2f}" width="{W*2+D*2:.2f}" height="{H:.2f}"/></clipPath>',
         f'<g clip-path="url(#body)">',
         mesh(x_back, top, W * 2 + D * 2, H, cols=max(14, int(W)), rows=max(20, int(H / 2.4))),
         # свечение сверху — то же, что в плашке карточки на сайте
         f'<defs><radialGradient id="glow" cx="50%" cy="0%" r="86%">'
         f'<stop offset="0%" stop-color="#ffffff" stop-opacity="0.16"/>'
         f'<stop offset="68%" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>',
         f'<rect x="{x_front:.2f}" y="{top:.2f}" width="{W:.2f}" height="{H:.2f}" fill="url(#glow)"/>',
         f'</g>',
         f'<rect x="{x_glue:.2f}" y="{top:.2f}" width="{GLUE:.2f}" height="{H:.2f}" fill="#f2f0ec"/>']

    # ---------- ЛИЦО ----------
    cx = x_front + W / 2
    mark_w = W * 0.66
    o.append(wordmark(cx - mark_w / 2, top + H * 0.13, mark_w, ink))
    sub = shrink("PARFUM'S", inner, base * 0.62, 0.8)
    o.append(txt(cx, top + H * 0.13 + mark_w * (170 / 600) + base * 1.5, "PARFUM'S", sub, 700, ink, "middle", 0.8, .7))

    # на высокой узкой коробке пилюля не должна превращаться в круг
    pill_w = W * 0.62
    pill_h = min(pill_w * 0.62, max(5.2, H * 0.095))
    o.append(f'<rect x="{cx - pill_w/2:.2f}" y="{top + H*0.54:.2f}" width="{pill_w:.2f}" '
             f'height="{pill_h:.2f}" rx="{pill_h/2:.2f}" fill="{ink}"/>')
    vs = shrink(label, pill_w - 2.2, base * 1.5)
    o.append(txt(cx, top + H * 0.54 + pill_h * 0.70, label, vs, 900, paper, "middle"))

    ds = shrink("ДЕКАНТ", inner, base * 0.95, 0.9)
    o.append(txt(cx, top + H * 0.80, "ДЕКАНТ", ds, 800, ink, "middle", 0.9))
    for i, line in enumerate(wrap("розлив из оригинального флакона", inner, base * 0.62)):
        o.append(txt(cx, top + H * 0.845 + i * base * 0.9, line, base * 0.62, 600, ink, "middle", 0, .62))

    # ---------- СПИНКА ----------
    bx, bw = x_back + pad, inner
    y = top + H * 0.11
    fields = [("АРОМАТ", 1), ("ДОМ", 1)]
    if weight in ("M", "L"): fields.append(("ПШИКОВ НА РАЗ", 1))
    if weight == "L": fields.append(("РОЗЛИВ", 1))

    fs = shrink("ПШИКОВ НА РАЗ", bw, base * 0.72, 0.5)
    for name, _ in fields:
        o.append(txt(bx, y, name, fs, 800, ink, "start", 0.5, .6))
        o.append(f'<line x1="{bx:.2f}" y1="{y + base*1.5:.2f}" x2="{bx + bw:.2f}" y2="{y + base*1.5:.2f}" '
                 f'stroke="{ink}" stroke-width="0.2" opacity=".35"/>')
        y += base * 3.4

    warn = ("Спиртосодержащая жидкость. Беречь от огня, солнца и детей. "
            "Хранить при 5–25 °C. Не для приёма внутрь.")
    origin = "Аромат разлит из оригинального флакона. Упаковка и розлив — AROMIO."
    if weight == "S":
        warn = "Спирт. Беречь от огня и детей."
        origin = "Розлив AROMIO из оригинала."

    ws = base * 0.66
    y += base * 0.6
    for line in wrap(warn, bw, ws):
        o.append(txt(bx, y, line, ws, 600, ink, "start", 0, .8)); y += ws * 1.5
    y += ws * 0.9
    for line in wrap(origin, bw, ws):
        o.append(txt(bx, y, line, ws, 600, ink, "start", 0, .8)); y += ws * 1.5

    # поле под штрихкод — только там, где оно физически помещается
    if weight in ("M", "L"):
        bh = min(11.0, H * 0.12)
        by2 = top + H - bh - pad
        if by2 > y + 1.0:
            o.append(f'<rect x="{bx:.2f}" y="{by2:.2f}" width="{bw:.2f}" height="{bh:.2f}" fill="none" '
                     f'stroke="{ink}" stroke-width="0.2" stroke-dasharray="0.8 0.8" opacity=".5"/>')
            o.append(txt(bx + bw / 2, by2 + bh / 2 + 0.4, "штрихкод", base * 0.6, 600, ink, "middle", 0, .55))

    # ---------- БОКА ----------
    side = f"AROMIO · {label} · ДЕКАНТ"
    ss = shrink(side, H - pad * 2, base * 0.78, 0.3)
    for x_side in (x_sA, x_sB):
        scx, scy = x_side + D / 2, top + H / 2
        o.append(f'<g transform="rotate(90 {scx:.2f} {scy:.2f})">')
        o.append(txt(scx - (H / 2 - pad), scy + ss * 0.35, side, ss, 800, ink, "start", 0.3))
        o.append('</g>')

    # ---------- РЕЗ И ФАЛЬЦЫ ----------
    r = min(1.6, W * 0.11)
    def tuck_path(x0, y0, sign):
        ty = y0 + sign * tuck
        return (f"M{x0:.2f},{y0:.2f} L{x0:.2f},{ty - sign*r:.2f} Q{x0:.2f},{ty:.2f} {x0 + r:.2f},{ty:.2f} "
                f"L{x0 + W - r:.2f},{ty:.2f} Q{x0 + W:.2f},{ty:.2f} {x0 + W:.2f},{ty - sign*r:.2f} "
                f"L{x0 + W:.2f},{y0:.2f}")

    body = (f"M{x_back:.2f},{top:.2f} {tuck_path(x_back, top, -1)[1:]} "
            f"L{x_front:.2f},{top:.2f} {tuck_path(x_front, top, -1)[1:]} "
            f"L{x_sB + D:.2f},{top:.2f} L{x_sB + D:.2f},{top + H:.2f} "
            f"L{x_front + W:.2f},{top + H:.2f} {tuck_path(x_front, top + H, 1)[1:][::-1] if False else ''}")
    # нижние клапаны рисуем отдельными путями — так контур читается и не путается
    o.append(f'<path d="M{x_back:.2f},{top:.2f} L{x_sB + D:.2f},{top:.2f} L{x_sB + D:.2f},{top + H:.2f} '
             f'L{x_back:.2f},{top + H:.2f} L{x_glue:.2f},{top + H - 1.6:.2f} L{x_glue:.2f},{top + 1.6:.2f} Z" '
             f'fill="none" stroke="{cut}" stroke-width="0.25"/>')
    for x0 in (x_back, x_front):
        o.append(f'<path d="{tuck_path(x0, top, -1)}" fill="none" stroke="{cut}" stroke-width="0.25"/>')
        o.append(f'<path d="{tuck_path(x0, top + H, 1)}" fill="none" stroke="{cut}" stroke-width="0.25"/>')

    dust = tuck * 0.6
    for x_side in (x_sA, x_sB):
        for sign, edge in ((-1, top), (1, top + H)):
            y1 = edge + sign * dust
            o.append(f'<path d="M{x_side + 0.2:.2f},{edge:.2f} L{x_side + 0.9:.2f},{y1:.2f} '
                     f'L{x_side + D - 0.9:.2f},{y1:.2f} L{x_side + D - 0.2:.2f},{edge:.2f}" '
                     f'fill="none" stroke="{cut}" stroke-width="0.25"/>')

    folds = [(x_back, top, x_sB + D, top), (x_back, top + H, x_sB + D, top + H)]
    for fx in (x_back, x_sA, x_front, x_sB):
        folds.append((fx, top, fx, top + H))
    for x1, y1, x2, y2 in folds:
        o.append(f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" '
                 f'stroke="{cut}" stroke-width="0.18" stroke-dasharray="1.4 1.1"/>')

    cap = f"AROMIO · декант {label} · {W:.0f}×{D:.0f}×{H:.0f} мм · {vial} · вылет {BLEED:.0f} мм · 1:1"
    # моноширинный знак шире пропорционального — иначе подпись вылезает за лист
    cs = 1.7
    while cs > 0.9 and len(cap) * cs * 0.62 > pw - BLEED * 2:
        cs -= 0.05
    o.append(f'<text x="{ox:.2f}" y="{ph - 1.4:.2f}" font-family="monospace" font-size="{cs:.2f}" fill="#111318">{esc(cap)}</text>')
    o.append('</svg>')
    return "\n".join(o)

out = os.path.dirname(os.path.abspath(__file__))
os.makedirs(out, exist_ok=True)
for key, label, W, D, H, vial, weight in BOXES:
    open(f"{out}/dieline-{key}ml.svg", "w").write(build(key, label, W, D, H, vial, weight))
    print("готово:", key, f"{W:.0f}×{D:.0f}×{H:.0f} мм")
