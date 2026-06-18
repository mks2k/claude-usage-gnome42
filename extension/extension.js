'use strict';

const { St, GLib, Clutter, GObject } = imports.gi;
const ByteArray = imports.byteArray;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const HOME = GLib.get_home_dir();
const USAGE = HOME + '/.local/share/claude-usage/usage.json';

function _read() {
    try {
        let [ok, bytes] = GLib.file_get_contents(USAGE);
        if (!ok) return null;
        return JSON.parse(ByteArray.toString(bytes));
    } catch (e) {
        return null;
    }
}

function _pct(w) {
    if (!w || w.pct === null || w.pct === undefined) return null;
    return Math.round(w.pct);
}

function _color(maxPct) {
    if (maxPct === null) return '#9aa0a6';
    if (maxPct >= 85) return '#ff5c5c';
    if (maxPct >= 60) return '#ffd24a';
    return '#7ee787';
}

const ClaudeIndicator = GObject.registerClass(
class ClaudeIndicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, 'Claude Usage', false);

        this._label = new St.Label({
            text: 'Claude …',
            y_align: Clutter.ActorAlign.CENTER,
        });
        this.add_child(this._label);

        this._rowPlan = new PopupMenu.PopupMenuItem('Plano: …', { reactive: false });
        this._rowSession = new PopupMenu.PopupMenuItem('Sessão (5h): …', { reactive: false });
        this._rowWeek = new PopupMenu.PopupMenuItem('Semana (7d): …', { reactive: false });
        this._rowOpus = new PopupMenu.PopupMenuItem('Semana Opus: …', { reactive: false });
        this._rowUpdated = new PopupMenu.PopupMenuItem('—', { reactive: false });
        this.menu.addMenuItem(this._rowPlan);
        this.menu.addMenuItem(this._rowSession);
        this.menu.addMenuItem(this._rowWeek);
        this.menu.addMenuItem(this._rowOpus);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this.menu.addMenuItem(this._rowUpdated);

        this.refresh();
    }

    _fmtRow(w) {
        if (!w || w.pct === null || w.pct === undefined) return '—';
        let rs = '?';
        if (w.reset_at) {
            try { rs = new Date(w.reset_at).toLocaleString(); } catch (e) {}
        }
        return Math.round(w.pct) + '%  (reset: ' + rs + ')';
    }

    refresh() {
        let d = _read();
        if (!d) {
            this._label.text = 'Claude —';
            this._label.set_style('color: #9aa0a6;');
            this._rowUpdated.label.text = 'usage.json ainda não existe (rode o tracker)';
            return;
        }
        let s = _pct(d.session), w = _pct(d.week), o = _pct(d.week_opus);
        let sTxt = s === null ? '—' : 'S ' + s + '%';
        let wTxt = w === null ? '—' : 'Sem ' + w + '%';
        this._label.text = sTxt + ' · ' + wTxt;

        let maxPct = Math.max(s || 0, w || 0, o || 0);
        if (s === null && w === null) maxPct = null;
        this._label.set_style('color: ' + _color(maxPct) + '; font-weight: 600;');

        this._rowPlan.label.text = 'Plano: ' + (d.plan || '—') + (d.ok ? '' : '  (offline/cache)');
        this._rowSession.label.text = 'Sessão (5h): ' + this._fmtRow(d.session);
        this._rowWeek.label.text = 'Semana (7d): ' + this._fmtRow(d.week);
        if (d.week_opus && d.week_opus.pct !== null && d.week_opus.pct !== undefined) {
            this._rowOpus.label.text = 'Semana Opus: ' + this._fmtRow(d.week_opus);
            this._rowOpus.visible = true;
        } else {
            this._rowOpus.visible = false;
        }
        let g = '?';
        if (d.generated_at) {
            try { g = new Date(d.generated_at).toLocaleTimeString(); } catch (e) {}
        }
        this._rowUpdated.label.text = 'Atualizado: ' + g;
    }
});

let _indicator = null;
let _timeout = null;

function enable() {
    _indicator = new ClaudeIndicator();
    Main.panel.addToStatusArea('claude-usage', _indicator);
    _timeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 30, () => {
        if (_indicator) _indicator.refresh();
        return GLib.SOURCE_CONTINUE;
    });
}

function disable() {
    if (_timeout) {
        GLib.source_remove(_timeout);
        _timeout = null;
    }
    if (_indicator) {
        _indicator.destroy();
        _indicator = null;
    }
}
