"""
Kopfnuss! -- Entwicklungsserver

- Multi-Threaded (kein ConnectionAbortedError)
- Cache-Control: no-store (kein Browser-Cache)
- POST /api/save-cards: Schreibt cards.js + git commit/push
"""
import os
import json
import subprocess
import threading
from http.server import SimpleHTTPRequestHandler
from socketserver import ThreadingTCPServer

PORT = 8081
ROOT = os.path.dirname(os.path.abspath(__file__))
CARDS_PATH = os.path.join(ROOT, 'js', 'data', 'cards.js')


class KopfnussHandler(SimpleHTTPRequestHandler):

    def do_POST(self):
        if self.path == '/api/save-cards':
            self._handle_save_cards()
        else:
            self.send_error(404, 'Not Found')

    def _handle_save_cards(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            data = json.loads(body.decode('utf-8'))

            js_content = data.get('content', '')
            if not js_content:
                self._json_response(400, {'ok': False, 'error': 'Kein Inhalt'})
                return

            # cards.js schreiben
            with open(CARDS_PATH, 'w', encoding='utf-8') as f:
                f.write(js_content)

            card_count = js_content.count('"prompt"')
            print(f'[API] cards.js gespeichert ({card_count} Karten)')

            # Git commit + push im Hintergrund
            threading.Thread(target=_git_sync, daemon=True).start()

            self._json_response(200, {
                'ok': True,
                'message': f'cards.js gespeichert ({card_count} Karten). Git-Sync laeuft...'
            })

        except Exception as e:
            print(f'[API] Fehler: {e}')
            self._json_response(500, {'ok': False, 'error': str(e)})

    def _json_response(self, code, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        try:
            super().log_message(format, *args)
        except Exception:
            pass

    def handle(self):
        try:
            super().handle()
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
            pass


def _git_sync():
    """Git add + commit + push im Hintergrund."""
    try:
        subprocess.run(
            ['git', 'add', 'js/data/cards.js'],
            cwd=ROOT, capture_output=True, text=True, timeout=10
        )

        result = subprocess.run(
            ['git', 'commit', '-m', 'Kartenset aktualisiert (Auto-Sync)'],
            cwd=ROOT, capture_output=True, text=True, timeout=10
        )

        if result.returncode == 0:
            print('[Git] Commit erfolgreich')
            push = subprocess.run(
                ['git', 'push'],
                cwd=ROOT, capture_output=True, text=True, timeout=30
            )
            if push.returncode == 0:
                print('[Git] Push erfolgreich -- iPad kann synchronisieren')
            else:
                print(f'[Git] Push fehlgeschlagen: {push.stderr.strip()}')
        else:
            msg = result.stdout.strip() or result.stderr.strip()
            if 'nothing to commit' in msg:
                print('[Git] Keine Aenderungen zum Committen')
            else:
                print(f'[Git] Commit fehlgeschlagen: {msg}')

    except Exception as e:
        print(f'[Git] Fehler: {e}')


class ThreadedServer(ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == '__main__':
    os.chdir(ROOT)
    server = ThreadedServer(('', PORT), KopfnussHandler)
    print(f'Kopfnuss! Server laeuft auf http://localhost:{PORT}')
    print(f'API-Endpunkt: POST /api/save-cards')
    print('Strg+C zum Beenden')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServer beendet.')
        server.shutdown()
