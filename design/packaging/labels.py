# -*- coding: utf-8 -*-
"""Наклейки на флаконы декантов. Ширина = длина окружности + нахлёст."""
import math, os
from dieline import wordmark, txt, shrink, esc, BLEED, mesh

# (ключ, подпись, Ø флакона мм, высота наклейки мм)
VIALS = [("01", "1 мл", 7.0, 13.0), ("05", "5 мл", 16.0, 26.0), ("10", "10 мл", 19.0, 32.0)]
OVERLAP = 4.0

def build(key, label, dia, h):
    w = math.pi * dia + OVERLAP
    pw, ph = w + BLEED * 2, h + BLEED * 2 + 3.0
    ox, oy = BLEED, BLEED
    ink, paper = "#ffffff", "#0b0b0c"
    base = max(1.1, h * 0.115)

    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{pw:.2f}mm" height="{ph:.2f}mm" viewBox="0 0 {pw:.2f} {ph:.2f}">',
         f'<rect width="{pw:.2f}" height="{ph:.2f}" fill="#ffffff"/>',
         f'<rect x="{ox:.2f}" y="{oy:.2f}" width="{w:.2f}" height="{h:.2f}" rx="{min(2.0, h*0.12):.2f}" fill="{paper}"/>',
         f'<clipPath id="lab"><rect x="{ox:.2f}" y="{oy:.2f}" width="{w:.2f}" height="{h:.2f}" rx="{min(2.0, h*0.12):.2f}"/></clipPath>',
         f'<g clip-path="url(#lab)">',
         mesh(ox, oy, w, h, cols=max(12, int(w / 3)), rows=max(10, int(h / 2)), op=0.16, sw=0.07),
         f'</g>']

    mw = min(w * 0.34, h * 1.9)
    o.append(wordmark(ox + w * 0.055, oy + h * 0.20, mw, ink))

    # поле под название — пишется от руки или допечатывается
    fx = ox + w * 0.055 + mw + w * 0.06
    o.append(txt(fx, oy + h * 0.40, "АРОМАТ", shrink("АРОМАТ", w * 0.34, base * 0.7, .4), 800, ink, "start", .4, .55))
    o.append(f'<line x1="{fx:.2f}" y1="{oy + h*0.52:.2f}" x2="{ox + w - OVERLAP - w*0.04:.2f}" y2="{oy + h*0.52:.2f}" '
             f'stroke="{ink}" stroke-width="0.18" opacity=".4"/>')
    o.append(txt(fx, oy + h * 0.74, "ДОМ", shrink("ДОМ", w * 0.34, base * 0.7, .4), 800, ink, "start", .4, .55))
    o.append(f'<line x1="{fx:.2f}" y1="{oy + h*0.86:.2f}" x2="{ox + w - OVERLAP - w*0.04:.2f}" y2="{oy + h*0.86:.2f}" '
             f'stroke="{ink}" stroke-width="0.18" opacity=".4"/>')

    # объём в пилюле — как на коробке
    pw2, ph2 = max(9.0, w * 0.15), max(4.2, h * 0.22)
    px = ox + w * 0.055
    py = oy + h * 0.60
    o.append(f'<rect x="{px:.2f}" y="{py:.2f}" width="{pw2:.2f}" height="{ph2:.2f}" rx="{ph2/2:.2f}" fill="{ink}"/>')
    o.append(txt(px + pw2 / 2, py + ph2 * 0.72, label, shrink(label, pw2 - 1.4, base * 1.05), 900, paper, "middle"))

    o.append(f'<rect x="{ox:.2f}" y="{oy:.2f}" width="{w:.2f}" height="{h:.2f}" rx="{min(2.0, h*0.12):.2f}" '
             f'fill="none" stroke="#111318" stroke-width="0.25"/>')
    o.append(f'<line x1="{ox + w - OVERLAP:.2f}" y1="{oy:.2f}" x2="{ox + w - OVERLAP:.2f}" y2="{oy + h:.2f}" '
             f'stroke="#111318" stroke-width="0.18" stroke-dasharray="1.2 1"/>')

    cap = f"AROMIO · наклейка {label} · Ø{dia:.0f} мм · {w:.1f}×{h:.0f} мм · нахлёст {OVERLAP:.0f} мм · 1:1"
    cs = 1.6
    while cs > 0.8 and len(cap) * cs * 0.62 > pw - BLEED * 2:
        cs -= 0.05
    o.append(f'<text x="{ox:.2f}" y="{ph - 1.2:.2f}" font-family="monospace" font-size="{cs:.2f}" fill="#111318">{esc(cap)}</text>')
    o.append('</svg>')
    return "\n".join(o)

out = os.path.dirname(os.path.abspath(__file__))
os.makedirs(out, exist_ok=True)
for key, label, dia, h in VIALS:
    open(f"{out}/label-{key}ml.svg", "w").write(build(key, label, dia, h))
    print("наклейка", label, f"{math.pi*dia+OVERLAP:.1f}×{h:.0f} мм")
