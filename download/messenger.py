# standard imports
from cwio import *
from cwio.const import *
import ui
import wifi
from wifi import wlan
import os
import time
import fs
import garbage

# additional imports (wifi networking)
if wifi.support:
    import socket
    import ure as re

# metadata
name = "Messenger"
requires = ["wifi"]

# ─── custom T9 input (calculator layout) ──────────────
# The firmware's ui.ask() uses phone-style T9 mapping which
# doesn't match the calculator's physical key layout:
#   Phone:  1 2 3    Calculator:  7 8 9
#           4 5 6                4 5 6
#           7 8 9                1 2 3
#             0                    0
# So we remap T9 letters to match calculator positions.
# Key 3 and 9 get extra symbols since they have no phone equivalent.
_CALC_KEYPAD = {
    "7": ["a", "b", "c"],
    "8": ["d", "e", "f"],
    "9": ["g", "h", "i"],
    "4": ["j", "k", "l"],
    "5": ["m", "n", "o"],
    "6": ["p", "q", "r", "s"],
    "1": ["t", "u", "v"],
    "2": ["w", "x", "y", "z"],
    "0": [" "],
}

def ask_calc(msg=None, default="", allow_dot=False, allow_hyphen=False):
    """Custom text input with calculator-layout T9 support.

    Works like ui.ask() but with correct T9 mapping for the
    calculator keyboard. Also optionally allows DOT and hyphen keys.
    """
    buf = default
    shift = False
    while True:
        screen.clear()
        if msg:
            screen.write(msg, 0, 0, SCR.COLOR.BLACK, font.miniwi)
        screen.write(buf + "|", 0, (8 if msg else 0), SCR.COLOR.BLACK, font.miniwi)
        screen.apply()
        while keyboard.pressed_any():
            pass
        key = keyboard.get_next()
        if key == KB.KEY.SHIFT:
            shift = not shift
        elif key == KB.KEY.FORMAT and len(buf):
            last = buf[-1]
            if last.isdigit():
                count = 0
                for c in reversed(buf):
                    if c != last:
                        break
                    count += 1
                if last in _CALC_KEYPAD:
                    letters = _CALC_KEYPAD[last]
                    if count <= len(letters):
                        letter = letters[count - 1]
                        if shift:
                            shift = False
                            letter = letter.upper()
                        buf = buf[:-count] + letter
        elif shift:
            shift = False
            if key == KB.KEY.SUBTRACT:
                buf += "_"
        else:
            if key == KB.KEY.EXE:
                return buf
            elif key == KB.KEY.AC:
                buf = ""
            elif key == KB.KEY.BKSPACE:
                buf = buf[:-1]
            elif key == KB.KEY.N0:
                buf += "0"
            elif key == KB.KEY.N1:
                buf += "1"
            elif key == KB.KEY.N2:
                buf += "2"
            elif key == KB.KEY.N3:
                buf += "3"
            elif key == KB.KEY.N4:
                buf += "4"
            elif key == KB.KEY.N5:
                buf += "5"
            elif key == KB.KEY.N6:
                buf += "6"
            elif key == KB.KEY.N7:
                buf += "7"
            elif key == KB.KEY.N8:
                buf += "8"
            elif key == KB.KEY.N9:
                buf += "9"
            elif key == KB.KEY.DIVIDE:
                buf += "/"
            elif allow_dot and key == KB.KEY.DOT:
                buf += "."
            elif allow_hyphen and key == KB.KEY.SUBTRACT:
                buf += "-"


# ─── constants ──────────────────────────────────────────
DIR = "/conf/messenger"
CONTACTS_FILE = DIR + "/contacts.txt"
USER_FILE = DIR + "/user.txt"
SERVER_FILE = DIR + "/server.txt"
FONT_SM = font.miniwi
FONT_LG = font.classwiz_cw
SCR_W = SCR.WIDTH   # 192
SCR_H = SCR.HEIGHT  # 63
MSG_PAGE = 7        # lines of messages visible
CHARS_PER_LINE_SM = SCR_W // FONT_SM().w   # 48
CHARS_PER_LINE_LG = SCR_W // FONT_LG().w   # ~17
MAX_MSG_LEN = 120
SERVER_PORT = 80
DEFAULT_SERVER = "192.168.1.100"
DEFAULT_USER = "pico"


# ─── storage helpers ────────────────────────────────────
def ensure_dir():
    if not fs.exists(DIR):
        fs.mkdirs(DIR)


def read_lines(path):
    if not fs.exists(path):
        return []
    with open(path, "r") as f:
        return f.read().strip("\n").split("\n")


def write_lines(path, lines):
    with open(path, "w") as f:
        f.write("\n".join(lines))


def msg_path(contact):
    safe = contact.replace("/", "_").replace("\\", "_")
    return DIR + "/msg_" + safe + ".txt"


# ─── config ─────────────────────────────────────────────
def get_user():
    ensure_dir()
    lines = read_lines(USER_FILE)
    return lines[0] if lines else DEFAULT_USER


def set_user(u):
    ensure_dir()
    write_lines(USER_FILE, [u])


def get_server_ip():
    ensure_dir()
    lines = read_lines(SERVER_FILE)
    return lines[0] if lines else DEFAULT_SERVER


def set_server_ip(s):
    ensure_dir()
    write_lines(SERVER_FILE, [s])


def get_server():
    ip = get_server_ip()
    # domains auto-use HTTPS:443, no port needed
    has_letter = False
    for c in ip:
        if c.isalpha():
            has_letter = True
            break
    if has_letter:
        return ip
    return ip + ":" + str(SERVER_PORT)


def set_server(s):
    set_server_ip(s)


# ─── contacts ───────────────────────────────────────────
def get_contacts():
    ensure_dir()
    lines = read_lines(CONTACTS_FILE)
    contacts = []
    for line in lines:
        if not line:
            continue
        parts = line.split("|", 1)
        contacts.append(parts[0])
    return contacts


def add_contact(name):
    contacts = get_contacts()
    if name and name not in contacts:
        contacts.append(name)
        write_lines(CONTACTS_FILE, contacts)


def remove_contact(name):
    contacts = get_contacts()
    if name in contacts:
        contacts.remove(name)
        write_lines(CONTACTS_FILE, contacts)


# ─── messages ───────────────────────────────────────────
def get_messages(contact):
    path = msg_path(contact)
    lines = read_lines(path)
    msgs = []
    for line in lines:
        if not line:
            continue
        # format: SENDER|TIMESTAMP|TEXT
        # sender: ">" = from them, "<" = from me
        parts = line.split("|", 2)
        if len(parts) == 3:
            msgs.append({"dir": parts[0], "ts": parts[1], "text": parts[2]})
    return msgs


def add_message(contact, direction, text):
    # direction: "<" for sent, ">" for received
    path = msg_path(contact)
    ts = str(time.time())
    lines = read_lines(path)
    lines.append(direction + "|" + ts + "|" + text)
    # keep last 50 messages
    if len(lines) > 50:
        lines = lines[-50:]
    write_lines(path, lines)


def get_last_msg(contact):
    msgs = get_messages(contact)
    if msgs:
        return msgs[-1]["text"][:20]
    return "(no messages)"


def fmt_time(ts):
    try:
        t = int(float(ts))
        now = int(time.time())
        diff = now - t
        if diff < 60:
            return "now"
        elif diff < 3600:
            return str(diff // 60) + "m"
        elif diff < 86400:
            return str(diff // 3600) + "h"
        else:
            d = time.localtime(t)
            return str(d[2]) + "/" + str(d[1])
    except:
        return ""


def wrap_text(text, max_chars):
    """Wrap text to fit within max_chars per line."""
    lines = []
    while len(text) > max_chars:
        # find a good break point
        idx = max_chars
        # try to break at space
        sp = text[:idx].rfind(" ")
        if sp > max_chars // 2:
            idx = sp + 1
        lines.append(text[:idx])
        text = text[idx:]
    if text:
        lines.append(text)
    return lines


# ─── network ────────────────────────────────────────────
def _is_domain(addr):
    """Check if address is a domain name (not an IP)."""
    if not addr:
        return False
    for c in addr:
        if c.isalpha():
            return True
    return False


def send_http(method, url, data=None):
    """Send HTTP/HTTPS request using raw sockets."""
    if not wifi.support or not wlan.isconnected():
        return None

    garbage.collect()

    try:
        use_ssl = False

        # parse url
        if url.startswith("https://"):
            url = url[8:]
            use_ssl = True
        elif url.startswith("http://"):
            url = url[7:]

        slash = url.find("/")
        if slash == -1:
            host_port = url
            path = "/"
        else:
            host_port = url[:slash]
            path = url[slash:]

        if ":" in host_port:
            host, port_str = host_port.rsplit(":", 1)
            port = int(port_str)
        else:
            host = host_port
            # auto-detect: domains use HTTPS/443, IPs use HTTP/80
            if _is_domain(host):
                port = 443
                use_ssl = True
            else:
                port = 80

        addr = socket.getaddrinfo(host, port)[0][-1]
        s = socket.socket()
        s.connect(addr)
        s.settimeout(8)

        # wrap with SSL if needed
        if use_ssl:
            import ssl
            ctx = ssl.create_default_context()
            s = ctx.wrap_socket(s, server_hostname=host)

        user = get_user()
        rq = method + " " + path + " HTTP/1.0\r\n"
        rq += "Host: " + host + "\r\n"
        rq += "User-Agent: DeimosMessenger/1.0\r\n"
        rq += "Connection: close\r\n"

        if data:
            body = data.encode()
            rq += "Content-Type: application/json\r\n"
            rq += "Content-Length: " + str(len(body)) + "\r\n"
            rq += "\r\n"
            s.send(rq.encode())
            s.send(body)
        else:
            rq += "\r\n"
            s.send(rq.encode())

        # read response
        resp = b""
        while True:
            chunk = s.recv(256)
            if not chunk:
                break
            resp += chunk
        s.close()

        # parse response - skip headers
        body_start = resp.find(b"\r\n\r\n")
        if body_start >= 0:
            return resp[body_start + 4:].decode("utf-8", errors="replace")
        return None

    except Exception as e:
        print("[MSG] Net error: " + str(e))
        return None


def fetch_messages(contact):
    """Fetch new messages from server for a contact."""
    ip = get_server_ip()
    user = get_user()
    url = ip + ":" + str(SERVER_PORT) + "/api/messages?user=" + user + "&from=" + contact
    body = send_http("GET", url)
    if not body:
        return 0

    count = 0
    try:
        # parse simple newline-delimited JSON or plain text
        for line in body.strip().split("\n"):
            line = line.strip()
            if not line:
                continue
            # try json
            if line.startswith("{"):
                import ujson as json
                obj = json.loads(line)
                text = obj.get("text", obj.get("msg", ""))
                ts = obj.get("ts", str(time.time()))
            else:
                text = line
                ts = str(time.time())

            if text:
                add_message(contact, ">", text)
                count += 1
    except:
        # fallback: treat whole body as one message
        if body.strip():
            add_message(contact, ">", body.strip()[:MAX_MSG_LEN])
            count = 1

    return count


def push_message(contact, text):
    """Send a message to the server."""
    ip = get_server_ip()
    user = get_user()
    url = ip + ":" + str(SERVER_PORT) + "/api/send"
    data = '{"to":"' + contact + '","from":"' + user + '","text":"' + text + '"}'
    result = send_http("POST", url, data)
    return result is not None


# ─── drawing helpers ────────────────────────────────────
def draw_header(text):
    screen.line_h(0, 10, SCR_W, SCR.COLOR.DARK)
    screen.write(text, 0, 0, SCR.COLOR.BLACK, FONT_SM)


def draw_footer(text=""):
    screen.line_h(0, SCR_H - 9, SCR_W, SCR.COLOR.DARK)
    if text:
        screen.write(text, 2, SCR_H - 8, SCR.COLOR.DARK, FONT_SM)


def trunc(s, n):
    if len(s) > n:
        return s[:n - 1] + "~"
    return s


# ─── views ──────────────────────────────────────────────
def view_contacts():
    """Show list of conversations."""
    contacts = get_contacts()
    refresh = True
    sel = 0
    page = 0
    oldpage = None
    PER_PAGE = 5

    while True:
        if not contacts:
            contacts = get_contacts()

        page = sel // PER_PAGE
        if oldpage != page:
            refresh = True
            oldpage = page

        if refresh:
            refresh = False
            screen.clear()
            draw_header("MESSAGES")
            curr = contacts[page * PER_PAGE:(page + 1) * PER_PAGE]
            fy = 12
            for i, c in enumerate(curr):
                cy = fy + i * 10
                # highlight selected
                if i == sel % PER_PAGE:
                    screen.rect(0, cy, SCR_W, 10, SCR.COLOR.BRIGHT)
                # contact name
                screen.write(trunc(c, 14), 2, cy + 1, SCR.COLOR.BLACK, FONT_SM)
                # last message preview
                last = trunc(get_last_msg(c), 22)
                msgs = get_messages(c)
                # show last message time
                if msgs:
                    ts_str = fmt_time(msgs[-1]["ts"])
                    ts_x = SCR_W - (len(ts_str) * 4) - 2
                    screen.write(ts_str, ts_x, cy + 1, SCR.COLOR.DARK, FONT_SM)
                msg_y = cy + 5
                if msg_y < SCR_H - 12:
                    screen.write(last, 2, msg_y, SCR.COLOR.DARK, FONT_SM)

            # page indicator
            total_pages = max(1, (len(contacts) + PER_PAGE - 1) // PER_PAGE)
            if total_pages > 1:
                pg_text = str(page + 1) + "/" + str(total_pages)
                screen.write(pg_text, SCR_W - (len(pg_text) * 4) - 2, 2, SCR.COLOR.DARK, FONT_SM)

            draw_footer("HOME:menu  OK:open  SHIFT+OK:new")

        # highlight
        for i in range(len(contacts[page * PER_PAGE:(page + 1) * PER_PAGE])):
            cy = 12 + i * 10
            if i == sel % PER_PAGE:
                screen.rect(0, cy, SCR_W, 10, SCR.COLOR.BRIGHT)
            else:
                screen.rect(0, cy, SCR_W, 10, SCR.COLOR.WHITE)

        screen.apply()

        while keyboard.pressed(KB.KEY.OK):
            pass

        key = keyboard.get_next()

        if key == KB.KEY.UP:
            if sel > 0:
                sel -= 1
                refresh = True
        elif key == KB.KEY.DOWN:
            if sel < len(contacts) - 1:
                sel += 1
                refresh = True
        elif key == KB.KEY.PG_UP:
            sel = max(0, sel - PER_PAGE)
            refresh = True
        elif key == KB.KEY.PG_DOWN:
            sel = min(len(contacts) - 1, sel + PER_PAGE)
            refresh = True
        elif key == KB.KEY.OK:
            if keyboard.pressed(KB.KEY.SHIFT):
                # new contact
                name = ask_calc("Contact name:")
                if name:
                    add_contact(name)
                    contacts = get_contacts()
                    sel = contacts.index(name)
                    refresh = True
            else:
                if contacts:
                    view_chat(contacts[sel])
                    refresh = True
                    contacts = get_contacts()
                    if sel >= len(contacts):
                        sel = max(0, len(contacts) - 1)
        elif key == KB.KEY.BACK:
            return
        elif key == KB.KEY.HOME:
            c = ui.choose(["New contact", "Settings", "Fetch all", "About"])
            if c == 0:
                name = ask_calc("Contact name:")
                if name:
                    add_contact(name)
                    contacts = get_contacts()
                    sel = contacts.index(name)
                    refresh = True
            elif c == 1:
                view_settings()
                refresh = True
            elif c == 2:
                fetch_all()
                refresh = True
            elif c == 3:
                ui.notify("Messenger v1.0", "WiFi Pico messaging app\nfor Deimos firmware.\n\nUses HTTP for message\ntransport over LAN.", None)
                refresh = True
            elif c == -1:
                refresh = True


def view_chat(contact):
    """View and send messages with a contact."""
    msgs = get_messages(contact)
    scroll = max(0, len(msgs) - MSG_PAGE)
    oldscroll = None

    while True:
        msgs = get_messages(contact)
        total = len(msgs)
        max_scroll = max(0, total - MSG_PAGE)
        if scroll > max_scroll:
            scroll = max_scroll

        # only redraw if scroll changed
        if scroll != oldscroll:
            oldscroll = scroll
            screen.clear()
            draw_header(trunc(contact, 24))

            # draw visible messages
            visible = msgs[scroll:scroll + MSG_PAGE]
            cy = 12
            for m in visible:
                prefix = m["dir"]
                text = m["text"]

                if cy >= SCR_H - 18:
                    break

                # wrap long messages
                wrapped = wrap_text(text, CHARS_PER_LINE_SM - 6)

                for j, line in enumerate(wrapped):
                    if cy >= SCR_H - 18:
                        break
                    if j == 0:
                        # first line: show sender indicator
                        indicator = "> " if prefix == ">" else "< "
                        screen.write(indicator, 0, cy, SCR.COLOR.DARK, FONT_SM)
                        screen.write(line, 8, cy, SCR.COLOR.BLACK, FONT_SM)
                    else:
                        # continuation line
                        screen.write("  " + line, 8, cy, SCR.COLOR.BLACK, FONT_SM)
                    cy += 8

                cy += 1  # gap between messages

            # scroll indicator
            if total > MSG_PAGE:
                pct = scroll / max(1, max_scroll)
                bar_h = max(4, (MSG_PAGE * 8 * (MSG_PAGE / total)))
                bar_y = 12 + int(pct * (SCR_H - 30 - 12))
                screen.rect(SCR_W - 2, bar_y, 2, int(bar_h), SCR.COLOR.DARK)

            draw_footer("OK:send  BACK:exit  UP/DN:scroll")
            screen.apply()

        # wait for input
        while keyboard.pressed_any():
            pass
        key = keyboard.get_next()

        if key == KB.KEY.BACK:
            return
        elif key == KB.KEY.UP:
            if scroll > 0:
                scroll -= 1
        elif key == KB.KEY.DOWN:
            if scroll < max_scroll:
                scroll += 1
        elif key == KB.KEY.PG_UP:
            scroll = max(0, scroll - MSG_PAGE)
        elif key == KB.KEY.PG_DOWN:
            scroll = min(max_scroll, scroll + MSG_PAGE)
        elif key == KB.KEY.OK:
            # compose message
            text = ask_calc("Message:")
            if text and len(text) > 0:
                # save locally
                add_message(contact, "<", text)
                oldscroll = None  # force redraw

                # try to send over network
                screen.clear()
                draw_header("SENDING...")
                screen.apply()
                ok = push_message(contact, text)
                if ok:
                    screen.write("sent!", 0, 20, SCR.COLOR.BLACK, FONT_SM)
                else:
                    screen.write("saved locally", 0, 20, SCR.COLOR.DARK, FONT_SM)
                    screen.write("(not delivered)", 0, 28, SCR.COLOR.DARK, FONT_SM)
                screen.apply()
                time.sleep(0.5)

                scroll = max(0, len(get_messages(contact)) - MSG_PAGE)
                oldscroll = None
        elif key == KB.KEY.HOME:
            c = ui.choose(["Fetch new", "Delete chat", "Contact info"])
            if c == 0:
                screen.clear()
                draw_header("FETCHING...")
                screen.apply()
                count = fetch_messages(contact)
                if count > 0:
                    screen.write(str(count) + " new msg(s)", 0, 20, SCR.COLOR.BLACK, FONT_SM)
                else:
                    screen.write("no new messages", 0, 20, SCR.COLOR.DARK, FONT_SM)
                screen.apply()
                time.sleep(1)
                oldscroll = None
            elif c == 1:
                c2 = ui.choose(["Yes", "No"])
                if c2 == 0:
                    path = msg_path(contact)
                    if fs.exists(path):
                        os.remove(path)
                    remove_contact(contact)
                    return
            elif c == 2:
                msgs = get_messages(contact)
                info = "Contact: " + contact + "\n"
                info += "Messages: " + str(len(msgs)) + "\n"
                if msgs:
                    info += "Last: " + fmt_time(msgs[-1]["ts"])
                ui.notify("Info", info)
                oldscroll = None


def view_settings():
    """Messenger settings screen."""
    while True:
        server = get_server()
        user = get_user()

        # show current settings
        screen.clear()
        draw_header("SETTINGS")

        y = 14
        screen.write("User: " + trunc(user, 20), 0, y, SCR.COLOR.BLACK, FONT_SM)
        y += 10
        screen.write("Server IP:", 0, y, SCR.COLOR.BLACK, FONT_SM)
        y += 8
        ip = get_server_ip()
        screen.write(ip, 4, y, SCR.COLOR.DARK, FONT_SM)
        y += 8
        # show protocol info
        if _is_domain(ip):
            screen.write("HTTPS:443 (auto)", 0, y, SCR.COLOR.DARK, FONT_SM)
        else:
            screen.write("Port: " + str(SERVER_PORT), 0, y, SCR.COLOR.DARK, FONT_SM)

        # wifi status
        y += 4
        if wifi.support:
            if wlan.isconnected():
                ip = wlan.ifconfig()[0]
                screen.write("WiFi: " + ip, 0, y, SCR.COLOR.BLACK, FONT_SM)
            else:
                screen.write("WiFi: not connected", 0, y, SCR.COLOR.DARK, FONT_SM)
        else:
            screen.write("WiFi: not supported", 0, y, SCR.COLOR.DARK, FONT_SM)

        screen.apply()

        c = ui.choose(["Set username", "Set server IP", "Connect WiFi", "Back"])
        if c == 0:
            u = ask_calc("Username:", user)
            if u:
                set_user(u)
        elif c == 1:
            s = ask_calc("Server IP:", ip, allow_dot=True, allow_hyphen=True)
            if s:
                set_server_ip(s)
        elif c == 2:
            if wifi.support:
                if wifi.choose_connect():
                    pass  # connected
            else:
                ui.notify("No WiFi", "WiFi not supported on\nthis device.", None)
        elif c == -1 or c == 3:
            return


def fetch_all():
    """Fetch new messages from all contacts."""
    if not wifi.support or not wlan.isconnected():
        ui.notify("No connection", "Connect to WiFi first.", None)
        return

    contacts = get_contacts()
    if not contacts:
        ui.notify("No contacts", "Add a contact first.", None)
        return

    screen.clear()
    draw_header("FETCHING ALL")
    screen.apply()

    total = 0
    for i, c in enumerate(contacts):
        screen.write(".", i * 4, 20, SCR.COLOR.BLACK, FONT_SM)
        screen.apply()
        count = fetch_messages(c)
        total += count

    screen.clear()
    draw_header("DONE")
    screen.write(str(total) + " new message(s)", 0, 20, SCR.COLOR.BLACK, FONT_SM)
    screen.apply()
    time.sleep(1)


# ─── main ───────────────────────────────────────────────
def main():
    if not wifi.support:
        ui.notify("No WiFi", "Messenger requires a\nWiFi-enabled device.", None)
        return

    # ensure wifi is active
    wlan.active(True)

    # ensure data directory
    ensure_dir()

    # create default config if missing
    if not fs.exists(USER_FILE):
        set_user(DEFAULT_USER)
    if not fs.exists(SERVER_FILE):
        set_server(DEFAULT_SERVER)
    if not fs.exists(CONTACTS_FILE):
        write_lines(CONTACTS_FILE, [])

    # check wifi and offer to connect
    if not wlan.isconnected():
        c = ui.choose(["Connect to WiFi", "Continue offline"])
        if c == 0:
            wifi.choose_connect()
        elif c == -1:
            return

    # enter main contacts view
    view_contacts()