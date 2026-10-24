# PyInstaller spec shared by the Linux and Windows release builds.
import os
from pathlib import Path

ROOT = Path(SPECPATH).parent
FILES = ["index.html", "app.js", "style.css", "i18n.json", "VERSION", "README.md", "LICENSE"]

a = Analysis(
    [str(ROOT / "desktop.py")],
    pathex=[str(ROOT)],
    binaries=[],
    datas=[(str(ROOT / name), ".") for name in FILES],
    hiddenimports=["server", "webview"],
    hookspath=[],
    runtime_hooks=[],
    excludes=["tkinter"],
    noarchive=False,
)
pyz = PYZ(a.pure)
exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name="XERJ-Companion-NO-OFICIAL",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=os.name != "nt",
    icon=str(ROOT / "packaging" / "xerj-companion.ico") if os.name == "nt" else None,
)
