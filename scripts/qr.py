#!/usr/bin/env python3
"""A small QR code encoder with nothing to install (ISO/IEC 18004).

Scope: byte mode, versions 1 to 6, error correction level Q, smallest version that fits.
Raises ValueError when the text does not fit version 6-Q (74 bytes). The same input always
gives the same output, so scripts/check.py can compare the generated SVG with the file on disk.

    import qr
    m = qr.matrix('https://example.org/')   # list of rows, True = dark module
    svg = qr.to_svg(m)                      # black on white, with a quiet zone
    png = qr.to_png(m)                      # bytes, used for testing only

Prove it still scans with:  python3 scripts/verify_qr.py   (Mac only, uses Swift)
"""
import struct
import zlib

# Level Q, versions 1-6: (EC codewords per block, [(blocks, data codewords per block), ...])
BLOCKS = {
    1: (13, [(1, 13)]),
    2: (22, [(1, 22)]),
    3: (18, [(2, 17)]),
    4: (26, [(2, 24)]),
    5: (18, [(2, 15), (2, 16)]),
    6: (24, [(4, 19)]),
}
TOTAL_CODEWORDS = {1: 26, 2: 44, 3: 70, 4: 100, 5: 134, 6: 172}
FORMAT_Q = 0b11  # error correction level Q in the format information


def _check_table():
    for v, (ec, groups) in BLOCKS.items():
        n = sum(b for b, _ in groups)
        data = sum(b * d for b, d in groups)
        assert data + n * ec == TOTAL_CODEWORDS[v], 'block table wrong for version %d' % v


_check_table()


def _data_capacity(v):
    return sum(b * d for b, d in BLOCKS[v][1])


# ---- Reed-Solomon over GF(256), polynomial 0x11D ----

_EXP = [0] * 512
_LOG = [0] * 256
_x = 1
for _i in range(255):
    _EXP[_i] = _x
    _LOG[_x] = _i
    _x <<= 1
    if _x & 0x100:
        _x ^= 0x11D
for _i in range(255, 512):
    _EXP[_i] = _EXP[_i - 255]


def _mul(a, b):
    return 0 if a == 0 or b == 0 else _EXP[_LOG[a] + _LOG[b]]


def _generator(n):
    g = [1]
    for i in range(n):
        nxt = [0] * (len(g) + 1)
        for j, c in enumerate(g):
            nxt[j] ^= c
            nxt[j + 1] ^= _mul(c, _EXP[i])
        g = nxt
    return g  # highest degree first, g[0] == 1


def _rs_remainder(data, n):
    g = _generator(n)
    rem = list(data) + [0] * n
    for i in range(len(data)):
        c = rem[i]
        if c:
            for j in range(1, len(g)):
                rem[i + j] ^= _mul(g[j], c)
    return rem[len(data):]


# ---- data codewords and interleaving ----

def _data_codewords(payload, v):
    cap = _data_capacity(v)
    bits = [0, 1, 0, 0]
    bits += [(len(payload) >> i) & 1 for i in range(7, -1, -1)]
    for byte in payload:
        bits += [(byte >> i) & 1 for i in range(7, -1, -1)]
    bits += [0] * min(4, cap * 8 - len(bits))
    bits += [0] * (-len(bits) % 8)
    words = [int(''.join(map(str, bits[i:i + 8])), 2) for i in range(0, len(bits), 8)]
    pad = [0xEC, 0x11]
    while len(words) < cap:
        words.append(pad[(len(words) - len(bits) // 8) % 2])
    return words


def _codewords(payload, v):
    words = _data_codewords(payload, v)
    ec_len, groups = BLOCKS[v]
    blocks = []
    pos = 0
    for count, size in groups:
        for _ in range(count):
            blocks.append(words[pos:pos + size])
            pos += size
    assert pos == len(words)
    ecs = [_rs_remainder(b, ec_len) for b in blocks]
    out = []
    for i in range(max(len(b) for b in blocks)):
        for b in blocks:
            if i < len(b):
                out.append(b[i])
    for i in range(ec_len):
        for e in ecs:
            out.append(e[i])
    assert len(out) == TOTAL_CODEWORDS[v]
    return out


# ---- drawing ----

def _format_bits(mask):
    data = (FORMAT_Q << 3) | mask
    rem = data << 10
    for i in range(14, 9, -1):
        if (rem >> i) & 1:
            rem ^= 0x537 << (i - 10)
    return ((data << 10) | rem) ^ 0x5412


class _Grid:
    def __init__(self, v):
        self.v = v
        self.n = 17 + 4 * v
        self.dark = [[False] * self.n for _ in range(self.n)]
        self.func = [[False] * self.n for _ in range(self.n)]

    def set(self, x, y, dark, func=True):
        self.dark[y][x] = dark
        if func:
            self.func[y][x] = True

    def draw_function_patterns(self):
        n, v = self.n, self.v
        for i in range(n):
            self.set(6, i, i % 2 == 0)
            self.set(i, 6, i % 2 == 0)
        for cx, cy in ((3, 3), (n - 4, 3), (3, n - 4)):
            for dy in range(-4, 5):
                for dx in range(-4, 5):
                    x, y = cx + dx, cy + dy
                    if 0 <= x < n and 0 <= y < n:
                        self.set(x, y, max(abs(dx), abs(dy)) not in (2, 4))
        if v >= 2:
            c = 4 * v + 10
            for dy in range(-2, 3):
                for dx in range(-2, 3):
                    self.set(c + dx, c + dy, max(abs(dx), abs(dy)) != 1)
        self.draw_format(0)  # reserve the format areas
        self.set(8, n - 8, True)  # the dark module

    def draw_format(self, mask):
        n = self.n
        bits = _format_bits(mask)
        b = lambda i: (bits >> i) & 1 == 1
        for i in range(6):
            self.set(8, i, b(i))
        self.set(8, 7, b(6))
        self.set(8, 8, b(7))
        self.set(7, 8, b(8))
        for i in range(9, 15):
            self.set(14 - i, 8, b(i))
        for i in range(8):
            self.set(n - 1 - i, 8, b(i))
        for i in range(8, 15):
            self.set(8, n - 15 + i, b(i))
        self.set(8, n - 8, True)

    def place(self, words):
        n = self.n
        bits = []
        for w in words:
            bits += [(w >> i) & 1 for i in range(7, -1, -1)]
        i = 0
        right = n - 1
        while right >= 1:
            if right == 6:
                right = 5
            for vert in range(n):
                for j in range(2):
                    x = right - j
                    upward = ((right + 1) & 2) == 0
                    y = n - 1 - vert if upward else vert
                    if not self.func[y][x] and i < len(bits):
                        self.dark[y][x] = bits[i] == 1
                        i += 1
            right -= 2
        assert i == len(bits)

    def apply_mask(self, mask):
        for y in range(self.n):
            for x in range(self.n):
                if not self.func[y][x] and _MASKS[mask](x, y):
                    self.dark[y][x] = not self.dark[y][x]


_MASKS = [
    lambda x, y: (x + y) % 2 == 0,
    lambda x, y: y % 2 == 0,
    lambda x, y: x % 3 == 0,
    lambda x, y: (x + y) % 3 == 0,
    lambda x, y: (x // 3 + y // 2) % 2 == 0,
    lambda x, y: x * y % 2 + x * y % 3 == 0,
    lambda x, y: (x * y % 2 + x * y % 3) % 2 == 0,
    lambda x, y: ((x + y) % 2 + x * y % 3) % 2 == 0,
]


def _run_penalty(line):
    pen = 0
    run = 1
    for i in range(1, len(line) + 1):
        if i < len(line) and line[i] == line[i - 1]:
            run += 1
        else:
            if run >= 5:
                pen += 3 + (run - 5)
            run = 1
    return pen


def _penalty(m):
    n = len(m)
    pen = 0
    cols = [[m[y][x] for y in range(n)] for x in range(n)]
    for line in m + cols:
        pen += _run_penalty(line)
    for y in range(n - 1):
        for x in range(n - 1):
            if m[y][x] == m[y][x + 1] == m[y + 1][x] == m[y + 1][x + 1]:
                pen += 3
    pat_a = [True, False, True, True, True, False, True, False, False, False, False]
    pat_b = pat_a[::-1]
    for line in m + cols:
        for i in range(n - 10):
            seg = line[i:i + 11]
            if seg == pat_a or seg == pat_b:
                pen += 40
    dark = sum(sum(r) for r in m)
    pen += 10 * (abs(dark * 20 - n * n * 10) // (n * n))
    return pen


def matrix(text):
    payload = text.encode('utf-8')
    for v in range(1, 7):
        if len(payload) <= _data_capacity(v) - 2 and len(payload) < 256:
            break
    else:
        raise ValueError('text is %d bytes; version 6-Q holds at most %d' % (len(payload), _data_capacity(6) - 2))
    words = _codewords(payload, v)
    best = None
    for mask in range(8):
        g = _Grid(v)
        g.draw_function_patterns()
        g.place(words)
        g.apply_mask(mask)
        g.draw_format(mask)
        score = _penalty(g.dark)
        if best is None or score < best[0]:
            best = (score, g.dark)
    return [list(r) for r in best[1]]


# ---- output ----

def to_svg(m, quiet=4, title=None):
    n = len(m)
    size = n + 2 * quiet
    parts = []
    for y, row in enumerate(m):
        x = 0
        while x < n:
            if row[x]:
                start = x
                while x < n and row[x]:
                    x += 1
                parts.append('M%d %dh%dv1h-%dz' % (start + quiet, y + quiet, x - start, x - start))
            else:
                x += 1
    label = title if title is not None else 'QR code'
    label = label.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" '
            'shape-rendering="crispEdges" role="img">'
            '<title>%s</title><rect width="%d" height="%d" fill="#fff"/>'
            '<path fill="#000" d="%s"/></svg>\n' % (size, size, size, size, label, size, size, ''.join(parts)))


def to_png(m, scale=10, quiet=4):
    n = len(m)
    size = (n + 2 * quiet) * scale
    rows = []
    for py in range(size):
        y = py // scale - quiet
        row = bytearray([0])
        for px in range(size):
            x = px // scale - quiet
            dark = 0 <= x < n and 0 <= y < n and m[y][x]
            row.append(0 if dark else 255)
        rows.append(bytes(row))

    def chunk(tag, data):
        c = struct.pack('>I', len(data)) + tag + data
        return c + struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF)

    return (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 0, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(b''.join(rows), 9)) + chunk(b'IEND', b''))
