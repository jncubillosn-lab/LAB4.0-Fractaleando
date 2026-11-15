"""Package a generated 3 x 2 sprite sheet as a small GIF and reduced-motion PNG.

Maintenance only: requires Pillow; neither the site nor its build runs Python.
Usage: python scripts/encode-knitting-gif.py path/to/sheet.png
"""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('source', type=Path)
args = parser.parse_args()
sheet = Image.open(args.source).convert('RGBA')
if sheet.width % 3 or sheet.height % 2 or sheet.width // 3 != sheet.height // 2:
    raise ValueError('Expected six square cells in a 3 x 2 sheet')

cell = sheet.width // 3
tiles = [sheet.crop((col * cell, row * cell, (col + 1) * cell, (row + 1) * cell))
         for row in range(2) for col in range(3)]
# One crop for every frame preserves registration. Remove only the faint alpha
# fringe during palette conversion; no poses or character features are redrawn.
boxes = [tile.getchannel('A').point(lambda alpha: 255 if alpha >= 200 else 0).getbbox()
         for tile in tiles]
if any(box is None for box in boxes):
    raise ValueError('Every cell must contain an opaque sprite')
crop = (min(b[0] for b in boxes), min(b[1] for b in boxes),
        max(b[2] for b in boxes), max(b[3] for b in boxes))
palette = [0, 0, 0, 255, 255, 255, 0, 0, 0] + [0] * (768 - 9)
frames = []
for tile in tiles:
    sprite = tile.crop(crop)
    sprite.thumbnail((60, 76), Image.Resampling.LANCZOS)
    frame = Image.new('P', (64, 80), 2)
    frame.putpalette(palette)
    ox, oy = (64 - sprite.width) // 2, (80 - sprite.height) // 2
    for y in range(sprite.height):
        for x in range(sprite.width):
            red, green, blue, alpha = sprite.getpixel((x, y))
            if alpha >= 200:
                frame.putpixel((ox + x, oy + y), 1 if red + green + blue >= 384 else 0)
    frame.info['transparency'] = 2
    frames.append(frame)
if len({frame.tobytes() for frame in frames}) != 6:
    raise ValueError('Expected six distinct poses')

out = Path(__file__).resolve().parents[1] / 'css' / 'images'
out.mkdir(parents=True, exist_ok=True)
sequence = [frames[i] for i in [0, 1, 2, 3, 4, 5, 4, 3, 2, 1]]
gif = out / 'knitting.gif'
sequence[0].save(gif, save_all=True, append_images=sequence[1:], duration=120,
                 loop=0, transparency=2, disposal=2, optimize=True)
frames[0].save(out / 'knitting-still.png', transparency=2, optimize=True)
with Image.open(gif) as encoded:
    if encoded.n_frames != 10 or gif.stat().st_size > 16000:
        raise ValueError('Expected ten frames and at most 16 KB')
print(json.dumps({'sourceSHA256': hashlib.sha256(args.source.read_bytes()).hexdigest(),
                  'width': 64, 'height': 80, 'frames': 10, 'frameMs': 120,
                  'loop': 'infinite', 'gifBytes': gif.stat().st_size,
                  'stillBytes': (out / 'knitting-still.png').stat().st_size}))
