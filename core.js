/* Offline packet transport and empirical posture matching; no network APIs. */
(function (root) {
  'use strict';
  const hex = data => Array.from(data, x => x.toString(16).padStart(2, '0')).join(' ');
  function frame(command, payload = []) {
    if (payload.length > 198) throw new Error('Payload too large');
    const bytes = [0x09, payload.length + 1, command, ...payload];
    return Uint8Array.from([...bytes, (-bytes.reduce((a, b) => a + b, 0)) & 255]);
  }
  function handshake(now = Math.floor(Date.now() / 1000)) {
    return [frame(1), frame(3), frame(5, [now >>> 24, (now >>> 16) & 255,
      (now >>> 8) & 255, now & 255]), frame(0x34, [3, 232, 1])];
  }
  class Parser {
    constructor() { this.buffer = []; }
    push(data) {
      this.buffer.push(...data);
      const frames = [];
      // Search for whole valid frames, retaining partial frames across notifications.
      // Incoming framing is a compatibility assumption, not a verified angle layout.
      for (;;) {
        let found = false;
        for (let i = 0; i + 3 < this.buffer.length; i++) {
          if (![9, 10].includes(this.buffer[i])) continue;
          const length = this.buffer[i + 1];
          if (length < 1 || length > 199 || i + length + 3 > this.buffer.length) continue;
          const packet = this.buffer.slice(i, i + length + 3);
          if ((packet.reduce((a, b) => a + b, 0) & 255) !== 0) continue;
          frames.push({ command: packet[2], payload: packet.slice(3, -1), packet });
          this.buffer.splice(0, i + packet.length);
          found = true;
          break;
        }
        if (!found) break;
      }
      if (this.buffer.length > 1024) this.buffer = this.buffer.slice(-202);
      return frames;
    }
  }
  const median = xs => {
    const sorted = xs.slice().sort((a, b) => a - b), m = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
  };
  function features(payload) {
    // Circular byte coordinates avoid a discontinuity at 255 -> 0. No units or
    // angle offsets are inferred. Training excludes features that fail to return
    // to their original values in a second upright capture (e.g. clocks/counters).
    return payload.flatMap(byte => [Math.sin(byte * Math.PI / 128), Math.cos(byte * Math.PI / 128)]);
  }
  class PostureModel {
    fit(upright, slouch, uprightAgain) {
      if ([upright, slouch, uprightAgain].some(x => x.length < 8))
        throw new Error('Each pose needs at least 8 live samples.');
      this.length = upright[0].length;
      if (!this.length || [...upright, ...slouch, ...uprightAgain].some(x => x.length !== this.length))
        throw new Error('The sensor changed packet format. Please capture a packet log.');
      const groups = [upright, slouch, uprightAgain].map(g => g.map(features));
      const stats = groups.map(g => Array.from({length: this.length * 2}, (_, i) => {
        const mid = median(g.map(x => x[i]));
        const spread = Math.max(...g.map(x => Math.abs(x[i] - mid)));
        return { mid, spread };
      }));
      this.axes = [];
      for (let i = 0; i < this.length * 2; i++) {
        const a = stats[0][i], b = stats[1][i], c = stats[2][i];
        const baseline = (a.mid + c.mid) / 2, difference = b.mid - baseline;
        const noise = Math.max(a.spread, b.spread, c.spread, 0.015);
        if (Math.abs(difference) > Math.max(0.08, noise * 6) &&
            Math.abs(a.mid - c.mid) < Math.abs(difference) * 0.2) {
          this.axes.push({ i, baseline, difference });
        }
      }
      if (!this.axes.length) throw new Error('No repeatable posture signal found. Refit the sensor and retry.');
      // Verify all captures, not just their medians. This rejects noisy calibration.
      for (let group = 0; group < 3; group++) {
        for (const payload of [upright, slouch, uprightAgain][group]) {
          const result = this.predict(payload);
          if (!result || result.unknown || Math.abs(result.score - (group === 1 ? 100 : 0)) > 30) {
            this.axes = [];
            throw new Error('Calibration was inconsistent. Hold each posture steady and retry.');
          }
        }
      }
      return this;
    }
    predict(payload) {
      if (!this.axes?.length || payload.length !== this.length) return null;
      const values = features(payload);
      const coordinates = this.axes.map(a => (values[a.i] - a.baseline) / a.difference);
      const center = median(coordinates);
      const disagreement = median(coordinates.map(x => Math.abs(x - center)));
      return { score: Math.round(Math.max(0, Math.min(1, center)) * 100),
        unknown: disagreement > 0.4 || center < -0.6 || center > 1.6 };
    }
  }
  class AlertState {
    constructor() { this.reset(); }
    reset() { this.since = null; this.alerting = false; }
    update(score, unknown, now, threshold, delay) {
      if (unknown || score < threshold) { this.reset(); return false; }
      if (this.since === null) this.since = now;
      this.alerting = now - this.since >= delay;
      return this.alerting;
    }
  }
  const api = {hex, frame, handshake, Parser, PostureModel, AlertState};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HipeeCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
