#!/usr/bin/env python3
"""Make the website images.

Run from the "3 · Website" folder.

Images for one episode, from its picture-book PDF:
  python3 tools/make_images.py "<path to the book.pdf>" ep3 --pages 3,13,26,31

The big picture behind the title (the "hero"), from an original artwork file:
  python3 tools/make_images.py --hero-image "<path to the art.png>" \
      --hero-crop 40,6,1336,726 --hero-out hero-bitterroot.jpg

Writes into assets/img/:
  ep3-cover.jpg                        page 1 (the cover) at 1400 px wide
  ep3-pNN.jpg and ep3-pNN-thumb.jpg    each chosen page at 1600 px and 720 px wide
  hero image          (--hero-image)   the artwork, trimmed, enlarged to 2592 px wide and
                                       lightly sharpened so it holds up on large screens
                      (--hero PAGE)    or the illustration on that page of the PDF
  og.jpg, favicon.png, apple-touch-icon.png (--og)   made from the PDF's cover illustration

Needs python3 with PyMuPDF and Pillow:  pip3 install pymupdf pillow
"""
import argparse
import os
import sys

try:
    import fitz  # PyMuPDF
    from PIL import Image, ImageFilter
except ImportError:
    sys.exit("Install the two image libraries first:  pip3 install pymupdf pillow")

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "assets", "img")
HERO_WIDTH = 2592


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


def hero_from_art(path, crop, name):
    """Trim the paper margins, enlarge for big and high-density screens, sharpen lightly."""
    img = Image.open(path).convert("RGB")
    if crop:
        img = img.crop(tuple(int(v) for v in crop.split(",")))
    if img.width < HERO_WIDTH:
        img = img.resize((HERO_WIDTH, round(img.height * HERO_WIDTH / img.width)), Image.LANCZOS)
        img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
    save(img, name, 76)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pdf", nargs="?", help="the picture-book PDF")
    ap.add_argument("key", nargs="?", help="short name used in the file names, e.g. ep3")
    ap.add_argument("--pages", default="", help="comma-separated PDF page numbers for the gallery, e.g. 3,13,26,31")
    ap.add_argument("--hero", type=int, default=0, help="PDF page whose illustration becomes the hero image")
    ap.add_argument("--hero-image", default="", help="an original artwork file to use for the hero instead")
    ap.add_argument("--hero-crop", default="", help="left,top,right,bottom in the artwork's own pixels, to trim paper margins")
    ap.add_argument("--hero-out", default="hero.jpg", help="file name for the hero image (referenced in assets/styles.css)")
    ap.add_argument("--og", action="store_true", help="also make og.jpg and the icons from the PDF's cover")
    args = ap.parse_args()

    os.makedirs(OUT, exist_ok=True)

    if args.hero_image:
        print(f"{os.path.basename(args.hero_image)} → {OUT}")
        hero_from_art(args.hero_image, args.hero_crop, args.hero_out)

    if not args.pdf:
        if not args.hero_image:
            ap.error("give a PDF and a key, or --hero-image")
        return
    if not args.key:
        ap.error("give a short key after the PDF, e.g. ep3")

    doc = fitz.open(args.pdf)
    print(f"{os.path.basename(args.pdf)}: {len(doc)} pages → {OUT}")

    save(render(doc, 1, 1400), f"{args.key}-cover.jpg")
    for p in [int(x) for x in args.pages.split(",") if x.strip()]:
        save(render(doc, p, 1600), f"{args.key}-p{p:02d}.jpg", 80)
        save(render(doc, p, 720), f"{args.key}-p{p:02d}-thumb.jpg", 78)

    if args.hero and not args.hero_image:
        page = doc[args.hero - 1]
        save(render(doc, args.hero, HERO_WIDTH, clip=largest_image_rect(page)), args.hero_out, 76)

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
