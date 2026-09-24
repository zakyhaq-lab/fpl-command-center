import http.server
import socketserver
import os
from api.index import handler as ApiHandler

PORT = 8080
HTML_FILE = os.path.join(os.path.dirname(__file__), "index.html")

class LocalDevHandler(ApiHandler):
    def do_GET(self):
        # If API route, let ApiHandler handle it
        if self.path.startswith("/api/"):
            super().do_GET()
        else:
            # Serve index.html
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            if os.path.exists(HTML_FILE):
                with open(HTML_FILE, "rb") as f:
                    self.wfile.write(f.read())
            else:
                self.wfile.write(b"<h1>index.html not found</h1>")

    def do_HEAD(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()

def run():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), LocalDevHandler) as httpd:
        print(f"🚀 FPL Command Center running locally at http://localhost:{PORT}")
        httpd.serve_forever()

if __name__ == "__main__":
    run()
