#!/usr/bin/env python3
import os
import subprocess
import tempfile
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse


ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_POST(self):
        if urlparse(self.path).path != "/convert-pdf":
            self.send_error(404)
            return
        try:
            content_type = self.headers.get("Content-Type", "")
            boundary = content_type.split("boundary=", 1)[1].encode() if "boundary=" in content_type else b""
            raw = self.rfile.read(int(self.headers.get("Content-Length", "0")))
            parts = raw.split(b"--" + boundary)
            payload = next((p.split(b"\r\n\r\n", 1)[1].rsplit(b"\r\n", 1)[0] for p in parts if b'name="file"' in p), None)
            if not payload:
                raise ValueError("PDFファイルがありません")
            page = max(1, int(parse_qs(urlparse(self.path).query).get("page", ["1"])[0]))
            with tempfile.TemporaryDirectory(prefix="boardcad-pdf-") as tmp:
                source = os.path.join(tmp, "source.pdf")
                target = os.path.join(tmp, "page.svg")
                with open(source, "wb") as stream:
                    stream.write(payload)
                result = subprocess.run(
                    ["pdftocairo", "-f", str(page), "-l", str(page), "-svg", source, target],
                    capture_output=True, text=True, timeout=30,
                )
                if result.returncode:
                    raise RuntimeError(result.stderr.strip() or "pdftocairo failed")
                with open(target, "rb") as stream:
                    body = stream.read()
            self.send_response(200)
            self.send_header("Content-Type", "image/svg+xml; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as error:
            body = str(error).encode("utf-8", "replace")
            self.send_error(400, body.decode("utf-8", "replace"))


if __name__ == "__main__":
    port = int(os.environ.get("BOARDCAD_PORT", "8788"))
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
