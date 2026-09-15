from pathlib import Path
from PIL import Image
import numpy as np
from rembg import remove, new_session

INPUT_DIR = Path(r"D:\Cut\frames")
PNG_DIR = Path(r"D:\Cut\rembg_png")
WEBP_DIR = Path(r"D:\Cut\rembg_webp")

PNG_DIR.mkdir(parents=True, exist_ok=True)
WEBP_DIR.mkdir(parents=True, exist_ok=True)

files = [
    f for f in INPUT_DIR.iterdir()
    if f.is_file() and f.suffix.lower() == ".png"
]

print(f"Found {len(files)} WebP frames")

if not files:
    print("ERROR: D:\\Cut\\frames mein koi WebP file nahi mili.")
    input("Press Enter to exit...")
    raise SystemExit

session = new_session("u2netp")

for i, src in enumerate(sorted(files), 1):
    print(f"[{i}/{len(files)}] {src.name}")

    try:
        original = Image.open(src).convert("RGBA")
        original_np = np.array(original)

        result = remove(original, session=session)
        result_np = np.array(result)

        alpha = result_np[:, :, 3].astype(np.uint16)

        rgb = original_np[:, :, :3].astype(np.uint16)

        brightness = (
            0.299 * rgb[:, :, 0]
            + 0.587 * rgb[:, :, 1]
            + 0.114 * rgb[:, :, 2]
        )

        # Bright labels and leader lines preserve
        text_mask = brightness > 70

        recovered_alpha = np.where(
            text_mask,
            255,
            alpha
        )

        result_np[:, :, 3] = np.clip(
            recovered_alpha, 0, 255
        ).astype(np.uint8)

        output = Image.fromarray(result_np, "RGBA")

        # PNG
        png_path = PNG_DIR / f"{src.stem}.png"
        output.save(
            png_path,
            "PNG",
            compress_level=0
        )

        # Lossless WebP
        webp_path = WEBP_DIR / f"{src.stem}.webp"
        output.save(
            webp_path,
            "WEBP",
            lossless=True,
            method=6
        )

    except Exception as e:
        print(f"ERROR in {src.name}: {e}")

print()
print("DONE!")
print(f"PNG files : {len(list(PNG_DIR.glob('*.png')))}")
print(f"WebP files: {len(list(WEBP_DIR.glob('*.webp')))}")