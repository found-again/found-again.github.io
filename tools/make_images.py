#!/usr/bin/env python3
"""Make the website images for one episode from its picture-book PDF.

Usage (run from the "3 · Website" folder):
  python3 tools/make_images.py "<path to the book.pdf>" ep3 --pages 3,13,26,31
  python3 tools/make_images.py "<path to the book.pdf>" ep1 --pages 3,13,26,31 --hero 6 --og

Writes into assets/img/:
  ep3-cover.jpg                        page 1 (the cover) at 1400 px wide
  ep3-pNN.jpg and ep3-pNN-thumb.jpg    each chosen page at 1600 px and 720 px wide
  hero.jpg            (--hero PAGE)    the illustration on that page, used behind the title
  og.jpg, favicon.png, apple-touch-icon.png (--og)   made from the cover illustration

Needs python3 with PyMuPDF and Pillow:  pip3 install pymupdf pillow
"""
import argparse
import os
import sys

try:
    import fitz  # PyMuPDF
    from PIL import Image
except ImportError:
    sys.exit("Install the two image libraries first:  pip3 install pymupdf pillow")

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "assets", "img")


def render(doc, page_number, width, clip=None):
    page = doc[page_number - 1]
    rect = clip or page.rect
    zoom = width / rect.width
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), clip=rect, alpha=False)
    return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)


def largest_image_rect(page):
    best = None
    for info in page.get_image_info():
        r = fitz.Rect(info["bbox"])
        if best is None or r.get_area() > best.get_area():
            best = r
    return best or page.rect


def save(img, name, quality=82):
    path = os.path.join(OUT, name)
    img.save(path, "JPEG", quality=quality, optimize=True, progressive=True)
    print(f"  {name:28s} {img.width:5d} x {img.height:<5d} {os.path.getsize(path) // 1024:5d} KB")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pdf", help="the picture-book PDF")
    ap.add_argument("key", help="short name used in the file names, e.g. ep3")
    ap.add_argument("--pages", default="", help="comma-separated page numbers to show in the gallery, e.g. 3,13,26,31")
    ap.add_argument("--hero", type=int, default=0, help="page whose illustration becomes hero.jpg")
    ap.add_argument("--og", action="store_true", help="also make og.jpg and the icons from the cover")
    args = ap.parse_args()

    os.makedirs(OUT, exist_ok=True)
    doc = fitz.open(args.pdf)
    print(f"{os.path.basename(args.pdf)}: {len(doc)} pages → {OUT}")

    save(render(doc, 1, 1400), f"{args.key}-cover.jpg")
    for p in [int(x) for x in args.pages.split(",") if x.strip()]:
        save(render(doc, p, 1600), f"{args.key}-p{p:02d}.jpg", 80)
        save(render(doc, p, 720), f"{args.key}-p{p:02d}-thumb.jpg", 78)

    if args.hero:
        page = doc[args.hero - 1]
        save(render(doc, args.hero, 2000, clip=largest_image_rect(page)), "hero.jpg", 78)

    if args.og:
        cover = render(doc, 1, 1600, clip=largest_image_rect(doc[0]))
        w, h = cover.size
        target = 1200 / 630
        if w / h > target:
            nw = int(h * target)
            box = ((w - nw) // 2, 0, (w - nw) // 2 + nw, h)
        else:
            nh = int(w / target)
            box = (0, (h - nh) // 2, w, (h - nh) // 2 + nh)
        save(cover.crop(box).resize((1200, 630), Image.LANCZOS), "og.jpg", 82)
        s = min(w, h)
        square = cover.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s))
        square.resize((180, 180), Image.LANCZOS).save(os.path.join(OUT, "apple-touch-icon.png"))
        square.resize((64, 64), Image.LANCZOS).save(os.path.join(OUT, "favicon.png"))
        print("  og.jpg, apple-touch-icon.png, favicon.png")


if __name__ == "__main__":
    main()
