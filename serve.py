#!/usr/bin/env python3
"""
Peregrine — local preview server WITH HTTP Range support.

Python's built-in `python -m http.server` answers every request with a full
200 response and no `Accept-Ranges`. Safari (and iOS) refuse to play a <video>
that way, so the walkthrough video "won't play" — you press play and nothing
happens. This server answers Range requests with 206 Partial Content, which is
all the browser needs.

Usage:
    cd ~/Desktop/Peregrine-Website
    python3 serve.py            # serves http://localhost:8099
    python3 serve.py 9000       # custom port
"""
import os
import sys
import http.server
import socketserver

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8099


class RangeHandler(http.server.SimpleHTTPRequestHandler):
    """SimpleHTTPRequestHandler + single-range (bytes=a-b) support."""

    def end_headers(self):
        # Dev server: never let the browser cache HTML/CSS/JS, so edits show
        # up on plain reload. Media keeps a short cache for smooth scrubbing.
        if self.path.split("?")[0].endswith((".html", ".css", ".js", "/")):
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def send_head(self):
        rng = self.headers.get("Range")
        if not rng or not rng.strip().lower().startswith("bytes="):
            return super().send_head()

        path = self.translate_path(self.path)
        if not os.path.isfile(path):
            return super().send_head()

        try:
            size = os.path.getsize(path)
            spec = rng.split("=", 1)[1].strip()
            start_s, _, end_s = spec.partition("-")
            if start_s == "":            # suffix range: bytes=-N (last N bytes)
                length = int(end_s)
                start = max(0, size - length)
                end = size - 1
            else:
                start = int(start_s)
                end = int(end_s) if end_s else size - 1
            end = min(end, size - 1)
            if start > end or start >= size:
                self.send_error(416, "Requested Range Not Satisfiable")
                self.send_header("Content-Range", "bytes */%d" % size)
                return None
        except (ValueError, OSError):
            return super().send_head()

        f = open(path, "rb")
        f.seek(start)
        length = end - start + 1
        self.send_response(206, "Partial Content")
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Range", "bytes %d-%d/%d" % (start, end, size))
        self.send_header("Content-Length", str(length))
        self.end_headers()
        self._range_remaining = length
        return f

    def copyfile(self, source, outputfile):
        remaining = getattr(self, "_range_remaining", None)
        if remaining is None:
            return super().copyfile(source, outputfile)
        while remaining > 0:
            chunk = source.read(min(64 * 1024, remaining))
            if not chunk:
                break
            outputfile.write(chunk)
            remaining -= len(chunk)


class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    with Server(("", PORT), RangeHandler) as httpd:
        print("Peregrine preview (range-capable) → http://localhost:%d" % PORT)
        print("Press Ctrl+C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")
