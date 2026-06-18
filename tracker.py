#!/usr/bin/env python3
"""Claude Usage Tracker — mínimo e auditável (escrito p/ o Mikael, 17/06/2026).

Lê o token OAuth que o Claude Code já guarda em ~/.claude/.credentials.json e consulta
o uso na PRÓPRIA Anthropic (GET https://api.anthropic.com/api/oauth/usage — o mesmo
endpoint que o comando /usage usa). Grava ~/.local/share/claude-usage/usage.json.
NÃO envia nada pra terceiros: é o teu token batendo no servidor da Anthropic.

Uso:
  python3 tracker.py            # busca e grava usage.json
  python3 tracker.py --print    # idem + imprime no terminal
"""
import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone

HOME = os.path.expanduser("~")
CREDS = os.path.join(HOME, ".claude", ".credentials.json")
OUT_DIR = os.path.join(HOME, ".local", "share", "claude-usage")
OUT = os.path.join(OUT_DIR, "usage.json")
API = "https://api.anthropic.com/api/oauth/usage"


def token():
    with open(CREDS, encoding="utf-8") as f:
        oauth = json.load(f).get("claudeAiOauth", {})
    return oauth.get("accessToken", ""), oauth.get("subscriptionType", "unknown")


def fetch(tok):
    req = urllib.request.Request(API, headers={
        "Authorization": "Bearer {}".format(tok),
        "Content-Type": "application/json",
        "User-Agent": "claude-code/2.1.161",
    })
    with urllib.request.urlopen(req, timeout=8) as r:
        return json.loads(r.read().decode())


def win(data, key):
    b = (data or {}).get(key) or {}
    return {"pct": b.get("utilization"), "reset_at": b.get("resets_at")}


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    now = datetime.now(timezone.utc).isoformat()
    try:
        tok, plan = token()
        data = fetch(tok)
        summary = {
            "generated_at": now, "ok": True, "plan": plan,
            "session": win(data, "five_hour"),
            "week": win(data, "seven_day"),
            "week_opus": win(data, "seven_day_opus"),
        }
    except Exception as e:
        # preserva o último usage.json (mostra dado antigo em vez de sumir)
        summary = {"generated_at": now, "ok": False, "error": str(e)}
        if os.path.exists(OUT):
            try:
                old = json.load(open(OUT))
                for k in ("session", "week", "week_opus", "plan"):
                    if k in old:
                        summary[k] = old[k]
            except Exception:
                pass
    tmp = OUT + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False)
    os.replace(tmp, OUT)

    if "--print" in sys.argv:
        def pct(w):
            return "—" if not w or w.get("pct") is None else "{:.0f}%".format(w["pct"])
        print("Sessão {} · Semana {} · {}".format(
            pct(summary.get("session")), pct(summary.get("week")),
            "ok" if summary.get("ok") else "erro: " + summary.get("error", "")))


if __name__ == "__main__":
    main()
