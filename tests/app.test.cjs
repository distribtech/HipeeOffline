'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function harness(options = {}) {
  let now = 100000;
  const elements = new Map(), intervals = [], writes = [];
  const node = () => ({textContent: '', hidden: true, disabled: false, checked: false,
    value: '', style: {}, width: 700, height: 170, attrs: {}, listeners: {},
    classList: {add() {}, remove() {}}, addEventListener(name, fn) {this.listeners[name] = fn;},
    setAttribute(k, v) {this.attrs[k] = v;}, removeAttribute(k) {delete this.attrs[k];},
    getContext() {return {clearRect(){}, beginPath(){}, moveTo(){}, lineTo(){}, stroke(){}};}});
  const element = id => {if (!elements.has(id)) elements.set(id, node()); return elements.get(id);};
  element('threshold').value = '65'; element('delay').value = '5';
  const notify = {listener: null, addEventListener(_, fn) {this.listener = fn;},
    removeEventListener() {this.listener = null;}, async startNotifications() {}};
  const writer = {properties: {write: !options.noResponse, writeWithoutResponse: !!options.noResponse},
    async writeValueWithResponse(data) {writes.push(Array.from(data));},
    async writeValueWithoutResponse(data) {writes.push(Array.from(data));}};
  const device = {name: 'JZ-test', addEventListener(){}, removeEventListener(){},
    gatt: {connected: false, disconnect() {this.connected = false;}, async connect() {
      this.connected = true;
      return {async getPrimaryService(uuid) {
        assert.equal(uuid, 0xfff0);
        if (options.missingService) {const err = new Error('Service missing'); err.name = 'NotFoundError'; throw err;}
        return {async getCharacteristic(id) {return id === 0xfff1 ? notify : writer;}};
      }};
    }}};
  class Clock extends Date {constructor(...args) {super(...(args.length ? args : [now]));} static now() {return now;}}
  const context = vm.createContext({console, Date: Clock, Uint8Array, DataView, Blob,
    localStorage: {getItem() {return 'en';}, setItem() {}}, document: {getElementById: element}, window: {isSecureContext: true, addEventListener(){}},
    navigator: {bluetooth: {async requestDevice(request) {assert.equal(request.optionalServices[0], 0xfff0); return device;}}},
    setInterval(fn) {intervals.push(fn); return intervals.length;}, clearInterval(){},
    setTimeout(fn, ms) {if (ms < 1000) Promise.resolve().then(fn); return 1;}, clearTimeout(){}});
  for (const filename of ['core.js', 'i18n.js', 'app.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', filename), 'utf8'), context);
  const run = text => vm.runInContext(text, context);
  const sample = payload => {
    const data = Uint8Array.from(context.HipeeCore.frame(0x35, payload));
    assert.ok(notify.listener, 'notification listener installed');
    notify.listener({target: {value: new DataView(data.buffer)}});
  };
  return {element, intervals, writes, device, run, sample, advance(ms) {now += ms;},
    tick() {intervals[0]();}};
}
test('connection subscribes and sends ordered handshake; guided calibration and stale-data reset work', async () => {
  const h = harness(); await h.run('connect()');
  assert.equal(h.writes.length, 4);
  assert.deepEqual(h.writes[0], [9, 1, 1, 245]);
  assert.deepEqual(h.writes[3], [9, 4, 52, 3, 232, 1, 211]);
  assert.equal(h.element('connect').disabled, true);
  h.sample([40, 80, 7, 1]);
  assert.equal(h.element('calibrate').disabled, false);
  for (let stage = 0; stage < 3; stage++) {
    h.run('startCapture()'); h.advance(2000);
    for (let i = 0; i < 8; i++) {h.advance(1000); h.sample([stage === 1 ? 120 : 40, stage === 1 ? 120 : 80, 7, stage * 20 + i]);}
  }
  assert.match(h.element('progress').textContent, /Calibration ready/);
  h.sample([120, 120, 7, 200]);
  assert.equal(h.element('score').textContent, 100);
  h.element('alerts').checked = true; h.tick();
  h.advance(5000); h.sample([120, 120, 7, 205]); h.tick();
  assert.equal(h.element('reminder').hidden, false);
  h.advance(5001); h.tick();
  assert.equal(h.element('reminder').hidden, true);
  assert.equal(h.element('score').textContent, '—');
  assert.equal(h.element('calibrate').disabled, true);
  h.run('disconnected()');
  assert.equal(h.device.gatt.connected, false);
  assert.equal(h.element('connect').disabled, false);
  assert.equal(h.element('progress').textContent, 'No calibration yet');
});
test('unsupported firmware is shown as an error rather than a cancelled picker', async () => {
  const h = harness({missingService: true}); await h.run('connect()');
  assert.equal(h.element('error').hidden, false);
  assert.match(h.element('error').textContent, /Service missing/);
  assert.equal(h.writes.length, 0);
  assert.equal(h.device.gatt.connected, false);
});
test('write-without-response firmware is supported', async () => {
  const h = harness({noResponse: true}); await h.run('connect()');
  assert.equal(h.writes.length, 4);
  assert.equal(h.element('connection').textContent, 'Connected over Bluetooth');
});
test('simulated demo is clearly labelled and cannot connect to hardware simultaneously', () => {
  const h = harness(); h.run('demo()');
  assert.match(h.element('connection').textContent, /Simulated demo/);
  assert.equal(h.element('demoLabel').hidden, false);
  assert.equal(h.element('connect').disabled, true);
  h.intervals[1]();
  assert.match(h.element('samples').textContent, /SIMULATED/);
  assert.equal(h.writes.length, 0);
  h.run('demo()'); assert.equal(h.element('connect').disabled, false);
});
