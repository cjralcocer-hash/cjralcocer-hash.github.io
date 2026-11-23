#!/usr/bin/env python3
"""Proves scripts/qr.py makes codes that real scanners read.

    python3 scripts/verify_qr.py

Writes a PNG for each test string, decodes them with Apple's QR detector (scripts/verify_qr.swift,
run through xcrun swift) and checks every result matches exactly. Mac only. Also checks that
the shipped images/qr-site.svg is up to date through scripts/check.py, not here.
"""
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import qr  # noqa: E402

TESTS = [
    'HELLO',
    'https://example.org/a-v2-t',
    'https://example.org/this-one-is-for-version-three',
    'https://comidacoachellavalley.github.io/en/flyer/?city=indio',
    'https://comidacoachellavalley.github.io/',
    'https://comidacoachellavalley.github.io/en/',
    'https://comidacoachellavalley.github.io/en/flyer/?city=indio&utm=print',
    'https://comidacoachellavalley.github.io/en/flyer/?city=indio&utm=print&n=1',
]


def main():
    with tempfile.TemporaryDirectory() as tmp:
        paths = []
        for i, text in enumerate(TESTS):
            m = qr.matrix(text)
            version = (len(m) - 17) // 4
            print('v%d-Q  %3d bytes  %s' % (version, len(text.encode()), text))
            path = os.path.join(tmp, 'qr%d.png' % i)
            with open(path, 'wb') as f:
                f.write(qr.to_png(m))
            paths.append(path)
        res = subprocess.run(['xcrun', 'swift', os.path.join(HERE, 'verify_qr.swift')] + paths,
                             capture_output=True, text=True)
        if res.returncode != 0:
            print(res.stderr)
            return 1
        decoded = res.stdout.splitlines()
    ok = True
    for text, got in zip(TESTS, decoded):
        status = 'ok  ' if got == text else 'FAIL'
        ok = ok and got == text
        print('%s %r -> %r' % (status, text, got))
    if len(decoded) != len(TESTS):
        print('FAIL expected %d results, got %d' % (len(TESTS), len(decoded)))
        ok = False
    print('All QR test strings decode exactly.' if ok else 'QR check FAILED.')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
