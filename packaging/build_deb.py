#!/usr/bin/env python3
"""Build xerj-companion_<version>_all.deb with the standard library only.

Works on any Linux (no dpkg-deb needed); the archive layout is the Debian
one: debian-binary + control.tar.gz + data.tar.gz inside an ar container.
"""
import argparse, gzip, hashlib, io, os, stat, tarfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP_FILES = ["desktop.py", "server.py", "index.html", "app.js", "style.css", "i18n.json"]
LIB_DIR = "usr/lib/xerj-companion"

WRAPPER = """#!/bin/sh
# XERJ Companion launcher installed by the .deb package.
exec python3 /usr/lib/xerj-companion/desktop.py "$@"
"""

CONTROL = """Package: xerj-companion
Version: {version}
Section: utils
Priority: optional
Architecture: all
Maintainer: pilahito <57416155+pilahito@users.noreply.github.com>
Depends: python3 (>= 3.9)
Recommends: python3-gi, gir1.2-webkit2-4.1
Homepage: https://github.com/pilahito/XERJ-Companion
Description: Unofficial companion interface for XERJ
 Local-first dashboard for XERJ with source-backed search, highlighted
 results, live index counts and optional local AI chat through Ollama.
 Everything runs on 127.0.0.1 and nothing is uploaded. Unofficial
 project, not affiliated with the XERJ team.
"""


def ar_write(path, entries):
    """Write a SysV ar archive: entries is [(name, bytes)]."""
    with open(path, "wb") as handle:
        handle.write(b"!<arch>\n")
        for name, payload in entries:
            header = "%-16s%-12s%-6s%-6s%-8s%-10s" % (name, "0", "0", "0", "100644", str(len(payload)))
            handle.write((header + "`\n").encode("ascii"))
            handle.write(payload)
            if len(payload) % 2:
                handle.write(b"\n")


def add(tar, name, data, mode=0o644):
    info = tarfile.TarInfo(name)
    info.size = len(data)
    info.mode = mode
    info.uid = info.gid = 0
    info.uname = info.gname = "root"
    info.mtime = 0
    tar.addfile(info, io.BytesIO(data))


def gz(tar_bytes):
    import gzip as _gzip
    buffer = io.BytesIO()
    with _gzip.GzipFile(fileobj=buffer, mode="wb", mtime=0) as gzfile:
        gzfile.write(tar_bytes)
    return buffer.getvalue()


def build(version, out_dir):
    out_dir.mkdir(parents=True, exist_ok=True)
    data = io.BytesIO()
    with tarfile.open(fileobj=data, mode="w") as tar:
        add(tar, "./", b"", 0o755)
        add(tar, "./usr/", b"", 0o755)
        add(tar, "./usr/bin/", b"", 0o755)
        add(tar, "./usr/bin/xerj-companion", WRAPPER.encode(), 0o755)
        add(tar, "./usr/lib/", b"", 0o755)
        add(tar, "./usr/lib/xerj-companion/", b"", 0o755)
        checksums = []
        for name in APP_FILES:
            payload = (ROOT / name).read_bytes()
            target = "./%s/%s" % (LIB_DIR, name)
            add(tar, target, payload, 0o755 if name.endswith(".py") else 0o644)
            checksums.append("%s  %s/%s\n" % (hashlib.md5(payload).hexdigest(), LIB_DIR, name))
        icon = (ROOT / "assets" / "icon.png").read_bytes()
        add(tar, "./usr/share/", b"", 0o755)
        add(tar, "./usr/share/applications/", b"", 0o755)
        add(tar, "./usr/share/applications/xerj-companion.desktop",
            (ROOT / "packaging" / "xerj-companion.desktop").read_bytes())
        add(tar, "./usr/share/icons/", b"", 0o755)
        add(tar, "./usr/share/icons/hicolor/", b"", 0o755)
        add(tar, "./usr/share/icons/hicolor/512x512/", b"", 0o755)
        add(tar, "./usr/share/icons/hicolor/512x512/apps/", b"", 0o755)
        add(tar, "./usr/share/icons/hicolor/512x512/apps/xerj-companion.png", icon)
        add(tar, "./usr/share/doc/", b"", 0o755)
        add(tar, "./usr/share/doc/xerj-companion/", b"", 0o755)
        for name in ("README.md", "LICENSE", "README.es.md"):
            add(tar, "./usr/share/doc/xerj-companion/" + name, (ROOT / name).read_bytes())
        add(tar, "./usr/share/doc/xerj-companion/copyright",
            ("Format: https://www.debian.org/doc/packaging-manuals/copyright-format/1.0/\n"
             "Upstream-Name: XERJ Companion\nSource: https://github.com/pilahito/XERJ-Companion\n\n"
             "Files: *\nCopyright: 2026 pilahito\nLicense: Apache-2.0\n"
             " On Debian systems the full text is in /usr/share/common-licenses/Apache-2.0\n"
             " and in /usr/share/doc/xerj-companion/LICENSE.\n").encode())

    control = io.BytesIO()
    with tarfile.open(fileobj=control, mode="w") as tar:
        add(tar, "./", b"", 0o755)
        add(tar, "./control", CONTROL.format(version=version).encode())
        add(tar, "./md5sums", "".join(checksums).encode())
        add(tar, "./conffiles", b"")

    target = out_dir / ("xerj-companion_%s_all.deb" % version)
    ar_write(target, [
        ("debian-binary", b"2.0\n"),
        ("control.tar.gz", gz(control.getvalue())),
        ("data.tar.gz", gz(data.getvalue())),
    ])
    return target


def main():
    parser = argparse.ArgumentParser(description="Build the XERJ Companion .deb package.")
    parser.add_argument("--version", default=(ROOT / "VERSION").read_text().strip())
    parser.add_argument("--out", default=str(ROOT / "dist"))
    args = parser.parse_args()
    target = build(args.version, Path(args.out))
    print("%s (%d bytes)" % (target, target.stat().st_size))


if __name__ == "__main__":
    main()
