#!/usr/bin/env python3
"""
Deimos Messenger Server
========================
A simple HTTP message relay server for the WiFi Pico Messenger app.

Usage:
    python server.py                    # start on default port 8080
    python server.py --port 9090        # custom port
    python server.py --host 0.0.0.0     # listen on all interfaces

Messages are stored in memory and served via HTTP GET/POST.
Two Pico devices (or a Pico and curl) can exchange messages
through this server.

Endpoints:
    GET  /api/messages?user=<name>&from=<contact>
        Retrieve pending messages for <user> from <contact>.
        Returns one message per line. After reading, messages
        are marked as delivered and removed from the queue.

    POST /api/send  (body: {"to":"name","from":"name","text":"hello"})
        Queue a message for delivery.

    GET /api/contacts
        List all users who have sent or received messages.

    GET /
        Simple status page.

Requirements:
    Python 3.7+ (no external dependencies)
"""

import http.server
import json
import argparse
import time
from urllib.parse import urlparse, parse_qs

# ─── message store ────────────────────────────────────
# Structure: { "recipient": [ {"from": str, "text": str, "ts": float}, ... ] }
mailbox = {}


def queue_message(to_user, from_user, text):
    """Add a message to a user's mailbox."""
    if to_user not in mailbox:
        mailbox[to_user] = []
    mailbox[to_user].append({
        "from": from_user,
        "text": text,
        "ts": time.time(),
    })
    # keep mailbox size reasonable
    if len(mailbox[to_user]) > 100:
        mailbox[to_user] = mailbox[to_user][-100:]


def fetch_messages(user, from_contact):
    """Get and remove pending messages for user from a specific contact."""
    key = user
    if key not in mailbox:
        return []

    msgs = []
    remaining = []
    for m in mailbox[key]:
        if m["from"] == from_contact:
            msgs.append(m)
        else:
            remaining.append(m)

    mailbox[key] = remaining
    return msgs


def get_contacts():
    """Get all known users."""
    users = set()
    for recipient, msgs in mailbox.items():
        users.add(recipient)
        for m in msgs:
            users.add(m["from"])
    return sorted(users)


# ─── HTTP handler ─────────────────────────────────────
class MessengerHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # quiet logging
        print(f"[SERVER] {args[0]}")

    def _send(self, code, body, content_type="text/plain"):
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Connection", "close")
        self.end_headers()
        self.wfile.write(body.encode() if isinstance(body, str) else body)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        params = parse_qs(parsed.query)

        if path == "/" or path == "/api":
            users = get_contacts()
            status = "online" if users else "waiting for connections"
            body = (
                "Deimos Messenger Server\n"
                "========================\n\n"
                f"Status: {status}\n"
                f"Known users: {len(users)}\n"
                f"Pending messages: {sum(len(v) for v in mailbox.values())}\n"
            )
            if users:
                body += f"\nUsers: {', '.join(users)}\n"
            self._send(200, body)
            return

        if path == "/api/contacts":
            users = get_contacts()
            self._send(200, "\n".join(users))
            return

        if path == "/api/messages":
            user = params.get("user", [None])[0]
            from_contact = params.get("from", [None])[0]

            if not user or not from_contact:
                self._send(400, "Missing user or from parameter")
                return

            msgs = fetch_messages(user, from_contact)
            if not msgs:
                self._send(200, "")
                return

            # return as newline-delimited JSON
            lines = []
            for m in msgs:
                lines.append(json.dumps({
                    "from": m["from"],
                    "text": m["text"],
                    "ts": m["ts"],
                }))
            self._send(200, "\n".join(lines))
            return

        self._send(404, "Not found")

    def do_POST(self):
        parsed = urlparse(self.path)

        if parsed.path == "/api/send":
            content_len = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_len)

            try:
                data = json.loads(body)
            except json.JSONDecodeError:
                self._send(400, "Invalid JSON")
                return

            to_user = data.get("to")
            from_user = data.get("from")
            text = data.get("text", "")

            if not to_user or not from_user:
                self._send(400, "Missing to or from")
                return

            if not text:
                self._send(400, "Empty message")
                return

            queue_message(to_user, from_user, text)
            print(f"[MSG] {from_user} -> {to_user}: {text}")
            self._send(200, "OK")
            return

        self._send(404, "Not found")


# ─── main ─────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Deimos Messenger Server")
    parser.add_argument("--host", default="0.0.0.0", help="Bind address (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8080, help="Port (default: 8080)")
    args = parser.parse_args()

    server = http.server.HTTPServer((args.host, args.port), MessengerHandler)
    print(f"╔══════════════════════════════════════╗")
    print(f"║   Deimos Messenger Server v1.0       ║")
    print(f"║   Listening on {args.host}:{args.port:<14}║")
    print(f"╠══════════════════════════════════════╣")
    print(f"║   GET  /api/messages?user=X&from=Y  ║")
    print(f"║   POST /api/send                     ║")
    print(f"║   GET  /api/contacts                 ║")
    print(f"╚══════════════════════════════════════╝")
    print(f"\nWaiting for connections...\n")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        server.server_close()


if __name__ == "__main__":
    main()