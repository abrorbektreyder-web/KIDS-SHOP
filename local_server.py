from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class KidsShopHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        if path.startswith("/images/"):
            path = "/public" + path
        return super().translate_path(path)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 4173), KidsShopHandler)
    print("KIDS-SHOP: http://127.0.0.1:4173", flush=True)
    print("Stop with Ctrl+C.", flush=True)
    server.serve_forever()
