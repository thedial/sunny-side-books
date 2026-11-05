// Drives the Chrome already installed on the machine, headless and muted, over the DevTools protocol.
// Muted on purpose: the bots run on Scott's PC and the gain checks read the audio graph, not the speakers.
// Node's own fetch and WebSocket only; no packages.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].filter(Boolean);

export function findChrome() { return CHROME_PATHS.find(p => existsSync(p)); }

export async function launch() {
  const exe = findChrome();
  if (!exe) throw new Error('no Chrome found; set CHROME_PATH');
  const profile = mkdtempSync(join(tmpdir(), 'ssb-bots-'));
  const proc = spawn(exe, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run',
    '--no-default-browser-check', '--autoplay-policy=no-user-gesture-required', '--disable-extensions',
    '--mute-audio', 'about:blank'],
    { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise((ok, bad) => {
    let err = '';
    const t = setTimeout(() => bad(new Error('Chrome did not start: ' + err)), 20000);
    proc.stderr.on('data', d => { err += d; const m = err.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(t); ok(m[1]); } });
    proc.on('exit', c => bad(new Error('Chrome exited ' + c + ': ' + err)));
  });
  const ws = new WebSocket(wsUrl);
  await new Promise((ok, bad) => { ws.onopen = ok; ws.onerror = bad; });
  let id = 0; const waiting = new Map(), listeners = [];
  ws.onmessage = ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id && waiting.has(msg.id)) {
      const { ok, bad } = waiting.get(msg.id); waiting.delete(msg.id);
      msg.error ? bad(new Error(msg.error.message)) : ok(msg.result);
    } else listeners.forEach(f => f(msg));
  };
  const send = (method, params = {}, sessionId) => new Promise((ok, bad) => {
    const n = ++id; waiting.set(n, { ok, bad }); ws.send(JSON.stringify({ id: n, method, params, sessionId }));
  });
  return {
    send, on: f => listeners.push(f),
    async close() { try { await send('Browser.close'); } catch { } ws.close(); await new Promise(r => setTimeout(r, 300)); proc.kill(); try { rmSync(profile, { recursive: true, force: true }); } catch { } },
  };
}

// One tab; `evaluate` runs an expression in the page's global scope and returns its JSON value.
export async function openPage(browser, { width, height, preload = '' }) {
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
  const s = (m, p) => browser.send(m, p, sessionId);
  const errors = [];
  browser.on(msg => {
    if (msg.sessionId !== sessionId) return;
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map(a => a.value ?? a.description).join(' '));
  });
  await s('Runtime.enable'); await s('Page.enable');
  await s('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  if (preload) await s('Page.addScriptToEvaluateOnNewDocument', { source: preload });
  const page = {
    errors, targetId,
    async goto(url) {
      const loaded = new Promise(ok => browser.on(m => { if (m.sessionId === sessionId && m.method === 'Page.loadEventFired') ok(); }));
      await s('Page.navigate', { url }); await loaded;
    },
    async evaluate(expr) {
      const r = await s('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    },
    resize: (w, h) => s('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false }),
    screenshot: async () => Buffer.from((await s('Page.captureScreenshot', { format: 'png' })).data, 'base64'),
    close: () => browser.send('Target.closeTarget', { targetId }),
  };
  return page;
}
