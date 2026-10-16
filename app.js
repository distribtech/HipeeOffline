/* Local-only Windows browser app. No fetch, sockets, analytics, or cloud storage. */
'use strict';
const $ = id => document.getElementById(id);
function uiText(id) { return {set value(value) { HipeeI18n.set($(id), value); }}; }
const {hex, handshake, frame, Parser, PostureModel, AlertState} = HipeeCore;
const SERVICE = 0xfff0, NOTIFY = 0xfff1, WRITE = 0xfff2;
let device = null, notification = null, parser = new Parser(), epoch = 0;
let connected = false, busy = false, demoTimer = null, model = null, calibration = null;
let lastLive = 0, rawCount = 0, liveCount = 0, lastPayload = null, lastPrediction = null;
let history = [], logs = [], silenceUntil = 0;
const alertState = new AlertState();
const timestamp = () => new Date().toLocaleTimeString();
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
function log(message) {
  logs.push(`${timestamp()}  ${message}`);
  if (logs.length > 500) logs.shift();
  uiText('log').value = logs.slice(-65).join('\n');
}
function showError(message = '') { uiText('error').value = message; $('error').hidden = !message; }
function buttons() {
  $('connect').disabled = busy || connected;
  $('disconnect').disabled = !busy && !connected;
  $('demo').disabled = busy || (connected && !demoTimer);
  uiText('demo').value = demoTimer ? 'Stop simulated demo' : 'Try a simulated demo';
  $('showAll').disabled = busy || connected;
  $('calibrate').disabled = !connected || !lastLive || Date.now() - lastLive > 5000 || !!calibration?.collecting;
}
function resetData() {
  parser = new Parser(); model = null; calibration = null; lastLive = 0;
  lastPayload = null; lastPrediction = null; rawCount = 0; liveCount = 0;
  history = []; alertState.reset(); $('reminder').hidden = true;
  uiText('score').value = '—'; $('fill').style.width = '0%';
  $('meter').removeAttribute('aria-valuenow'); uiText('posture').value = 'Waiting for sensor data';
  uiText('progress').value = 'No calibration yet'; uiText('calibrate').value = 'Start guided calibration';
  uiText('calibrationHint').value = 'Three short captures: upright, slouched, then upright again. Keep the sensor in the same position.';
  uiText('explanation').value = 'Waiting for a compatible live stream. Then start guided calibration.';
  uiText('samples').value = 'Waiting for sensor data'; draw();
}
function disconnected(message = 'Disconnected') {
  epoch++; busy = false; connected = false;
  if (demoTimer) clearInterval(demoTimer);
  demoTimer = null;
  if (notification) notification.removeEventListener('characteristicvaluechanged', receiveEvent);
  notification = null;
  const previous = device; device = null;
  if (previous) { previous.removeEventListener('gattserverdisconnected', onDisconnect); if (previous.gatt.connected) previous.gatt.disconnect(); }
  resetData(); uiText('posture').value = 'Ready when you are';
  uiText('connection').value = message; uiText('device').value = 'Turn on your HiPee and close its phone app.';
  $('dot').classList.remove('connected'); $('demoLabel').hidden = true;
  buttons();
}
function onDisconnect() { log('Bluetooth disconnected. Reconnect and recalibrate.'); disconnected(); }
function receiveEvent(event) {
  const view = event.target.value;
  receive(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
}
function receive(bytes) {
  rawCount++; log(`RX ${hex(bytes)}`);
  const frames = parser.push(bytes);
  for (const message of frames) {
    if (message.command !== 0x35 || !message.payload.length) continue;
    liveCount++; lastLive = Date.now(); lastPayload = message.payload;
    if (calibration?.collecting && Date.now() >= calibration.readyAt) collect(message.payload);
    const result = model?.predict(message.payload) || null;
    lastPrediction = result;
    if (result && !calibration?.collecting) {
      uiText('score').value = result.unknown ? '—' : result.score;
      $('fill').style.width = `${result.unknown ? 0 : result.score}%`;
      if (!result.unknown) $('meter').setAttribute('aria-valuenow', result.score);
      else $('meter').removeAttribute('aria-valuenow');
      uiText('posture').value = result.unknown ? 'Unfamiliar movement' : result.score >= Number($('threshold').value) ? 'Closer to your slouch example' : 'Closer to your upright example';
      uiText('explanation').value = result.unknown ? 'Return to a taught posture, or recalibrate.' : '0 matches your upright example; 100 matches your slouch example.';
    } else if (!calibration?.collecting) {
      uiText('posture').value = 'Sensor is streaming';
      uiText('explanation').value = 'Start guided calibration to teach your upright and slouched postures.';
    }
    history.push(result && !result.unknown && !calibration?.collecting ? result.score : null);
    history = history.slice(-120); draw();
  }
  uiText('samples').value = `${rawCount} notifications · ${liveCount} compatible live frames${demoTimer ? ' · SIMULATED' : ''}`;
  buttons();
}
async function connect() {
  if (busy || connected) return;
  if (!navigator.bluetooth || !window.isSecureContext) {
    showError('Bluetooth is unavailable here. Open Start HiPee.cmd using Microsoft Edge or Google Chrome on Windows 10/11. Your browser or organization may disable Bluetooth access.');
    return;
  }
  showError(); resetData(); busy = true; const session = ++epoch; buttons();
  uiText('connection').value = 'Choose your HiPee…';
  const guard = () => { if (session !== epoch) throw new Error('Connection cancelled'); };
  let selected = null;
  try {
    // Keep requestDevice directly inside the user's click gesture.
    selected = await navigator.bluetooth.requestDevice($('showAll').checked ?
      {acceptAllDevices: true, optionalServices: [SERVICE]} :
      {filters: [{services: [SERVICE]}, {namePrefix: 'JZ-'}, {namePrefix: 'Hi-JZ-'},
        {namePrefix: 'jiaozi-'}, {namePrefix: 'hipee'}, {namePrefix: 'HiPee'}], optionalServices: [SERVICE]});
    guard(); device = selected; selected.addEventListener('gattserverdisconnected', onDisconnect);
    uiText('connection').value = 'Connecting…'; uiText('device').value = selected.name || 'Unnamed HiPee';
    log(`Connecting to ${selected.name || 'unnamed device'}`);
    let timer;
    const connectionPromise = selected.gatt.connect();
    connectionPromise.then(() => { if (session !== epoch && device !== selected) selected.gatt.disconnect(); }, () => {});
    const server = await Promise.race([connectionPromise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Bluetooth connection timed out. Close the phone app and retry.')), 20000);
    })]).finally(() => clearTimeout(timer));
    guard();
    const service = await server.getPrimaryService(SERVICE); guard();
    const notify = await service.getCharacteristic(NOTIFY); guard();
    const writer = await service.getCharacteristic(WRITE); guard();
    notification = notify;
    notify.addEventListener('characteristicvaluechanged', receiveEvent);
    await notify.startNotifications(); guard();
    if (!writer.properties.write && !writer.properties.writeWithoutResponse)
      throw new Error('This firmware does not expose the expected writable characteristic.');
    for (const packet of handshake()) {
      guard();
      if (writer.properties.write) await writer.writeValueWithResponse(packet);
      else await writer.writeValueWithoutResponse(packet);
      guard(); log(`TX ${hex(packet)}`); await pause(150);
    }
    guard(); connected = true; busy = false;
    uiText('connection').value = 'Connected over Bluetooth'; $('dot').classList.add('connected');
    log('Handshake sent; waiting for live frames. No internet connection is used.'); buttons();
  } catch (error) {
    if (session !== epoch) return;
    const cancelled = !selected && error.name === 'NotFoundError';
    log(cancelled ? 'Device selection cancelled.' : `Connection failed: ${error.message}`);
    disconnected(cancelled ? 'Selection cancelled' : 'Connection failed');
    if (!cancelled) showError(`${error.message}\nCharge the device, close its phone app, and reconnect. Firmware compatibility has not been hardware-tested.`);
  }
}
const stageNames = ['Sit upright', 'Slouch naturally', 'Sit upright again'];
function startCapture() {
  if (!connected || !lastLive || Date.now() - lastLive > 5000) return;
  showError();
  if (!calibration) calibration = { groups: [], collecting: false };
  model = null; lastPrediction = null; alertState.reset(); $('reminder').hidden = true;
  uiText('score').value = '—'; $('fill').style.width = '0%'; $('meter').removeAttribute('aria-valuenow');
  calibration.samples = []; calibration.collecting = true; calibration.readyAt = Date.now() + 2000;
  calibration.deadline = Date.now() + 30000;
  uiText('posture').value = stageNames[calibration.groups.length];
  uiText('calibrationHint').value = `${stageNames[calibration.groups.length]} and hold still while 8 live samples are captured.`;
  uiText('progress').value = 'Get comfortable… capture starts in 2 seconds';
  uiText('calibrate').value = 'Capturing…'; buttons();
}
function collect(payload) {
  calibration.samples.push(payload.slice());
  uiText('progress').value = `Step ${calibration.groups.length + 1} of 3 · ${calibration.samples.length} / 8 samples`;
  if (calibration.samples.length < 8) return;
  calibration.groups.push(calibration.samples); calibration.collecting = false;
  if (calibration.groups.length < 3) {
    const next = stageNames[calibration.groups.length];
    uiText('calibrate').value = `Capture: ${next.toLowerCase()}`;
    uiText('calibrationHint').value = `${next}, then click Capture when ready. Keep the device in the same position.`;
    uiText('progress').value = `Step ${calibration.groups.length} saved. Ready for the next pose.`;
  } else {
    try {
      model = new PostureModel().fit(...calibration.groups);
      uiText('progress').value = 'Calibration ready — test upright and slouch now';
      uiText('calibrationHint').value = 'Check that upright is near 0 and slouch is near 100. This is a learned match, not an angle measurement.';
      log(`Empirical calibration fitted (${model.axes.length} repeatable features). Not a degree decoder.`);
    } catch (error) { showError(error.message); uiText('progress').value = 'Calibration failed — please retry'; log(`Calibration failed: ${error.message}`); }
    calibration = null; uiText('calibrate').value = 'Recalibrate';
  }
  buttons();
}
function draw() {
  const canvas = $('chart'), ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height; ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = '#283c4d'; ctx.lineWidth = 1;
  for (const y of [10, h / 2, h - 10]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  ctx.strokeStyle = '#8be5cb'; ctx.lineWidth = 2; ctx.beginPath(); let segment = false;
  history.forEach((value, index) => {
    if (value === null) { segment = false; return; }
    const x = index / 119 * w, y = h - 10 - value / 100 * (h - 20);
    if (segment) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    segment = true;
  }); ctx.stroke();
}
function exportLog() {
  const text = `HiPee Offline packet log\n${new Date().toISOString()}\nFirmware/angle layout: unverified. ${demoTimer ? 'SIMULATED DEMO' : 'Bluetooth session'}\n\n${logs.join('\n')}\n`;
  const url = URL.createObjectURL(new Blob([text], {type: 'text/plain'}));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'hipee-packets.txt'; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function syntheticPayload(value, counter) {
  return [Math.round(40 + value * 0.8), Math.round(80 + value * 0.45), 7, 0, counter & 255];
}
function demo() {
  if (demoTimer) { disconnected('Demo stopped'); return; }
  if (busy || connected) return;
  showError(); resetData(); connected = true;
  const group = value => Array.from({length: 8}, (_, i) => syntheticPayload(value, i));
  model = new PostureModel().fit(group(0), group(100), group(0));
  uiText('connection').value = 'Simulated demo — no device connected';
  uiText('device').value = 'Synthetic samples only. Stop demo to connect your real HiPee.';
  $('demoLabel').hidden = false; $('dot').classList.add('connected');
  uiText('progress').value = 'Demo calibration loaded'; uiText('calibrate').value = 'Try guided calibration';
  log('DEMO STARTED: all samples are simulated.');
  let tick = 0;
  demoTimer = setInterval(() => {
    const value = (1 - Math.cos(tick / 5)) * 50;
    receive(frame(0x35, syntheticPayload(value, tick++)));
  }, 1000); buttons();
}
$('connect').addEventListener('click', connect);
$('disconnect').addEventListener('click', () => { log('Disconnected by user.'); disconnected(); });
$('calibrate').addEventListener('click', startCapture);
$('demo').addEventListener('click', demo);
$('export').addEventListener('click', exportLog);
$('dismiss').addEventListener('click', () => { silenceUntil = Date.now() + 30000; $('reminder').hidden = true; });
for (const id of ['threshold', 'delay']) $(id).addEventListener('input', () => {
  uiText(id + 'Value').value = $(id).value + (id === 'delay' ? ' seconds' : ''); alertState.reset(); $('reminder').hidden = true;
});
$('alerts').addEventListener('change', () => { alertState.reset(); $('reminder').hidden = true; });
setInterval(() => {
  const now = Date.now(), stale = !lastLive || now - lastLive > 5000;
  if (calibration?.collecting && now > calibration.deadline) {
    calibration = null; uiText('calibrate').value = 'Retry calibration';
    uiText('progress').value = 'Capture timed out'; showError('Not enough live samples arrived. Reconnect and retry.');
  }
  if (connected && stale) {
    uiText('score').value = '—'; $('fill').style.width = '0%'; $('meter').removeAttribute('aria-valuenow');
    uiText('posture').value = lastLive ? 'Sensor data paused' : 'Waiting for live data';
    uiText('explanation').value = 'No recent compatible frames. Check the packet log, close the phone app, and reconnect.';
    history.push(null); history = history.slice(-120); draw();
  }
  const shouldAlert = alertState.update(lastPrediction?.score ?? 0,
    !connected || stale || !model || !!calibration || !lastPrediction || lastPrediction.unknown || !$('alerts').checked,
    now, Number($('threshold').value), Number($('delay').value) * 1000);
  $('reminder').hidden = !shouldAlert || now < silenceUntil;
  buttons();
}, 500);
window.addEventListener('pagehide', () => { if (device?.gatt.connected) device.gatt.disconnect(); if (demoTimer) clearInterval(demoTimer); });
if (!navigator.bluetooth) uiText('device').value = 'Open with Microsoft Edge or Google Chrome on Windows 10/11 to use Bluetooth.';
draw(); buttons();

HipeeI18n.init();
