#!/usr/bin/env python3
"""Serve frontend/build on :3000 with SPA history fallback.

Much faster to start and to load than `yarn start` (the production bundle is
~155 KB gzipped vs ~2.9 MB unminified in dev). No hot reload — rebuild with
`yarn build` and refresh. Use `yarn start` instead when actively editing UI code.
"""
import os
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

BUILD = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend", "build")
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3000


class SPAHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        # Client-side routes (/masjids/xyz) have no file on disk — serve the app shell
        # so React Router can handle them, exactly as Vercel does in production.
        path = self.translate_path(self.path)
        if not os.path.exists(path) and "." not in os.path.basename(path):
            self.path = "/index.html"
        return super().send_head()

    def end_headers(self):
        # index.html must never be cached, or a rebuild keeps serving the old bundle.
        if self.path in ("/", "/index.html"):
            self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *args):
        pass  # keep the terminal quiet


if not os.path.isdir(BUILD):
    sys.exit(f"No build at {BUILD} — run: cd frontend && yarn build")

print(f"Serving {BUILD} on http://localhost:{PORT}")
ThreadingHTTPServer(("127.0.0.1", PORT), partial(SPAHandler, directory=BUILD)).serve_forever()
