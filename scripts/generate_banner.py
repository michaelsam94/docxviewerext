import struct
import zlib
from pathlib import Path


def chunk(tag: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(tag + data) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)


def to_png(width: int, height: int, rgba_bytes: bytes) -> bytes:
    raw = bytearray()
    stride = width * 4
    for y in range(height):
        raw.append(0)
        row_start = y * stride
        raw.extend(rgba_bytes[row_start : row_start + stride])

    header = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(raw), level=9)
    return header + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def put_rect(pixels: bytearray, width: int, x0: int, y0: int, w: int, h: int, color):
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            i = (y * width + x) * 4
            pixels[i : i + 4] = bytes(color)


def main() -> None:
    width, height = 1280, 640
    pixels = bytearray(width * height * 4)

    for y in range(height):
        for x in range(width):
            i = (y * width + x) * 4
            t = (x * 0.65 + y * 0.35) / (width * 0.65 + height * 0.35)
            r = lerp(16, 55, t)
            g = lerp(38, 84, t)
            b = lerp(102, 176, t)
            pixels[i : i + 4] = bytes((r, g, b, 255))

    put_rect(pixels, width, 120, 120, 300, 400, (247, 251, 255, 255))
    put_rect(pixels, width, 320, 120, 100, 100, (214, 225, 245, 255))

    put_rect(pixels, width, 160, 240, 140, 18, (45, 89, 189, 255))
    put_rect(pixels, width, 160, 280, 120, 18, (45, 89, 189, 255))
    put_rect(pixels, width, 160, 320, 130, 18, (45, 89, 189, 255))

    # Eye motif
    put_rect(pixels, width, 270, 360, 120, 70, (30, 85, 190, 255))
    put_rect(pixels, width, 300, 384, 60, 20, (247, 251, 255, 255))
    put_rect(pixels, width, 323, 389, 14, 10, (30, 85, 190, 255))

    out = Path("docxviewerext-banner.png")
    out.write_bytes(to_png(width, height, bytes(pixels)))
    print(f"generated {out.resolve()}")


if __name__ == "__main__":
    main()
