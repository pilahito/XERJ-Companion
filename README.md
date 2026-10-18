# XERJ Companion

**Free, experimental, open-source companion UI for [XERJ](https://github.com/xerj-org/xerj)**. Community project by **[@pilahito](https://github.com/pilahito)**, proposed in [XERJ issue #1755](https://github.com/xerj-org/xerj/issues/1755). Not endorsed by XERJ.

![UI concept](https://github.com/user-attachments/assets/c32bc0f0-00b7-4940-aafb-537e4ed289fc)

> The image is an illustrative mockup. Actual UI is a simpler dark navy/violet design.

## Quick start

Requires **Python 3.9+**. No pip packages or paid APIs.

1. Start your local XERJ search endpoint on `http://127.0.0.1:9200` following XERJ's own instructions. Search requires an indexed corpus.
2. Optionally install [Ollama](https://ollama.com/download) for local chat and model downloads.
3. Run `python3 server.py --port 8765`.
4. Open **http://127.0.0.1:8765** in your browser.
5. Run `python3 -m unittest discover -v` to test.

Search works without Ollama. The Hardware & AI panel reports CPU and basic RAM/GPU information, installed models, and offers explicitly requested model downloads. Downloads require network access and free disk space.

## Project boundaries

- Only binds to localhost; **not designed for public deployment**. No accounts, authentication or telemetry.
- Does not modify XERJ itself. Its search endpoint uses an Elasticsearch-compatible query, which must be checked against your configured XERJ version/index mapping.
- This is a **prototype**; no claim of validated production integration.
- Copyright 2026 pilahito. Source offered under Apache License 2.0, see LICENSE.
- Ivan and XERJ maintainers are welcome to evaluate, adapt or distribute it with applicable attribution. Maintainer review and contribution rights are theirs to decide. I may archive the standalone repo if the proposal isn't relevant.
