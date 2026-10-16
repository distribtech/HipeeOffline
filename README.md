# Without app is it possible to work

I’ll check which functions the HiPee can use on its own.
• Browsing the web
• Opened https://manuals.plus/hipee/p1-smart-posture-corrector-manual
Yes—the HiPee P1 can give vibration reminders without an app, computer, or internet. Its manual describes standalone calibration:

1. Hold the button for 3 seconds to turn it on.
2. Wear it and sit upright.
3. Hold the button continuously for 8 seconds, without releasing midway.
4. Keep still: two vibrations indicate recording starts, and another two confirm your reference posture is saved.

Double-click the button to pause reminders for 30 minutes; double-click again to resume. Instructions may vary by firmware. P1 user manual (https://manuals.plus/hipee/p1-smart-posture-corrector-manual)

An app is only needed if you want readings displayed on your computer or access to additional settings.

# HiPee Offline for Windows

The interface defaults to Ukrainian. Use the **Мова / Language** selector to switch
between Українська and English. Your choice is saved locally when browser storage
is available. Buttons, calibration guidance, connection states, reminders and
app-generated errors are translated; raw packet logs and browser/OS error details
retain their original technical text.

Double-click **Start HiPee.cmd**. This opens a local app window in Microsoft Edge
(or Google Chrome). Requires Windows 10/11, an enabled BLE-capable Bluetooth adapter,
and a browser that permits Web Bluetooth. No Python, packages, account, server,
internet connection, or firmware changes are required. Keep all app files together.

## Connect and calibrate

1. Charge the corrector, turn it on, and close its phone app so it releases Bluetooth.
2. Click **Connect HiPee**, select your device, and allow the browser's Bluetooth request.
3. Wait for live frames, sit upright, and click **Start guided calibration**.
4. Hold steady for the capture. When prompted, slouch and click **Capture**; finally,
   return upright and capture once more. Each stage starts after a 2-second pause
   and takes 8 live samples (typically about 8 seconds).
5. Verify that your upright example is near 0 and your slouch example near 100.
   Optional on-screen reminders work while this app remains running.

Calibration is experimental empirical pattern matching on repeatable live packet
features, **not decoded posture angles or a percentage of correct posture**. It
rejects unstable captures and features that do not return to baseline, but it can
still misclassify movement. Test it after calibration and recalibrate after moving
the device. No calibration is reused after disconnecting. Reminders are disabled
by default and are only shown in this app; there is no background Windows service.

## Compatibility and current limits

**Real HiPee hardware has not been tested in this environment.** The documented
JZ-series handshake is implemented: subscribe FFF1 under FFF0, then write hello,
initial-data request, current Unix time, and the 1 Hz streaming command to FFF2.
The implementation assumes incoming frames use length/checksum framing matching
the outgoing frames (header 09 or 0A, length includes command, sum modulo 256 = 0),
and uses command 35 payloads. That incoming framing still needs hardware validation.
The reference reports a JZ-series device with firmware V0.27; P1 firmware may differ.

Exact angle payload offsets and units could not be retrieved/verified, so the app
deliberately does not invent degree readings. If incoming framing differs,
Bluetooth packets remain visible in the log but calibration remains unavailable.
**Save packet log** exports up to the latest 500 in-memory diagnostic lines for
protocol investigation. Exporting never uploads anything. The raw log can contain
your device name and motion data; inspect it before sharing.

If your device is missing, try **Show all Bluetooth devices in picker** and choose
only your corrector. Unsupported devices fail without trying arbitrary commands:
the app requires service FFF0 and characteristics FFF1/FFF2 first. An FFF0 service
alone is not proof that a device is a HiPee; choose the correct device yourself.
If connection succeeds without a compatible stream, close the phone app, charge
the sensor, reconnect, and save a packet log if it persists.

The **simulated demo** explicitly uses synthetic data. It does not prove device
compatibility. The browser must keep the app running; sleep, closing the window,
or Bluetooth disconnection stops monitoring. Background browser throttling may
delay reminders. No auto-start or system settings are changed.

## Privacy and offline use

All files are local. There are no remote fonts, libraries, fetch requests,
telemetry, accounts, or cloud storage. A Content Security Policy blocks network
connections. Bluetooth goes directly between browser and sensor. Data and
calibration stay in memory until the app closes; files are saved only on export.
Browser Bluetooth permission prompts are normal and necessary for hardware access.

## Development / validation

Run `node --test tests/core.test.cjs tests/app.test.cjs` and `node --check app.js` if Node is installed.
These checks cover outgoing handshake bytes, checksum/framing, fragmented and
coalesced packets, calibration rejection, and stale/unknown alert reset. They do
not validate actual sensor semantics. Run the simulated demo to check the UI.

Reference: https://github.com/KashaMalaga/Hipee_Posture_MacOS
Browser API: https://developer.chrome.com/docs/capabilities/bluetooth

This implementation is independently written from the reference's published
handshake description; no Swift source code was available or copied.
