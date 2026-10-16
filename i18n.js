'use strict';
(function (root) {
  const dictionary = {
    'YOUR DESK COMPANION': 'ВАШ ПОМІЧНИК ЗА РОБОЧИМ СТОЛОМ',
    'A direct Bluetooth connection. Your data stays here.': 'Пряме з’єднання через Bluetooth. Ваші дані залишаються на цьому пристрої.',
    'LOCAL ONLY': 'ЛОКАЛЬНО', 'Language': 'Мова',
    'Not connected': 'Не підключено', 'Disconnected': 'Відключено',
    'Turn on your HiPee and close its phone app.': 'Увімкніть HiPee та закрийте його застосунок на телефоні.',
    'Connect HiPee': 'Підключити HiPee', 'Disconnect': 'Відключити',
    'LIVE POSTURE MATCH': 'ВІДПОВІДНІСТЬ ПОСТАВИ НАЖИВО', '· SIMULATED': '· СИМУЛЯЦІЯ',
    'Ready when you are': 'Готово до роботи',
    'Connect, then teach the app your upright and slouched postures.': 'Підключіть пристрій, а потім навчіть застосунок розпізнавати вашу рівну та сутулу поставу.',
    'Similarity to trained slouch': 'Схожість зі зразком сутулої постави',
    'Upright example': 'Зразок рівної постави', 'Slouch example': 'Зразок сутулої постави',
    'Recent posture match history': 'Історія відповідності постави',
    'Experimental matching, not degrees. Test both postures after calibration. Unfamiliar movement may not be classified correctly.': 'Експериментальне порівняння, а не кути в градусах. Після калібрування перевірте обидві пози. Незнайомі рухи можуть розпізнаватися неправильно.',
    'MAKE IT YOURS': 'НАЛАШТУЙТЕ ДЛЯ СЕБЕ', 'Teach your posture': 'Навчання розпізнаванню постави',
    'Three short captures: upright, slouched, then upright again. Keep the sensor in the same position.': 'Три короткі записи: рівна постава, сутула, потім знову рівна. Не змінюйте положення датчика.',
    'Start guided calibration': 'Почати калібрування', 'No calibration yet': 'Ще не відкалібровано',
    'Desktop reminder': 'Нагадування на екрані', 'Show an on-screen reminder': 'Показувати нагадування на екрані',
    'Slouch match threshold': 'Поріг схожості із сутулою поставою', 'Hold time': 'Тривалість утримання', '5 seconds': '5 с',
    'Keep this window open. Recalibrate after moving the device or reconnecting.': 'Залишайте це вікно відкритим. Після переміщення пристрою або повторного підключення виконайте калібрування знову.',
    'Connection details': 'Відомості про підключення', 'Waiting for sensor data': 'Очікування даних датчика',
    'Save packet log': 'Зберегти журнал пакетів', 'Live packets & troubleshooting': 'Пакети наживо та усунення несправностей',
    'If you connect but receive no data, charge the device, close its phone app, and reconnect. Firmware support is unverified. A valid 0x35 stream is needed for calibration.': 'Якщо пристрій підключено, але дані не надходять, зарядіть його, закрийте застосунок на телефоні та підключіться знову. Сумісність прошивки не перевірено. Для калібрування потрібен коректний потік 0x35.',
    'Bluetooth packet log': 'Журнал пакетів Bluetooth', 'No packets yet.': 'Пакетів ще немає.',
    'Show all Bluetooth devices in picker': 'Показувати всі пристрої Bluetooth у списку',
    'Try a simulated demo': 'Переглянути демонстрацію', 'Stop simulated demo': 'Зупинити демонстрацію',
    'No account · No server · No internet requests · Logs saved only when you choose': 'Без облікового запису · Без сервера · Без інтернет-запитів · Журнал зберігається лише за вашим вибором',
    'Time to sit upright': 'Час вирівняти поставу', 'Your posture matches the slouch example.': 'Ваша постава схожа на зразок сутулої постави.',
    'Dismiss for 30 seconds': 'Приховати на 30 секунд',
    'Waiting for a compatible live stream. Then start guided calibration.': 'Очікування сумісного потоку даних. Після цього почніть калібрування.',
    'Unfamiliar movement': 'Незнайомий рух', 'Closer to your slouch example': 'Ближче до сутулої постави',
    'Closer to your upright example': 'Ближче до рівної постави',
    'Return to a taught posture, or recalibrate.': 'Поверніться до однієї з навчених поз або виконайте калібрування знову.',
    '0 matches your upright example; 100 matches your slouch example.': '0 відповідає зразку рівної постави; 100 — зразку сутулої.',
    'Sensor is streaming': 'Датчик передає дані',
    'Start guided calibration to teach your upright and slouched postures.': 'Почніть калібрування для розпізнавання рівної та сутулої постави.',
    'Bluetooth is unavailable here. Open Start HiPee.cmd using Microsoft Edge or Google Chrome on Windows 10/11. Your browser or organization may disable Bluetooth access.': 'Bluetooth недоступний. Відкрийте Start HiPee.cmd у Microsoft Edge або Google Chrome у Windows 10/11. Доступ до Bluetooth може бути вимкнено браузером або організацією.',
    'Choose your HiPee…': 'Виберіть свій HiPee…', 'Connecting…': 'Підключення…',
    'Unnamed HiPee': 'HiPee без назви', 'Connection cancelled': 'Підключення скасовано',
    'Bluetooth connection timed out. Close the phone app and retry.': 'Час очікування підключення Bluetooth вичерпано. Закрийте застосунок на телефоні та повторіть спробу.',
    'This firmware does not expose the expected writable characteristic.': 'Ця прошивка не надає очікуваної характеристики для запису.',
    'Connected over Bluetooth': 'Підключено через Bluetooth', 'Selection cancelled': 'Вибір скасовано',
    'Connection failed': 'Не вдалося підключитися',
    'Charge the device, close its phone app, and reconnect. Firmware compatibility has not been hardware-tested.': 'Зарядіть пристрій, закрийте його застосунок на телефоні та підключіться знову. Сумісність прошивки не перевірено на реальному пристрої.',
    'Sit upright': 'Сядьте рівно', 'Slouch naturally': 'Прийміть звичну сутулу позу', 'Sit upright again': 'Знову сядьте рівно',
    'Get comfortable… capture starts in 2 seconds': 'Влаштуйтеся зручно… запис почнеться за 2 секунди',
    'Capturing…': 'Запис…', 'Calibration ready — test upright and slouch now': 'Калібрування завершено — перевірте рівну та сутулу поставу',
    'Check that upright is near 0 and slouch is near 100. This is a learned match, not an angle measurement.': 'Перевірте: для рівної постави значення має бути близьким до 0, для сутулої — до 100. Це результат навчання, а не вимірювання кута.',
    'Calibration failed — please retry': 'Не вдалося виконати калібрування — повторіть спробу',
    'Recalibrate': 'Калібрувати знову', 'Demo stopped': 'Демонстрацію зупинено',
    'Simulated demo — no device connected': 'Демонстрація — реальний пристрій не підключено',
    'Synthetic samples only. Stop demo to connect your real HiPee.': 'Використовуються лише штучні дані. Зупиніть демонстрацію, щоб підключити справжній HiPee.',
    'Demo calibration loaded': 'Завантажено демонстраційне калібрування', 'Try guided calibration': 'Спробувати калібрування',
    'Retry calibration': 'Повторити калібрування', 'Capture timed out': 'Час очікування запису вичерпано',
    'Not enough live samples arrived. Reconnect and retry.': 'Надійшло недостатньо даних. Підключіться знову та повторіть спробу.',
    'Sensor data paused': 'Передавання даних призупинено', 'Waiting for live data': 'Очікування даних наживо',
    'No recent compatible frames. Check the packet log, close the phone app, and reconnect.': 'Нових сумісних пакетів немає. Перевірте журнал, закрийте застосунок на телефоні та підключіться знову.',
    'Open with Microsoft Edge or Google Chrome on Windows 10/11 to use Bluetooth.': 'Для роботи Bluetooth відкрийте в Microsoft Edge або Google Chrome у Windows 10/11.',
    'Each pose needs at least 8 live samples.': 'Для кожної пози потрібно щонайменше 8 зразків даних.',
    'The sensor changed packet format. Please capture a packet log.': 'Датчик змінив формат пакетів. Збережіть журнал пакетів.',
    'No repeatable posture signal found. Refit the sensor and retry.': 'Не знайдено повторюваного сигналу постави. Поправте датчик і повторіть спробу.',
    'Calibration was inconsistent. Hold each posture steady and retry.': 'Результати калібрування неузгоджені. Утримуйте кожну позу нерухомо та повторіть спробу.'
  };
  let language = 'uk';
  try { const saved = root.localStorage?.getItem('hipee-language'); if (saved === 'en' || saved === 'uk') language = saved; } catch (_) {}
  const dynamic = new Map(), staticNodes = new Map(), attributes = [];
  function t(value) {
    if (language !== 'uk' || typeof value !== 'string') return value;
    if (dictionary[value]) return dictionary[value];
    if (value.includes('\n')) return value.split('\n').map(t).join('\n');
    let match;
    if ((match = value.match(/^(\d+) seconds$/))) return `${match[1]} с`;
    if ((match = value.match(/^(\d+) notifications · (\d+) compatible live frames( · SIMULATED)?$/)))
      return `Сповіщень: ${match[1]} · Сумісних пакетів: ${match[2]}${match[3] ? ' · СИМУЛЯЦІЯ' : ''}`;
    if ((match = value.match(/^(.+) and hold still while 8 live samples are captured\.$/)))
      return `${t(match[1])} та не рухайтеся, доки записуються 8 зразків даних.`;
    if ((match = value.match(/^Capture: (.+)$/))) {
      const stage = match[1].charAt(0).toUpperCase() + match[1].slice(1);
      return `Запис: ${t(stage).toLocaleLowerCase('uk')}`;
    }
    if ((match = value.match(/^(.+), then click Capture when ready\. Keep the device in the same position\.$/)))
      return `${t(match[1])}, потім натисніть «Запис», коли будете готові. Не змінюйте положення пристрою.`;
    if ((match = value.match(/^Step (\d+) of 3 · (\d+) \/ 8 samples$/))) return `Крок ${match[1]} із 3 · Зразків: ${match[2]} / 8`;
    if ((match = value.match(/^Step (\d+) saved\. Ready for the next pose\.$/))) return `Крок ${match[1]} збережено. Можна переходити до наступної пози.`;
    return value; // Browser/OS error details and raw technical logs retain their original text.
  }
  function set(element, value) { dynamic.set(element, value); element.textContent = t(value); }
  function apply(next) {
    language = next === 'en' ? 'en' : 'uk';
    if (root.document?.documentElement) root.document.documentElement.lang = language;
    for (const [node, original] of staticNodes) if (node.isConnected) node.nodeValue = t(original);
    for (const [element, original] of dynamic) element.textContent = t(original);
    for (const item of attributes) item.element.setAttribute(item.name, t(item.original));
    const select = root.document?.getElementById('language'); if (select) select.value = language;
    try { root.localStorage?.setItem('hipee-language', language); } catch (_) {}
  }
  function init() {
    const document = root.document;
    if (!document?.createTreeWalker) return;
    const walker = document.createTreeWalker(document.body, 4);
    let node;
    while ((node = walker.nextNode())) {
      if (['SCRIPT', 'STYLE', 'OPTION'].includes(node.parentElement?.tagName)) continue;
      const trimmed = node.nodeValue.trim();
      if (trimmed && dictionary[trimmed]) staticNodes.set(node, trimmed);
    }
    for (const element of document.querySelectorAll('[aria-label]'))
      attributes.push({element, name: 'aria-label', original: element.getAttribute('aria-label')});
    document.getElementById('language').addEventListener('change', event => apply(event.target.value));
    apply(language);
  }
  root.HipeeI18n = {t, set, apply, init, get language() {return language;}};
})(globalThis);
