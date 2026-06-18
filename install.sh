#!/usr/bin/env bash
# Instala o Claude Usage Indicator (GNOME 42).
# Roda o tracker, que lê teu token OAuth de ~/.claude/.credentials.json e bate no
# endpoint da PRÓPRIA Anthropic (/api/oauth/usage). É o teu token; nada vai pra terceiros.
set -e
SRC="$(cd "$(dirname "$0")" && pwd)"

EXT_DIR="$HOME/.local/share/gnome-shell/extensions/claude-usage@local"
DATA_DIR="$HOME/.local/share/claude-usage"
UNIT_DIR="$HOME/.config/systemd/user"

echo "1/4 — copiando arquivos…"
mkdir -p "$EXT_DIR" "$DATA_DIR" "$UNIT_DIR"
install -m 644 "$SRC/tracker.py"               "$DATA_DIR/tracker.py"
install -m 644 "$SRC/extension/metadata.json"  "$EXT_DIR/metadata.json"
install -m 644 "$SRC/extension/extension.js"   "$EXT_DIR/extension.js"
install -m 644 "$SRC/systemd/claude-usage.service" "$UNIT_DIR/claude-usage.service"
install -m 644 "$SRC/systemd/claude-usage.timer"   "$UNIT_DIR/claude-usage.timer"

echo "2/4 — timer do systemd (busca o uso a cada 2 min)…"
systemctl --user daemon-reload
systemctl --user enable --now claude-usage.timer

echo "3/4 — primeira busca agora (popula usage.json)…"
systemctl --user start claude-usage.service || true
sleep 2
python3 "$DATA_DIR/tracker.py" --print || true

echo "4/4 — ligando a extensão…"
gnome-extensions enable claude-usage@local 2>/dev/null || \
  echo "   (vai aparecer após o logout/login — então rode 'gnome-extensions enable claude-usage@local')"

echo
echo ">> WAYLAND: faça LOGOUT/LOGIN pra extensão aparecer na barra do topo."
echo ">> (X11: Alt+F2, digite 'r', Enter)"
