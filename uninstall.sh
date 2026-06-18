#!/usr/bin/env bash
# Remove o Claude Usage Indicator (GNOME 42).
set -e

echo "Desligando a extensão e o timer…"
gnome-extensions disable claude-usage@local 2>/dev/null || true
systemctl --user disable --now claude-usage.timer 2>/dev/null || true

echo "Removendo arquivos…"
rm -rf "$HOME/.local/share/gnome-shell/extensions/claude-usage@local"
rm -rf "$HOME/.local/share/claude-usage"
rm -f  "$HOME/.config/systemd/user/claude-usage.service"
rm -f  "$HOME/.config/systemd/user/claude-usage.timer"
systemctl --user daemon-reload

echo "Pronto. (No Wayland, a extensão some da barra após logout/login.)"
