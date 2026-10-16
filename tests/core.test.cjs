'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {frame, handshake, hex, Parser, PostureModel, AlertState} = require('../core.js');

test('handshake matches published bytes and encodes big-endian timestamp', () => {
  const packets = handshake(0x12345678);
  assert.equal(hex(packets[0]), '09 01 01 f5');
  assert.equal(hex(packets[1]), '09 01 03 f3');
  assert.equal(hex(packets[3]), '09 04 34 03 e8 01 d3');
  assert.deepEqual(Array.from(packets[2].slice(3, 7)), [0x12, 0x34, 0x56, 0x78]);
  packets.forEach(packet => assert.equal(packet.reduce((a, b) => a + b, 0) & 255, 0));
});
test('partial, concatenated and corrupt notifications preserve valid frames', () => {
  const parser = new Parser(), first = frame(0x35, [1, 2, 3]), next = frame(0x35, [4, 5]);
  assert.deepEqual(parser.push(first.slice(0, 4)), []);
  const results = parser.push(Uint8Array.from([...first.slice(4), ...next]));
  assert.deepEqual(results.map(x => x.payload), [[1, 2, 3], [4, 5]]);
  const bad = Array.from(first); bad[bad.length - 1] ^= 1;
  assert.deepEqual(parser.push([...bad, 77, ...next]).map(x => x.payload), [[4, 5]]);
});
test('buffer is bounded and malformed lengths do not hide valid subsequent frames', () => {
  const parser = new Parser(); parser.push(new Array(10000).fill(9));
  assert.ok(parser.buffer.length <= 202);
  assert.equal(parser.push([9, 199, 20, ...frame(0x35, [99])]).at(-1).payload[0], 99);
});
const group = (value, start) => Array.from({length: 8}, (_, i) => [40 + value, 80 + Math.round(value / 2), 7, start + i]);
test('calibration learns a repeatable signal and ignores monotonic clock drift', () => {
  const model = new PostureModel().fit(group(0, 1), group(80, 20), group(0, 40));
  assert.ok(model.axes.length);
  assert.ok(model.axes.every(axis => axis.i < 6));
  assert.ok(model.predict([40, 80, 7, 180]).score < 10);
  assert.ok(model.predict([120, 120, 7, 240]).score > 90);
  assert.equal(model.predict([40, 80]), null);
});
test('counter-only changes, insufficient samples and changing layouts are rejected', () => {
  assert.throws(() => new PostureModel().fit(group(0, 1), group(0, 20), group(0, 40)), /No repeatable/);
  assert.throws(() => new PostureModel().fit(group(0, 1).slice(0, 3), group(80, 20), group(0, 40)), /at least 8/);
  const changed = group(0, 40); changed[0].push(1);
  assert.throws(() => new PostureModel().fit(group(0, 1), group(80, 20), changed), /changed packet/);
});
test('unknown or stale data resets the entire alert hold time', () => {
  const alert = new AlertState();
  assert.equal(alert.update(80, false, 0, 65, 5000), false);
  assert.equal(alert.update(80, false, 4999, 65, 5000), false);
  assert.equal(alert.update(80, false, 5000, 65, 5000), true);
  assert.equal(alert.update(80, true, 6000, 65, 5000), false);
  assert.equal(alert.update(80, false, 10000, 65, 5000), false);
  assert.equal(alert.update(80, false, 15000, 65, 5000), true);
  assert.equal(alert.update(0, false, 15001, 65, 5000), false);
});
