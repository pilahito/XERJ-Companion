# XERJ Companion — Unofficial

**English** · [Español](README.es.md)

**Unofficial, local-first companion interface for [XERJ](https://github.com/xerj-org/xerj)** — search your own corpus, read the highlighted sources, and ask a local model about them. No accounts, no telemetry, no paid APIs.

> **Unofficial.** Not affiliated with, reviewed by or endorsed by the XERJ team. The interface is the contribution: XERJ's engine and source code are not mine and are not modified here. This is an adaptation offered to XERJ's original creators, who are free to adopt it, adapt it or ignore it.

![Proposal concept](https://github.com/user-attachments/assets/c32bc0f0-00b7-4940-aafb-537e4ed289fc)

*The concept shared in the proposal. `?demo=1` reproduces it number for number; the screenshots below are the real thing against a local endpoint.*

![Search view with results, highlighted code and the live index rail](assets/screenshot-search.png)

*Search view: per-index tabs, an answer grounded in your hits, highlighted code with line numbers, and a right rail with live index counts, recent queries and local AI chat.*

## Contents

- [Features](#features)
- [Run it](#run-it) — browser, desktop, packages
- [What it talks to](#what-it-talks-to)
- [Project structure](#project-structure)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Limits and honesty](#limits-and-honesty)
- [License](#license)

## Features

| | |
| --- | --- |
| **Source-backed search** | Forwards your query to XERJ's existing search endpoint and renders hits with syntax-highlighted code, line numbers, a copy button and per-index tabs with counts. |
| **Answer panel** | "Explain results" asks your local model to reason over the hits you retrieved, and cites how many sources it used plus the elapsed time. |
| **Live index rail** | Documents, index count, size and health read from `_cat/indices`, next to your recent queries and the sources you copy most. Counted in `localStorage`, never uploaded. |
| **Indexes view** | The raw table of indexes and corpus size, straight from your endpoint. |
| **Analytics view** | Your own search history and most reused sources, kept on this machine. |
| **Hardware & AI** | CPU cores, RAM, NVIDIA GPU when present, installed Ollama models, and model downloads only when you ask explicitly. |
| **Bilingual** | Full interface in English and Spanish; defaults to your system language and remembers the switch. |

![Source references](assets/screenshot-sources.png)

*Source cards keep the path, the description and the line range; selecting one loads it into the code card.*

## Run it

Requires **Python 3.9+**. The browser build needs no pip packages.

### Browser version

```bash
python3 server.py --port 8765
# open http://127.0.0.1:8765
```

### Desktop version

```bash
python3 desktop.py
```

Same server, opened in a native window when [pywebview](https://pywebview.flowrl.com/) is installed, otherwise in an app-mode browser window (Chrome, Chromium, Brave, Edge, Vivaldi, Opera) or your default browser.

| Flag | Effect |
| --- | --- |
| `--port 8765` | Port to serve on (default `8765`). |
| `--browser` | Skip pywebview, always use a browser window. |
| `--no-open` | Serve only, open nothing (useful in scripts and CI). |

### Packages

Prebuilt downloads are in [Releases](https://github.com/pilahito/XERJ-Companion-NO-OFICIAL-NO-OFICIAL/releases/latest):

| Platform | File | Notes |
| --- | --- | --- |
| Windows | `XERJ-Companion-NO-OFICIAL.exe` | Single file. Unsigned, so SmartScreen may warn. |
| Linux (any) | `XERJ-Companion-NO-OFICIAL` | Single binary built on Ubuntu 24.04. A native window needs `webkit2gtk`; otherwise it opens an app-mode browser. |
| Debian / Ubuntu | `xerj-companion_<version>_all.deb` | Adds an application-menu entry. `sudo apt install ./xerj-companion_*_all.deb` |
| Arch | [packaging/PKGBUILD](packaging/PKGBUILD) | `makepkg -si` against the release tag. |

Every release asset is built by [`.github/workflows/release.yml`](.github/workflows/release.yml) on a `v*` tag, so the binaries match the source at that tag. None of them are code-signed yet.

## What it talks to

| Service | Default | Required | Used for |
| --- | --- | --- | --- |
| XERJ search endpoint | `http://127.0.0.1:9200` | for search | A version check on `/`, an Elasticsearch-compatible `_search`, and `_cat/indices` for the rail. |
| [Ollama](https://ollama.com/download) | `http://127.0.0.1:11434` | only for AI | `/api/tags` for installed models, `/api/generate` for answers, `ollama pull` when you click download. |

The server binds to `127.0.0.1` only. Query text goes to those two local services and nowhere else; there is no analytics endpoint in the code. Index fields are read by name (`path`/`file`, `text`/`content`, `lines`, `language`, `note`), so if your corpus uses other keys, the card falls back to the raw JSON of the hit.

## Project structure

```
server.py              # localhost server: static files, /api/status, /api/search, /api/chat, /api/indices, /api/hardware, /api/models
desktop.py             # desktop launcher (pywebview window, else app-mode browser)
index.html app.js      # the interface
style.css              # three-column dark dashboard
i18n.json              # English/Spanish catalogs, identical key sets
test_server.py         # unittest suite (proxy, validation, i18n coverage)
packaging/             # PyInstaller spec, .deb builder, .desktop entry, PKGBUILD, icon
.github/workflows/     # tests.yml (3.9 + 3.12) and release.yml (exe, binary, deb)
```

## Development

```bash
python3 -m unittest discover -v      # 7 tests: frontend, proxy, validation, i18n
python3 packaging/build_deb.py       # .deb with the standard library only
pyinstaller packaging/xerj-companion.spec
```

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Pill reads **XERJ offline** | Nothing is listening on `:9200`, or XERJ has no index yet. Start it and reload. |
| Search returns "Local service unavailable" | The endpoint answered an error: check XERJ's logs and the index name. |
| **Local AI unavailable** | Ollama is not running, or the chosen model is not installed (`ollama list`). |
| Hardware panel says unknown RAM/GPU | Only Linux, macOS and Windows are probed; GPU detection needs `nvidia-smi`. |
| Stale interface after updating | Hard reload (`Ctrl+Shift+R`); the server sends `Cache-Control: no-store` for every asset. |
| Right rail missing in a narrow window | The three-column layout needs ~1180 px. Below that the rail hides; the **▥** button in the header opens it as a drawer. |
| Windows warns about the `.exe` | Expected: the binary is unsigned. Build it yourself from the tag if you prefer. |

## Limits and honesty

- **Prototype**, not a validated production integration. The XERJ team may adopt it, adapt it or decline it.
- The proposal mockup showed `68 %`, `docs/second` and an ETA. XERJ does not expose indexing speed or progress, so this app reports real counts and health instead of inventing numbers.
- Only binds to localhost; not designed for public deployment.
- Copyright 2026 pilahito. Source offered under [Apache License 2.0](LICENSE). Ivan and the XERJ maintainers are welcome to evaluate, adapt or distribute it with applicable attribution.

![Hardware panel](assets/screenshot-hardware.png)
