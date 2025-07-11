#!/usr/bin/env python3
import http.server
import socketserver
import os

PORT = 8000

# Change to the script's directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

Handler = http.server.SimpleHTTPRequestHandler

print(f"\n🎮 Meow Mi Game Server")
print(f"=" * 40)
print(f"Server running at: http://localhost:{PORT}")
print(f"\nOpen your browser and go to:")
print(f"  → http://localhost:{PORT}")
print(f"\nPress Ctrl+C to stop the server")
print(f"=" * 40 + "\n")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServer stopped.")