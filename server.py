"""
Digital Smartbox -- Entwicklungsserver (Multi-Threaded)

- Verarbeitet mehrere Browser-Anfragen gleichzeitig (kein ConnectionAbortedError mehr)
- Setzt Cache-Control: no-store auf jede Antwort (kein Browser-Cache)
"""
import os
from http.server import SimpleHTTPRequestHandler
from socketserver import ThreadingTCPServer

PORT = 8080

class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        # Nur erfolgreiche Requests loggen, Fehler unterdruecken
        try:
            super().log_message(format, *args)
        except Exception:
            pass

    def handle(self):
        try:
            super().handle()
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
            pass  # Browser hat Verbindung geschlossen -- normal bei vielen parallelen Requests

class ThreadedServer(ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server = ThreadedServer(('', PORT), NoCacheHandler)
    print(f'Server laeuft auf http://localhost:{PORT}')
    print('Strg+C zum Beenden')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServer beendet.')
        server.shutdown()
