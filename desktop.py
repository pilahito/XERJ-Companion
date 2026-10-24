#!/usr/bin/env python3
"""XERJ Companion desktop launcher.

Serves the interface on localhost and opens it in a native window when
pywebview is available, otherwise in an app-mode browser window (or the
default browser). Only 127.0.0.1 is ever bound.
"""
import argparse, os, shutil, subprocess, sys, threading, time, webbrowser
from http.server import ThreadingHTTPServer

import server

APP_MODE = {
    "google-chrome": ["--app={url}"],
    "google-chrome-stable": ["--app={url}"],
    "chromium": ["--app={url}"],
    "chromium-browser": ["--app={url}"],
    "brave": ["--app={url}"],
    "brave-browser": ["--app={url}"],
    "microsoft-edge": ["--app={url}"],
    "vivaldi": ["--app={url}"],
    "opera": ["--app={url}"],
}


def app_mode_command(url):
    for name, args in APP_MODE.items():
        path = shutil.which(name)
        if path:
            return [path] + [arg.format(url=url) for arg in args]
    return None


def open_native(url):
    try:
        import webview
    except Exception:
        return False
    window = webview.create_window("XERJ Companion — No oficial", url, width=1400, height=900, min_size=(960, 640))
    webview.start()
    del window
    return True


def open_browser_window(url):
    command = app_mode_command(url)
    if command:
        subprocess.Popen(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return
    webbrowser.open(url)


def main(argv=None):
    parser = argparse.ArgumentParser(description="Run XERJ Companion as a desktop app.")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--browser", action="store_true", help="skip pywebview and use a browser window")
    parser.add_argument("--no-open", action="store_true", help="serve only, do not open a window (tests)")
    parser.add_argument("--demo", action="store_true", help="open the interface with sample data (screenshots)")
    args = parser.parse_args(argv)

    httpd = ThreadingHTTPServer((args.host, args.port), server.Handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    url = "http://%s:%d%s" % (args.host, args.port, "?demo=1" if args.demo else "")
    print("XERJ Companion: %s  (Ctrl+C to stop)" % url, flush=True)

    if args.no_open:
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            return 0
        finally:
            httpd.shutdown()

    if not args.browser and open_native(url):
        httpd.shutdown()
        return 0
    try:
        open_browser_window(url)
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        return 0
    finally:
        httpd.shutdown()


if __name__ == "__main__":
    sys.exit(main())
