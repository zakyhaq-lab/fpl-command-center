import http.server
import socketserver
import os
from api.index import handler as ApiHandler

PORT = 8080
HTML_FILE = os.path.join(os.path.dirname(__file__), "index.html")

class LocalDevHandler(ApiHandler):
    def do_GET(self):
        path_clean = self.path.split("?")[0]
        
        # Serve static assets (logo, favicon, etc.)
        if path_clean in ("/logo.jpg", "/favicon.ico") or path_clean.startswith("/public/"):
            filename = "logo.jpg" if path_clean in ("/logo.jpg", "/favicon.ico") else path_clean.replace("/public/", "")
            target_path = os.path.join(os.path.dirname(__file__), "public", filename)
            if not os.path.exists(target_path):
                target_path = os.path.join(os.path.dirname(__file__), filename)
            
            if os.path.exists(target_path):
                self.send_response(200)
                content_type = "image/jpeg" if target_path.endswith((".jpg", ".jpeg")) else "image/png"
                self.send_header("Content-Type", content_type)
                self.send_header("Cache-Control", "public, max-age=86400")
                self.end_headers()
                with open(target_path, "rb") as f:
                    self.wfile.write(f.read())
                return

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
        path_clean = self.path.split("?")[0]
        if path_clean in ("/logo.jpg", "/favicon.ico") or path_clean.startswith("/public/"):
            self.send_response(200)
            self.send_header("Content-Type", "image/jpeg")
            self.end_headers()
        else:
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
