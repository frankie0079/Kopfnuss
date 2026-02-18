"""Dev-Server: Multi-threaded, Cache-Control: no-store, /api/save-cards, Port 8081."""
import http.server
import socketserver
import json
import os

CARDS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'js', 'data', 'cards.js')

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):

    def do_POST(self):
        if self.path == '/api/save-cards':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(length)
                data = json.loads(body)
                content = data.get('content', '')

                if not content:
                    self._json_response(400, {'ok': False, 'error': 'Kein Inhalt'})
                    return

                with open(CARDS_PATH, 'w', encoding='utf-8') as f:
                    f.write(content)

                print(f"[API] cards.js gespeichert ({len(content)} Bytes)")
                self._json_response(200, {'ok': True, 'written': len(content)})
            except Exception as e:
                print(f"[API] Fehler: {e}")
                self._json_response(500, {'ok': False, 'error': str(e)})
        else:
            self._json_response(404, {'ok': False, 'error': 'Unbekannter Endpunkt'})

    def _json_response(self, code, data):
        body = json.dumps(data).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        super().end_headers()

    def log_message(self, format, *args):
        if len(args) > 1 and isinstance(args[1], str) and args[1].startswith('2'):
            return
        super().log_message(format, *args)

class ThreadedServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True

print("Kopfnuss! Dev-Server auf http://localhost:8081 (multi-threaded, no-cache, API)")
ThreadedServer(('', 8081), NoCacheHandler).serve_forever()
