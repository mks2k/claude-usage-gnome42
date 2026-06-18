# Claude Usage Indicator — GNOME 42 port

A lightweight top-bar indicator that shows your **Claude Code** usage (5-hour session
and weekly windows, with reset times) right in the GNOME Shell panel.

> **Why this exists:** the excellent original
> [`eltobsjr/claudeUsageIndicator`](https://github.com/eltobsjr/claudeUsageIndicator)
> only supports **GNOME Shell 45–50** (it uses ESM modules). On **GNOME 42**
> (e.g. Ubuntu 22.04) it won't load. This is a small **native GNOME 42 port**,
> rewritten from scratch — same idea, different runtime.

```
S 18% · Sem 35%      ← session 5h · weekly, color-coded by severity
```

## Features

- Session (5h) and weekly usage right in the top bar, **color-coded**
  (green < 60% · yellow 60–85% · red ≥ 85%).
- Dropdown with plan, exact %, **reset times**, and the weekly **Opus** limit (Max plans).
- A tiny systemd user timer refreshes the data every 2 minutes; the extension just
  reads a local JSON, so GNOME Shell stays light.

## How it works (and why it's safe)

`tracker.py` reads the OAuth token that Claude Code already stores in
`~/.claude/.credentials.json` and calls `GET https://api.anthropic.com/api/oauth/usage`
— **your own token hitting Anthropic's own endpoint** (the same one the `/usage`
command uses). **Nothing is sent to any third party.** It writes a summary to
`~/.local/share/claude-usage/usage.json`, which the extension renders.

## Requirements

- GNOME Shell **42** (Wayland or X11)
- Python 3
- Claude Code installed and logged in via subscription (OAuth) — provides the token

## Install

```bash
git clone https://github.com/mks2k/claude-usage-gnome42.git
cd claude-usage-gnome42
./install.sh
```

On **Wayland**, log out and back in so GNOME Shell picks up the new extension
(on X11: `Alt+F2`, type `r`, Enter). If it doesn't auto-enable:

```bash
gnome-extensions enable claude-usage@local
```

## Usage

Click the indicator for the details menu. Quick checks:

```bash
python3 ~/.local/share/claude-usage/tracker.py --print   # data right now
systemctl --user status claude-usage.timer               # is the timer running?
journalctl --user -u claude-usage.service -n 20          # tracker errors
```

## Uninstall

```bash
./uninstall.sh
```

## Credits

- Original idea and the `/api/oauth/usage` approach:
  [`eltobsjr/claudeUsageIndicator`](https://github.com/eltobsjr/claudeUsageIndicator) (MIT).
- This GNOME 42 port: independent reimplementation (tracker + native GNOME 42 extension).

## Caveat

`/api/oauth/usage` is an **internal, undocumented** Claude Code endpoint and may change
without notice. If it ever breaks, only `tracker.py` needs adjusting — the extension
just reads the JSON.

## License

[MIT](LICENSE).
