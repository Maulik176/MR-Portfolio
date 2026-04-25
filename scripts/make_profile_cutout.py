#!/usr/bin/env python3
"""
Create a transparent cutout PNG from a portrait that has a checkerboard/solid background.

Input:
  src/assets/profile.jpg  (or any image path passed as arg)
Output:
  public/profile-cutout.png (default) or any output path passed as arg

This script requires Pillow:
  python3 -m pip install pillow

Why we need this:
  The current photo includes the checkerboard pixels baked into the JPG (not real transparency).
  This script flood-fills the background from the corners and makes it transparent.
"""

from __future__ import annotations

import sys
from collections import deque

try:
  from PIL import Image, ImageFilter
except Exception:
  print("Missing dependency: Pillow\nRun: python3 -m pip install pillow", file=sys.stderr)
  raise


def _dist2(c1, c2) -> int:
  dr = c1[0] - c2[0]
  dg = c1[1] - c2[1]
  db = c1[2] - c2[2]
  return dr * dr + dg * dg + db * db


def _pick_bg_colors(rgb_img: Image.Image) -> tuple[tuple[int, int, int], tuple[int, int, int]]:
  """
  Estimate the two most common background colors from the border (checkerboard usually has 2 tones).
  Uses quantization to 4-bit per channel to reduce JPEG noise.
  """
  w, h = rgb_img.size
  px = rgb_img.load()
  hist = {}

  def add(x, y):
    r, g, b = px[x, y]
    # 4-bit quantization per channel
    q = ((r >> 4) << 4, (g >> 4) << 4, (b >> 4) << 4)
    hist[q] = hist.get(q, 0) + 1

  # Sample border pixels (step to keep it fast)
  step = max(1, min(w, h) // 128)
  for x in range(0, w, step):
    add(x, 0)
    add(x, h - 1)
  for y in range(0, h, step):
    add(0, y)
    add(w - 1, y)

  top = sorted(hist.items(), key=lambda kv: kv[1], reverse=True)
  if not top:
    return (255, 255, 255), (200, 200, 200)

  c1 = top[0][0]
  c2 = None
  for c, _n in top[1:]:
    if _dist2(c, c1) > 18 * 18:
      c2 = c
      break
  if c2 is None:
    c2 = c1
  return c1, c2


def make_cutout(
  in_path: str,
  out_path: str,
  *,
  tolerance: int = 48,
  feather: int = 1,
) -> None:
  img = Image.open(in_path).convert("RGBA")
  rgb = img.convert("RGB")
  w, h = img.size

  bg1, bg2 = _pick_bg_colors(rgb)
  tol2 = tolerance * tolerance

  rgb_px = rgb.load()
  alpha = bytearray([255]) * (w * h)
  visited = bytearray([0]) * (w * h)

  def is_bg(x, y) -> bool:
    r, g, b = rgb_px[x, y]
    return _dist2((r, g, b), bg1) <= tol2 or _dist2((r, g, b), bg2) <= tol2

  def idx(x, y) -> int:
    return y * w + x

  q = deque()
  # Seed with corners and edges that match background
  seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
  for x in range(0, w, max(1, w // 256)):
    seeds.append((x, 0))
    seeds.append((x, h - 1))
  for y in range(0, h, max(1, h // 256)):
    seeds.append((0, y))
    seeds.append((w - 1, y))

  for x, y in seeds:
    if is_bg(x, y):
      i = idx(x, y)
      if not visited[i]:
        visited[i] = 1
        q.append((x, y))

  while q:
    x, y = q.popleft()
    alpha[idx(x, y)] = 0
    if x > 0:
      nx, ny = x - 1, y
      i = idx(nx, ny)
      if not visited[i] and is_bg(nx, ny):
        visited[i] = 1
        q.append((nx, ny))
    if x + 1 < w:
      nx, ny = x + 1, y
      i = idx(nx, ny)
      if not visited[i] and is_bg(nx, ny):
        visited[i] = 1
        q.append((nx, ny))
    if y > 0:
      nx, ny = x, y - 1
      i = idx(nx, ny)
      if not visited[i] and is_bg(nx, ny):
        visited[i] = 1
        q.append((nx, ny))
    if y + 1 < h:
      nx, ny = x, y + 1
      i = idx(nx, ny)
      if not visited[i] and is_bg(nx, ny):
        visited[i] = 1
        q.append((nx, ny))

  # Apply alpha
  r, g, b, _a = img.split()
  a_img = Image.frombytes("L", (w, h), bytes(alpha))

  # Feather edges slightly to reduce jaggies
  if feather > 0:
    a_img = a_img.filter(ImageFilter.GaussianBlur(radius=feather))

  out = Image.merge("RGBA", (r, g, b, a_img))
  out.save(out_path, "PNG", optimize=True)


def main(argv: list[str]) -> int:
  # Prefer the canonical hero asset name.
  in_path = argv[1] if len(argv) > 1 else "src/assets/profile.png"
  out_path = argv[2] if len(argv) > 2 else "public/profile-cutout.png"
  print(f"Input:  {in_path}")
  print(f"Output: {out_path}")
  make_cutout(in_path, out_path)
  print("Done.")
  return 0


if __name__ == "__main__":
  raise SystemExit(main(sys.argv))
