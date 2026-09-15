/**
 * Where findings live between runs.
 *
 * One JSON file. Not a database on purpose: this thing watches a handful
 * of pairs on a handful of timeframes, and a file you can open in an
 * editor and read is worth more than an index you cannot.
 *
 * The id of a setup contains the bar it was found on, so re-scanning the
 * same candle can never send the same message twice.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const VERSION = 1;
const MAX_SETUPS = 500;
const MAX_ALERTS = 200;

function empty() {
  return { version: VERSION, setups: [], alerts: [], scans: {}, updated: null };
}

class Store {
  constructor(file) {
    this.file = file;
    this.data = empty();
    this.load();
  }

  load() {
    try {
      const raw = fs.readFileSync(this.file, "utf8");
      const parsed = JSON.parse(raw);
      this.data = Object.assign(empty(), parsed);
      if (!Array.isArray(this.data.setups)) this.data.setups = [];
      if (!Array.isArray(this.data.alerts)) this.data.alerts = [];
      if (!this.data.scans || typeof this.data.scans !== "object") this.data.scans = {};
    } catch (e) {
      /* A missing file is the normal first run. A corrupt one is kept
         under a new name rather than quietly overwritten. */
      if (e.code !== "ENOENT") {
        try { fs.renameSync(this.file, this.file + ".broken-" + Date.now()); } catch (_) {}
      }
      this.data = empty();
    }
    return this;
  }

  save() {
    this.data.updated = new Date().toISOString();
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = this.file + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2));
    fs.renameSync(tmp, this.file);          // rename is atomic, a half-written file never appears
    return this;
  }

  has(id) { return this.data.setups.some(s => s.id === id); }

  /** Records a setup. Returns false if this exact bar was already seen. */
  add(setup) {
    if (!setup || !setup.id || this.has(setup.id)) return false;
    this.data.setups.unshift(Object.assign({ found: Date.now() }, setup));
    if (this.data.setups.length > MAX_SETUPS) this.data.setups.length = MAX_SETUPS;
    return true;
  }

  /** Records a TradingView alert exactly as it arrived. */
  addAlert(alert) {
    this.data.alerts.unshift(Object.assign({ received: Date.now() }, alert));
    if (this.data.alerts.length > MAX_ALERTS) this.data.alerts.length = MAX_ALERTS;
    return alert;
  }

  noteScan(symbol, tf, info) {
    this.data.scans[symbol + "|" + tf] = Object.assign({ at: Date.now() }, info);
  }

  /** The last time this exact pattern was recorded on this pair. */
  lastOf(symbol, tf, kind, side) {
    return this.data.setups.find(s =>
      s.symbol === symbol && s.tf === tf && s.kind === kind && s.side === side) || null;
  }

  recent(limit) { return this.data.setups.slice(0, limit || 50); }
  alerts(limit) { return this.data.alerts.slice(0, limit || 50); }

  /** Drops everything older than `days`, so the file cannot grow forever. */
  prune(days) {
    const cutoff = Date.now() - (days || 30) * 86400e3;
    const before = this.data.setups.length + this.data.alerts.length;
    this.data.setups = this.data.setups.filter(s => (s.found || s.at || 0) >= cutoff);
    this.data.alerts = this.data.alerts.filter(a => (a.received || 0) >= cutoff);
    return before - (this.data.setups.length + this.data.alerts.length);
  }
}

module.exports = { Store, VERSION, MAX_SETUPS, MAX_ALERTS };
