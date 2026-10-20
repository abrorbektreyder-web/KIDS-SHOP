from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class KidsShopHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(Path(__file__).parent / "public"), **kwargs)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 4173), KidsShopHandler)
    print("KIDS-SHOP: http://127.0.0.1:4173", flush=True)
    print("Stop with Ctrl+C.", flush=True)
    server.serve_forever()
