#!/usr/bin/env python3
"""Рендер материалов AROMIO для TikTok.

  python3 render.py preview 0.4 3 8 13 17      кадры-превью в out/preview/
  python3 render.py video                      out/aromio-tiktok.mp4 (1080x1920, 30 fps)
  python3 render.py encode out/frames          пересобрать из готовых кадров
  python3 render.py cover                      out/aromio-cover-1500.jpg + 640

Сцена детерминированная: renderFrame(t) рисует один и тот же кадр для одного t,
поэтому кадры снимаются пошагово, без записи реального времени.
"""
import os, re, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "out"
FPS = 30

def ffmpeg():
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()

CHROME = os.environ.get("CHROME_PATH") or next(
    (p for p in Path("/opt/pw-browsers").glob("chromium-*/chrome-linux/chrome")), None)

def page(pw, url, w, h):
    opts = dict(args=["--force-color-profile=srgb", "--disable-lcd-text",
                      "--hide-scrollbars", "--force-device-scale-factor=1",
                      "--no-sandbox"])
    if CHROME:                     # готовый chromium окружения, без playwright install
        opts["executable_path"] = str(CHROME)
    br = pw.chromium.launch(**opts)
    pg = br.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
    pg.goto(url)
    pg.wait_for_function("window.__ready === true", timeout=60000)
    return br, pg

def shoot_frames(times, outdir, quiet=False):
    from playwright.sync_api import sync_playwright
    outdir.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        br, pg = page(pw, (ROOT / "scene.html").as_uri(), 1080, 1920)
        for i, t in enumerate(times):
            pg.evaluate("t => window.renderFrame(t)", t)
            pg.screenshot(path=str(outdir / f"f{i:05d}.png"), type="png")
            if not quiet and i % 30 == 0:
                print(f"  кадр {i}/{len(times)}  t={t:.2f}s", flush=True)
        br.close()

def cmd_preview(args):
    times = [float(a) for a in args] or [0.4, 3.0, 8.0, 13.0, 17.0]
    d = OUT / "preview"
    shoot_frames(times, d)
    for i, t in enumerate(times):
        (d / f"f{i:05d}.png").rename(d / f"t{t:g}s.png")
    print("превью:", d)

def encode(frames, mp4, fps=FPS):
    """PNG-кадры -> H.264. Матрица bt709 задаётся явно и прописывается в файл:
    без этого swscale считает по bt601, плеер декодирует по bt709 и картинка
    уезжает в пурпур (проверено: +18R/-11G/+21B)."""
    vf = ("split[a][b];[b]gblur=sigma=16[bl];"                  # мягкое свечение
          "[a][bl]blend=all_mode=screen:all_opacity=0.17,"
          # RGB -> YUV строго здесь: noise/unsharp живут в YUV, и если не
          # перевести явно, ffmpeg вставит свою конвертацию по bt601
          "scale=in_range=full:out_range=tv"
          ":in_color_matrix=bt709:out_color_matrix=bt709,"
          "format=yuv420p,"
          "noise=c0s=4:c0f=t+u,"                                # зерно только по яркости
          # сила зерна прямо бьёт по битрейту: c0s=8 давало 33 Мбит/с, c0s=4 — 2.5
          "unsharp=3:3:0.30:3:3:0.0")
    subprocess.run([ffmpeg(), "-hide_banner", "-loglevel", "error", "-y",
                    "-framerate", str(fps), "-i", str(frames / "f%05d.png"),
                    "-vf", vf, "-c:v", "libx264", "-profile:v", "high", "-level", "4.1",
                    "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p",
                    "-colorspace", "bt709", "-color_primaries", "bt709",
                    "-color_trc", "bt709", "-color_range", "tv",
                    "-movflags", "+faststart", "-r", str(fps), str(mp4)], check=True)
    print("готово:", mp4, f"{mp4.stat().st_size/1e6:.1f} МБ")

def cmd_video(args):
    dur = float(re.search(r"const DURATION=([\d.]+)", (ROOT / "scene.js").read_text()).group(1))
    frames = OUT / "frames"
    if frames.exists():
        shutil.rmtree(frames)
    times = [i / FPS for i in range(int(dur * FPS))]
    print(f"снимаю {len(times)} кадров 1080x1920…")
    shoot_frames(times, frames)
    OUT.mkdir(exist_ok=True)
    encode(frames, OUT / "aromio-tiktok.mp4")
    if "--keep" not in args:
        shutil.rmtree(frames)

def cmd_encode(args):
    """Пересобрать ролик из уже снятых кадров: render.py encode [каталог]."""
    frames = Path(args[0]) if args else OUT / "frames"
    encode(frames, OUT / "aromio-tiktok.mp4")

def cmd_cover(args):
    from playwright.sync_api import sync_playwright
    OUT.mkdir(exist_ok=True)
    png = OUT / "aromio-cover-1500.png"
    with sync_playwright() as pw:
        br, pg = page(pw, (ROOT / "cover.html").as_uri(), 1500, 1500)
        pg.screenshot(path=str(png), type="png")
        br.close()
    for size, name in ((1500, "aromio-cover-1500.jpg"), (640, "aromio-cover-640.jpg")):
        subprocess.run([ffmpeg(), "-hide_banner", "-loglevel", "error", "-y", "-i", str(png),
                        "-vf", f"scale={size}:{size}:flags=lanczos", "-q:v", "2",
                        str(OUT / name)], check=True)
        print("готово:", OUT / name)

if __name__ == "__main__":
    cmds = {"preview": cmd_preview, "video": cmd_video, "encode": cmd_encode, "cover": cmd_cover}
    if len(sys.argv) < 2 or sys.argv[1] not in cmds:
        print(__doc__)
        sys.exit(1)
    cmds[sys.argv[1]](sys.argv[2:])
