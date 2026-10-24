# XERJ Companion

**English** · [Español](README.es.md)

**Free, experimental, open-source companion interface for [XERJ](https://github.com/xerj-org/xerj)**, offered as a proposal in [XERJ issue #1755](https://github.com/xerj-org/xerj/issues/1755).

> **Unofficial.** Not affiliated with, reviewed by or endorsed by the XERJ team. The interface is the contribution: XERJ's engine and source code are not mine and are not modified here. This is an adaptation offered to XERJ's original creators, who are free to adopt it, adapt it or ignore it.

![UI concept](https://github.com/user-attachments/assets/c32bc0f0-00b7-4940-aafb-537e4ed289fc)

> The image is an illustrative mockup. Actual UI is a simpler dark navy/violet design.

## Quick start

Requires **Python 3.9+**. No pip packages or paid APIs.

1. Start your local XERJ search endpoint on `http://127.0.0.1:9200` following XERJ's own instructions. Search requires an indexed corpus.
2. Optionally install [Ollama](https://ollama.com/download) for local chat and model downloads.
3. Run `python3 server.py --port 8765`.
4. Open **http://127.0.0.1:8765** in your browser.
5. Run `python3 -m unittest discover -v` to test.

The interface ships in English and Spanish: the ES/EN button in the header switches language and remembers the choice (it defaults to your system language).

Search works without Ollama. The Hardware & AI panel reports CPU and basic RAM/GPU information, installed models, and offers explicitly requested model downloads. Downloads require network access and free disk space.

## Browser or desktop

- **Browser version** — `python3 server.py --port 8765`, then open http://127.0.0.1:8765. Needs only Python 3.9.
- **Desktop version** — `python3 desktop.py`: the same server, opened in a native window when [pywebview](https://pywebview.flowrl.com/) is installed, otherwise in an app-mode browser window (or your default browser). `--browser` forces the browser, `--no-open` serves only.

## Packages

Prebuilt downloads are attached to [Releases](https://github.com/pilahito/XERJ-Companion/releases):

| Platform | File | Notes |
| --- | --- | --- |
| Windows | `XERJ-Companion.exe` | Single file. Unsigned, so SmartScreen may warn. |
| Linux (any) | `XERJ-Companion` | Single binary, built on Ubuntu 24.04. |
| Debian / Ubuntu | `xerj-companion_<version>_all.deb` | Adds an entry to the application menu. |
| Arch | [packaging/PKGBUILD](packaging/PKGBUILD) | `makepkg -si` against the release tag. |

Build them yourself: `python3 packaging/build_deb.py` needs no `dpkg`, and `pyinstaller packaging/xerj-companion.spec` produces the single-file binary.

## Project boundaries

- Only binds to localhost; **not designed for public deployment**. No accounts, authentication or telemetry.
- Does not modify XERJ itself. Its search endpoint uses an Elasticsearch-compatible query, which must be checked against your configured XERJ version/index mapping.
- This is a **prototype**; no claim of validated production integration.
- Unofficial, community proposal: the XERJ team may adopt, adapt or decline it at their discretion.
- Copyright 2026 pilahito. Source offered under Apache License 2.0, see LICENSE.
- Ivan and XERJ maintainers are welcome to evaluate, adapt or distribute it with applicable attribution. Maintainer review and contribution rights are theirs to decide. I may archive the standalone repo if the proposal isn't relevant.
