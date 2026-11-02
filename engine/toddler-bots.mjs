// Toddler bots: a headless player for each age (2-5) plays every page of every book in the real engine, in the
// Chrome already on the machine, and the checks that need the browser's own layout run alongside.
//
//   node engine/toddler-bots.mjs preview.html [--runs 100] [--report reports/toddler-bots.json]
//
// Exit 1 when a page is outside its age's band or a layout check fails. Every failure that depends on a layout
// prints the seed that replays it: open the page with ?debug&seed=<seed>.
import { launch, openPage } from './browser.mjs';
import { pathToFileURL } from 'node:url';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : dflt; };
const PAGE = args.find(a => a.endsWith('.html'));
if (!PAGE) { console.error('usage: node engine/toddler-bots.mjs preview.html [--runs 100] [--report reports/toddler-bots.json]'); process.exit(2); }
const RUNS = +opt('runs', 100);
const REPORT = opt('report', 'reports/toddler-bots.json');

// How a toddler plays, per age. These are assumptions, not measurements; watching her play is how they get tuned.
// tapMs: typical gap between taps. pause/pauseMs: how often she stops to look or talk, and for how long.
// aimPx: how far a tap lands from where she meant (CSS px, one standard deviation). wild: taps at nothing in particular.
// look: how likely one tap goes for a critter she can see, for a full-size critter in plain view.
// decoyPull: of the taps that are not for a critter, how many go to a look-alike when there is one.
const TODDLERS = {
  2: { tapMs: 2400, pause: 0.15, pauseMs: [3000, 9000], aimPx: 26, wild: 0.25, look: 0.30, decoyPull: 0.5 },
  3: { tapMs: 1900, pause: 0.12, pauseMs: [3000, 9000], aimPx: 20, wild: 0.18, look: 0.33, decoyPull: 0.5 },
  4: { tapMs: 1600, pause: 0.10, pauseMs: [3000, 8000], aimPx: 14, wild: 0.12, look: 0.36, decoyPull: 0.45 },
  5: { tapMs: 1300, pause: 0.08, pauseMs: [2500, 7000], aimPx: 10, wild: 0.08, look: 0.40, decoyPull: 0.4 },
};
const HALF_HIDDEN_SEEN = 0.5;   // a half-hidden critter is half as likely to be spotted
const HINT_BOOST = [2, 3];      // after a hint, the next 3 taps are twice as likely to go for a critter
const GIVE_UP_MS = 60000;
const TABLETS = [[1024, 768], [1180, 820], [1280, 800]];
const PLAY_ON = TABLETS[0];     // the smallest tablet: the smallest targets

// ------------------------------------------------------------------ in the page: a clock the bots move by hand
// setTimeout, requestAnimationFrame and performance.now run on virtual time, so a minute of play takes milliseconds
// and every run replays. CSS animations still run on real time; only their classes come and go on the virtual clock.
const PRELOAD = `(() => {
  let now = 0, seq = 0; const queue = [];
  window.__errors = [];
  window.__clock = {
    now: () => now,
    advance(ms) { const end = now + ms;
      for (;;) { let k = -1;
        for (let i = 0; i < queue.length; i++) if (queue[i].t <= end && (k < 0 || queue[i].t < queue[k].t || (queue[i].t === queue[k].t && queue[i].id < queue[k].id))) k = i;
        if (k < 0) break;
        const job = queue.splice(k, 1)[0]; now = job.t;
        try { job.fn(...job.args); } catch (e) { window.__errors.push(String(e && e.stack || e)); } }
      now = end; },
    pending: () => queue.length,
  };
  window.setTimeout = (fn, ms = 0, ...a) => { const id = ++seq; queue.push({ id, t: now + Math.max(0, +ms || 0), fn: typeof fn === 'function' ? fn : () => {}, args: a }); return id; };
  window.clearTimeout = id => { const k = queue.findIndex(j => j.id === id); if (k >= 0) queue.splice(k, 1); };
  window.requestAnimationFrame = fn => window.setTimeout(() => fn(now), 16);
  window.cancelAnimationFrame = id => window.clearTimeout(id);
  Object.defineProperty(performance, 'now', { value: () => now, configurable: true });
  addEventListener('error', e => window.__errors.push(String(e.message)));
  // every gain envelope a voice schedules, on the virtual clock, so the bots can add up how loud a moment is
  window.__voices = [];
  const AC = window.BaseAudioContext || window.AudioContext, mk = AC.prototype.createGain;
  AC.prototype.createGain = function () { const g = mk.call(this); g.gain.__ctx = this; return g; };
  const P = AudioParam.prototype, sv = P.setValueAtTime, xr = P.exponentialRampToValueAtTime;
  const rec = (param, kind, v, t) => { if (!param.__ctx) return;
    const at = now / 1000 + (t - param.__ctx.currentTime);
    if (!param.__ev) { param.__ev = []; window.__voices.push(param.__ev); }
    param.__ev.push([at, v, kind]); };
  P.setValueAtTime = function (v, t) { rec(this, 'set', v, t); return sv.call(this, v, t); };
  P.exponentialRampToValueAtTime = function (v, t) { rec(this, 'exp', v, t); return xr.call(this, v, t); };
})();`;

// ------------------------------------------------------------------ in the page: the player and the layout checks
function botSetup() {
  window.__rng = seed => { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  const centre = el => { const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, w: b.width, h: b.height }; };
  window.__open = (bi, pid, age) => { BOOK = LIB[bi]; AGESET = age; AUTO = false; OFFSET = 0; history = []; show(pid); __clock.advance(1); return $('seed').textContent.replace('seed=', ''); };
  window.__tap = (x, y) => {
    const el = document.elementFromPoint(x, y);
    if (!el || !el.closest('#stage')) return null;      // the page's buttons are not part of the hunt
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: x, clientY: y, pointerType: 'touch', isPrimary: true }));
    return el;
  };
  // the layout checks for whatever page is showing
  window.__layout = (minTap) => {
    const out = { problems: [], minFindTap: 1e9, finds: [], decoys: [] };
    const vw = innerWidth, vh = innerHeight;
    for (const g of world.querySelectorAll('.find')) {
      const hit = centre(g.querySelector('.hit')), body = centre(g.querySelector('.body'));
      out.minFindTap = Math.min(out.minFindTap, hit.w);
      out.finds.push({ kind: g.dataset.kind, perch: g.dataset.perch, x: hit.x, y: hit.y, r: hit.w / 2, bw: body.w });
      if (g.dataset.perch === 'none') out.problems.push(`no perch for the ${g.dataset.kind}; it fell back to the middle of the ground`);
      if (hit.w < minTap - 0.5) out.problems.push(`the ${g.dataset.kind}'s tap circle is ${hit.w.toFixed(1)} CSS px across, under ${minTap}`);
      if (body.x < 0 || body.x > vw || body.y < 0 || body.y > vh) { out.problems.push(`the ${g.dataset.kind} is off the screen`); continue; }
      const top = document.elementFromPoint(body.x, body.y);
      if (!top || top.closest('.find') !== g) {
        const what = !top ? 'nothing' : top.closest('.find,.decoy,#stage') === null ? (top.id || top.className || top.tagName) : top.closest('.decoy') ? 'a decoy' : top.closest('.find') ? 'another find' : 'the scene';
        out.problems.push(`a tap on the ${g.dataset.kind} lands on ${what}`);
      }
    }
    for (const d of world.querySelectorAll('.decoy')) {
      const c = centre(d.querySelector('circle'));
      out.decoys.push({ x: c.x, y: c.y, r: c.w / 2 });
      for (const f of out.finds) if (Math.hypot(f.x - c.x, f.y - c.y) < f.r + c.w / 2 - 0.5) out.problems.push(`a decoy overlaps the ${f.kind}'s tap circle`);
    }
    return out;
  };
  // the targets a toddler is asked to tap, with their size in CSS px (short side)
  window.__targets = () => {
    const t = [], add = (what, el) => { if (!el || el.hidden || el.closest('[hidden]')) return; const b = el.getBoundingClientRect(); if (b.width && b.height) t.push({ what, size: Math.min(b.width, b.height) }); };
    world.querySelectorAll('.find .hit').forEach(e => add('find', e));
    world.querySelectorAll('.flapG').forEach(e => add('flap', e));
    world.querySelectorAll('[data-hide] .tap').forEach(e => add('hidden ' + (e.closest('.actor')?.dataset.who || 'actor'), e));
    world.querySelectorAll('[data-n]').forEach(h => { if (+h.dataset.n > 1) add('counting ' + (h.querySelector('.actor')?.dataset.who || 'actor'), h.querySelector('.tap')); });
    ['next', 'back', 'letter'].forEach(id => add(id, $(id)));
    document.querySelectorAll('#choices .choice').forEach(e => add('choice', e));
    return t;
  };
  // one toddler plays the page that is showing until every critter is found or she gives up
  window.__play = (M, seed, opts) => {
    const R = __rng(seed), page = BOOK.pages[cur], n = finds(page).length;
    const gauss = () => { let u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const res = { n, times: [], all: false, tAll: null, hinted: false, hintAt: null, taps: 0, decoyTaps: 0, misses: 0, wild: 0 };
    let t = 0, boost = 0;
    const stage = $('stage').getBoundingClientRect();
    const finds_ = [...world.querySelectorAll('.find')], decoys = [...world.querySelectorAll('.decoy')];
    const actors = [...world.querySelectorAll('.actor .tap')];
    while (found.size < n && t < opts.giveUpMs) {
      let gap = M.tapMs * Math.exp(0.35 * gauss());
      if (R() < M.pause) gap += M.pauseMs[0] + R() * (M.pauseMs[1] - M.pauseMs[0]);
      gap = Math.round(gap);
      __clock.advance(gap);
      t += gap;
      if (hinted && !res.hinted) { res.hinted = true; res.hintAt = t; boost = opts.hintBoost[1]; }
      const left = finds_.filter((g, i) => !found.has(i));
      const w = left.map(g => { const b = g.querySelector('.body').getBoundingClientRect();
        return M.look * Math.min(1, Math.max(0.3, b.width / 64)) * (g.dataset.perch === 'half' ? opts.halfSeen : 1); });
      let pAny = 1 - w.reduce((p, x) => p * (1 - x), 1);
      if (boost > 0) { pAny = Math.min(0.95, pAny * opts.hintBoost[0]); boost--; }
      let x, y, aimed = null;
      if (R() < M.wild) { x = stage.left + R() * stage.width; y = stage.top + R() * stage.height; res.wild++; }
      else if (R() < pAny) {
        let k = R() * w.reduce((a, b) => a + b, 0), i = 0; while (i < w.length - 1 && (k -= w[i]) > 0) i++;
        aimed = left[i]; const b = aimed.querySelector('.body').getBoundingClientRect();
        x = b.left + b.width / 2 + gauss() * M.aimPx; y = b.top + b.height / 2 + gauss() * M.aimPx;
      } else if (decoys.length && R() < M.decoyPull) {
        const d = decoys[Math.floor(R() * decoys.length)].getBoundingClientRect();
        x = d.left + d.width / 2 + gauss() * M.aimPx; y = d.top + d.height / 2 + gauss() * M.aimPx;
      } else if (actors.length && R() < 0.5) {
        const a = actors[Math.floor(R() * actors.length)].getBoundingClientRect();
        x = a.left + a.width / 2 + gauss() * M.aimPx; y = a.top + a.height / 2 + gauss() * M.aimPx;
      } else { x = stage.left + R() * stage.width; y = stage.top + R() * stage.height; }
      const before = found.size, el = __tap(x, y);
      res.taps++;
      if (el && el.closest('.decoy')) res.decoyTaps++;
      if (found.size > before) res.times.push(t);
      else if (aimed) res.misses++;
    }
    res.all = found.size === n; res.tAll = res.all ? res.times[res.times.length - 1] : null;
    __clock.advance(4000);
    return res;
  };
}

// ------------------------------------------------------------------ in node
const pct = (xs, p) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))]; };
const sec = ms => ms == null ? '-' : ms === Infinity ? 'never' : (ms / 1000).toFixed(1);

function loudest(voices, master) {
  // each voice: [[t, value, 'set'|'exp'], ...] in seconds; between events the gain follows the scheduled ramp.
  // Every voice is laid on one timeline in 5 ms steps and the loudest step is the peak.
  const STEP = 0.005, line = new Map();
  for (const raw of voices) {
    const ev = [...raw].sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < ev.length; i++) {
      const [t0, v0] = ev[i], next = ev[i + 1];
      if (!next) break;
      const [t1, v1, kind] = next;
      for (let k = Math.ceil(t0 / STEP); k * STEP < t1; k++) {
        const f = (k * STEP - t0) / (t1 - t0);
        const v = kind === 'exp' && v0 > 0 && v1 > 0 ? v0 * Math.pow(v1 / v0, f) : v0;
        line.set(k, (line.get(k) || 0) + v);
      }
    }
  }
  let peak = 0, when = 0;
  for (const [k, v] of line) if (v > peak) { peak = v; when = k * STEP; }
  return { peak: peak * master, when };
}

async function main() {
  const t0 = Date.now();
  const browser = await launch();
  const url = pathToFileURL(resolve(PAGE)).href;
  const failures = [], warnings = [], phase = name => { console.error(`${name}: ${((Date.now() - t0) / 1000).toFixed(1)} s`); };
  const page = await openPage(browser, { width: PLAY_ON[0], height: PLAY_ON[1], preload: PRELOAD });
  await page.goto(url);
  await page.evaluate(`(${botSetup.toString()})()`);
  const books = await page.evaluate(`LIB.map((b,i)=>({i,id:b.id,title:b.title,pages:Object.keys(b.pages).map(p=>({id:p,finds:finds(b.pages[p]).length}))}))`);
  const tables = await page.evaluate('TABLES');
  const minTap = tables.tap.minCss, { quickMs, slowMs } = tables.auto;

  phase('loaded');
  // ---- measured tap sizes on each tablet, every page at every age; then a resize without re-showing the page
  const minSize = {}, small = new Map();
  for (const [w, h] of TABLETS) {
    await page.resize(w, h);
    for (const b of books) for (const p of b.pages) for (const age of [2, 3, 4, 5]) {
      const seed = await page.evaluate(`__open(${b.i},${JSON.stringify(p.id)},${age})`);
      for (const t of await page.evaluate('__targets()')) {
        const key = t.what.split(' ')[0];
        minSize[key] = Math.min(minSize[key] ?? 1e9, t.size);
        if (t.size < minTap - 0.5) {
          const key = `${b.id}/${p.id} on ${w}x${h}: ${t.what}`, s = small.get(key) || { size: 1e9, ages: new Set(), seed };
          s.size = Math.min(s.size, t.size); s.ages.add(age); small.set(key, s);
        }
      }
    }
  }
  for (const [key, s] of small) failures.push(`tap floor: ${key} is ${s.size.toFixed(1)} CSS px, under ${minTap} (ages ${[...s.ages].join(',')}; seed ${s.seed})`);
  for (const b of books) for (const p of b.pages.filter(p => p.finds)) {
    await page.resize(TABLETS[2][0], TABLETS[2][1]);
    const seed = await page.evaluate(`__open(${b.i},${JSON.stringify(p.id)},5)`);
    await page.resize(PLAY_ON[0], PLAY_ON[1]);
    await page.evaluate('__clock.advance(400)');
    const sizes = await page.evaluate(`[...world.querySelectorAll('.find .hit')].map(e=>e.getBoundingClientRect().width)`);
    for (const s of sizes) if (s < minTap - 0.5) failures.push(`tap floor after a resize: ${b.id}/${p.id}: a find's tap circle is ${s.toFixed(1)} CSS px (seed ${seed})`);
  }
  await page.resize(PLAY_ON[0], PLAY_ON[1]);

  phase('tap sizes');
  // ---- the same seed lays the page out the same way, here and in a fresh tab opened with ?seed=
  const sig = `[...document.querySelectorAll('.find,.decoy')].map(g=>g.getAttribute('transform')).join('|')`;
  const replay = await openPage(browser, { width: PLAY_ON[0], height: PLAY_ON[1], preload: PRELOAD });
  let replays = 0;
  for (const b of books) { const p = b.pages.find(p => p.finds); if (!p) continue;
    for (const age of [2, 3, 4, 5]) {
      const seed = await page.evaluate(`__open(${b.i},${JSON.stringify(p.id)},${age})`);
      const a = await page.evaluate(sig);
      await replay.goto(url + '?debug&seed=' + encodeURIComponent(seed));
      const c = await replay.evaluate(sig);
      replays++;
      if (a !== c) failures.push(`determinism: ?seed=${seed} does not lay the page out the same way`);
    } }

  const replayErrors = [...replay.errors];
  await replay.close();
  await browser.send('Target.activateTarget', { targetId: page.targetId });   // a tab in the background runs many times slower
  phase('replays');
  // ---- the toddlers
  const rows = [];
  for (const age of [2, 3, 4, 5]) {
    for (const b of books) for (const p of b.pages) {
      if (!p.finds) continue;
      const runs = [];
      for (let k = 0; k < RUNS; k++) {
        const seed = await page.evaluate(`__open(${b.i},${JSON.stringify(p.id)},${age})`);
        const lay = await page.evaluate(`__layout(${minTap})`);
        for (const pr of lay.problems) failures.push(`layout: ${b.id}/${p.id} age ${age}: ${pr} (seed ${seed})`);
        const r = await page.evaluate(`__play(${JSON.stringify(TODDLERS[age])}, ${age * 100003 + k * 7919 + p.id.length}, ${JSON.stringify({ giveUpMs: GIVE_UP_MS, hintBoost: HINT_BOOST, halfSeen: HALF_HIDDEN_SEEN })})`);
        r.seed = seed; runs.push(r);
      }
      const tAll = runs.map(r => r.all ? r.tAll : Infinity);
      const row = {
        book: b.id, page: p.id, age, finds: p.finds, runs: runs.length,
        p50: pct(tAll, 0.5), p90: pct(tAll, 0.9), perFindP50: pct(tAll.map(x => x / p.finds), 0.5),
        hintRate: runs.filter(r => r.hinted).length / runs.length,
        gaveUp: runs.filter(r => !r.all).length / runs.length,
        autoUp: runs.filter(r => r.all && r.tAll <= quickMs && !r.hinted).length / runs.length,
        autoDown: runs.filter(r => r.hinted || !r.all || r.tAll > slowMs).length / runs.length,
        decoyTaps: runs.reduce((s, r) => s + r.decoyTaps, 0) / runs.length,
        missRate: runs.reduce((s, r) => s + r.misses, 0) / Math.max(1, runs.reduce((s, r) => s + r.taps, 0)),
        taps: runs.reduce((s, r) => s + r.taps, 0) / runs.length,
        times: tAll, hintAt: runs.map(r => r.hintAt),
      };
      rows.push(row);
    }
  }

  phase('toddlers');
  // ---- loudness of everything the toddlers did
  const loud = await page.evaluate(`(${loudest.toString()})(__voices, ${tables.sound.masterGain})`);
  const voices = await page.evaluate('__voices.length');
  const errors = [...page.errors, ...(await page.evaluate('__errors')), ...replayErrors];
  for (const e of errors) failures.push('engine error: ' + e);

  const report = { generated: new Date().toISOString(), page: PAGE, playedOn: PLAY_ON, runsPerPage: RUNS, model: TODDLERS,
    hint: { halfHiddenSeen: HALF_HIDDEN_SEEN, boost: HINT_BOOST }, auto: tables.auto, rows, minTargetCss: minSize, replays,
    loudest: loud, voices, failures, warnings };
  await finish(report, rows, { quickMs, slowMs, minTap, bots: tables.bots });
  await browser.close();
  console.log(`toddler bots: ${rows.length} page-age rows, ${rows.length * RUNS} runs, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  process.exit(report.failures.length ? 1 : 0);
}

// Each age's band: the median time per critter and how often she gives up. A page well over the other pages of its
// age is a warning, not a failure: it may be harder on purpose.
function bands(report, rows, bots) {
  if (RUNS < bots.minRuns) { report.warnings.push(`bands not checked: ${RUNS} runs a page is too few to judge a page (${bots.minRuns} or more)`); return; }
  for (const age of [2, 3, 4, 5]) {
    const band = bots.band[age], mine = rows.filter(r => r.age === age);
    if (!mine.length) continue;
    const typical = pct(mine.map(r => r.perFindP50), 0.5);
    for (const r of mine) {
      const where = `${r.book}/${r.page} age ${age}`;
      if (r.perFindP50 > band.perFindP50Ms) report.failures.push(`band: ${where}: ${sec(r.perFindP50)} s a critter (median), over ${sec(band.perFindP50Ms)} s`);
      if (r.gaveUp > band.gaveUp) report.failures.push(`band: ${where}: gave up in ${(r.gaveUp * 100).toFixed(0)}% of runs, over ${(band.gaveUp * 100).toFixed(0)}%`);
      if (r.perFindP50 > typical * bots.harderThanAge) report.warnings.push(`harder than the rest of age ${age}: ${where}: ${sec(r.perFindP50)} s a critter against ${sec(typical)} s typical`);
    }
  }
}

// What the auto rule does to a child playing right at her age, and thresholds per critter that would make it step up
// on her quickest fifth of pages and down on her slowest fifth.
function autoSuggestions(rows, { quickMs, slowMs }) {
  const out = {};
  for (const age of [2, 3, 4, 5]) {
    const runs = rows.filter(r => r.age === age).flatMap(r => r.times.map((t, i) => ({ t, finds: r.finds, hinted: r.hintAt[i] != null })));
    if (!runs.length) continue;
    const rate = (up, down) => ({ up: runs.filter(up).length / runs.length, down: runs.filter(down).length / runs.length });
    const perFind = runs.map(r => r.t / r.finds);
    const q = Math.round(pct(perFind, 0.2) / 500) * 500, s = Math.round(pct(perFind, 0.8) / 1000) * 1000;
    out[age] = {
      now: rate(r => r.t <= quickMs && !r.hinted, r => r.hinted || r.t > slowMs),
      nowByFinds: Object.fromEntries([1, 2, 3].map(n => { const m = runs.filter(r => r.finds === n);
        return [n, m.length ? { up: m.filter(r => r.t <= quickMs && !r.hinted).length / m.length, down: m.filter(r => r.hinted || r.t > slowMs).length / m.length } : null]; })),
      hintRate: runs.filter(r => r.hinted).length / runs.length,
      perFindMs: { p20: pct(perFind, 0.2), p50: pct(perFind, 0.5), p80: pct(perFind, 0.8) },
      suggest: { quickMsPerFind: q, slowMsPerFind: s },
      withSuggestion: rate(r => r.t <= q * r.finds && !r.hinted, r => r.hinted || r.t > s * r.finds),
      withSuggestionNoHintStep: rate(r => r.t <= q * r.finds && !r.hinted, r => r.t > s * r.finds),
    };
  }
  return out;
}

async function finish(report, rows, { quickMs, slowMs, minTap, bots }) {
  bands(report, rows, bots);
  report.autoSuggestions = autoSuggestions(rows, { quickMs, slowMs });
  mkdirSync(dirname(resolve(REPORT)), { recursive: true });
  writeFileSync(REPORT, JSON.stringify(report, null, 1));
  console.log('age  book/page                            finds  p50 s  p90 s  hint  auto+  auto-  decoy taps');
  for (const r of rows) console.log(`${r.age}    ${(r.book.replace(/^\d{4}-\d\d-\d\d-/, '') + '/' + r.page).padEnd(36)} ${String(r.finds).padStart(5)}  ${sec(r.p50).padStart(5)}  ${sec(r.p90).padStart(5)}  ${(r.hintRate * 100).toFixed(0).padStart(3)}%  ${(r.autoUp * 100).toFixed(0).padStart(4)}%  ${(r.autoDown * 100).toFixed(0).padStart(4)}%  ${r.decoyTaps.toFixed(1).padStart(5)}`);
  console.log(`smallest targets (CSS px): ${Object.entries(report.minTargetCss).map(([k, v]) => `${k} ${v.toFixed(0)}`).join(', ')}; floor ${minTap}`);
  console.log(`loudest moment: summed gain ${report.loudest.peak.toFixed(3)} over ${report.voices} voices`);
  const pc = x => (x * 100).toFixed(0).padStart(3) + '%';
  console.log(`auto now (${sec(quickMs)} s up, ${sec(slowMs)} s down, a hint steps down), a child playing at her age:`);
  for (const [age, a] of Object.entries(report.autoSuggestions)) {
    const by = Object.entries(a.nowByFinds).filter(([, v]) => v).map(([n, v]) => `${n} find${n > 1 ? 's' : ''} ${pc(v.up).trim()} up/${pc(v.down).trim()} down`).join(', ');
    console.log(`  age ${age}: up ${pc(a.now.up)}, down ${pc(a.now.down)} (hint in ${pc(a.hintRate).trim()} of runs); ${by}`);
  }
  console.log('suggested, per critter on the page (up on her quickest fifth, down on her slowest fifth):');
  for (const [age, a] of Object.entries(report.autoSuggestions))
    console.log(`  age ${age}: up under ${sec(a.suggest.quickMsPerFind)} s, down over ${sec(a.suggest.slowMsPerFind)} s a critter -> up ${pc(a.withSuggestion.up)}, down ${pc(a.withSuggestion.down)}; if a hint did not step down: down ${pc(a.withSuggestionNoHintStep.down)}`);
  for (const w of report.warnings) console.log('warning: ' + w);
  for (const f of report.failures) console.log(f);
}

main().catch(e => { console.error(e); process.exit(2); });
