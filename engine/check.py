"""Build-time checks: the book rules, the budgets, the gentle rules, the page statechart and a comment lint.
Stdlib only. build.py runs every check before it writes anything; a problem stops the build.

  python -I engine/check.py books/*.json          run the checks on their own
  python -I engine/check.py --lint books/*.json   also list every comment the lint flagged

Each problem is one plain line. Warnings print but never stop the build.
Checks that need the browser's own layout (decoys against finds, measured tap sizes, the toddler bots)
live in engine/toddler-bots.mjs.
"""
import json, os, re, sys, tokenize, io

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# Tablets the tap floor is measured on, landscape CSS px: iPad 9.7", iPad Air, 10" Android / Fire HD 10.
TABLETS = [(1024, 768), (1180, 820), (1280, 800)]
STAGE_W, STAGE_H = 1600, 1000
FIND_BOX = (40, 170, 1560, 1000)          # x0, y0, x1, y1: the part of the world a find may sit in (view top is y 170)
PERCH_GAP = 150                           # pickPerch keeps perched finds this far apart

PAGE_BUDGET = 200 * 1024                  # one-page build: 156.8 KB on 2026-11-02, about 30% headroom
SITE_INDEX_BUDGET = 200 * 1024            # site/index.html: 157.6 KB on 2026-11-02
BOOK_BUDGET = 16 * 1024                   # one book file: largest today 8.6 KB

# art-layer-spec.md section 6, (target, hard limit) in bytes
KB = 1024
ART_LIMITS = {'plate': (300 * KB, 400 * KB), 'door': (30 * KB, 60 * KB), 'character': (80 * KB, 120 * KB),
              'sunmoon': (60 * KB, 100 * KB)}
ART_PAGE = (600 * KB, 900 * KB)
ART_BOOK = (3 * 1024 * KB, 5 * 1024 * KB)

ANIM_FLOOR_S = 0.3        # no one-pass animation runs faster than this, after the age pace speeds it up
FLASH_MAX_HZ = 3.0        # WCAG 2.3.1: no more than three flashes a second
VOICE_GAIN_CAP = 0.25     # peak gain of any one synthesized voice
MASTER_GAIN_CAP = 1.0
BURST_CALM_MIN_MS = 800   # a burst stays up long enough to see at every age

# Fast on purpose: wings read as buzzing or fluttering, they are small parts, and they move rather than flash.
FAST_OK = {'flapL', 'flapR', 'flap', 'flapW'}


class Report:
    def __init__(self):
        self.problems, self.warnings, self.numbers, self.lint = [], [], [], []

    def fail(self, msg): self.problems.append(msg)
    def warn(self, msg): self.warnings.append(msg)
    def note(self, msg): self.numbers.append(msg)


# ---------------------------------------------------------------- reading JavaScript without running it

def scan_js(src):
    """Blank out strings, template text, regex literals and comments (newlines kept), so braces and keys can be
    counted on what is left. Returns (code, comments); comments are (offset, text)."""
    out, comments = list(src), []
    i, n = 0, len(src)
    stack = []                  # 'T' inside a template literal, an int = brace depth inside a ${ } expression
    last = ''                   # last significant code character, to tell a regex from a division

    def blank(a, b):
        for k in range(a, b):
            if out[k] != '\n':
                out[k] = ' '

    while i < n:
        c = src[i]
        if stack and stack[-1] == 'T':
            if c == '\\':
                blank(i, i + 2); i += 2; continue
            if c == '`':
                stack.pop(); i += 1; last = '`'; continue
            if src.startswith('${', i):
                stack.append(0); i += 2; last = '{'; continue
            blank(i, i + 1); i += 1; continue
        if src.startswith('//', i):
            j = src.find('\n', i); j = n if j < 0 else j
            comments.append((i, src[i + 2:j])); blank(i, j); i = j; continue
        if src.startswith('/*', i):
            j = src.find('*/', i + 2); j = n if j < 0 else j + 2
            comments.append((i, src[i + 2:j - 2])); blank(i, j); i = j; continue
        if c in '"\'':
            j = i + 1
            while j < n and src[j] != c and src[j] != '\n':
                j += 2 if src[j] == '\\' else 1
            blank(i + 1, j); i = j + 1; last = c; continue
        if c == '`':
            stack.append('T'); i += 1; continue
        if c == '/' and (last == '' or last in '(,=:[!&|?{};+-*%<>~^' or src[max(0, i - 7):i].rstrip().endswith('return')):
            j, cls = i + 1, False
            while j < n and src[j] != '\n':
                if src[j] == '\\': j += 2; continue
                if src[j] == '[': cls = True
                elif src[j] == ']': cls = False
                elif src[j] == '/' and not cls: break
                j += 1
            blank(i + 1, j); i = j + 1; last = '/'; continue
        if c == '{' and stack and isinstance(stack[-1], int):
            stack[-1] += 1
        elif c == '}' and stack and isinstance(stack[-1], int):
            if stack[-1] == 0:
                stack.pop(); i += 1; last = '}'; continue
            stack[-1] -= 1
        if not c.isspace():
            last = c
        i += 1
    return ''.join(out), comments


def object_keys(code, opener):
    """Keys at the top level of every object literal that starts right after `opener` in blanked code."""
    keys = set()
    for m in re.finditer(re.escape(opener), code):
        i = m.end() - 1
        while code[i] != '{':
            i += 1
        depth, j = 0, i
        while j < len(code):
            ch = code[j]
            if ch in '{([':
                depth += 1
            elif ch in '})]':
                depth -= 1
                if depth == 0:
                    break
            elif depth == 1:
                k = re.match(r'[,{\s]*([A-Za-z_$][\w$]*)\s*:', code[j:])
                if k and (code[j] in ',{' or code[j - 1] in ',{'):
                    keys.add(k.group(1))
            j += 1
    return keys


def call_args(code, start):
    """The top-level arguments of the call whose '(' is at `start`, as (offset, text) pairs of the blanked code."""
    depth, j, args, a = 0, start, [], start + 1
    while j < len(code):
        ch = code[j]
        if ch in '([{':
            depth += 1
        elif ch in ')]}':
            depth -= 1
            if depth == 0:
                args.append((a, code[a:j])); return args
        elif ch == ',' and depth == 1:
            args.append((a, code[a:j])); a = j + 1
        j += 1
    return args


def line_of(src, offset):
    return src.count('\n', 0, offset) + 1


# ---------------------------------------------------------------- the engine, as data

class Engine:
    def __init__(self):
        self.template = open(os.path.join(HERE, 'book-template.html'), encoding='utf-8').read()
        self.kit = open(os.path.join(HERE, 'kit.js'), encoding='utf-8').read()
        self.tables = json.load(open(os.path.join(HERE, 'tables.json'), encoding='utf-8'))
        css = re.search(r'<style>(.*?)</style>', self.template, re.S)
        self.css, self.css_at = css.group(1), css.start(1)
        js = re.search(r'<script>(.*?)</script>', self.template, re.S)
        self.js, self.js_at = js.group(1), js.start(1)
        self.js_code, self.js_comments = scan_js(self.js)
        kit_code, self.kit_comments = scan_js(self.kit)
        code = kit_code + '\n' + self.js_code
        self.pieces = object_keys(code, 'const P={') | object_keys(code, 'Object.assign(P,{') | set(re.findall(r'\bP\.(\w+)=', code))
        self.finds = object_keys(code, 'const FINDS={')
        self.flaps = object_keys(code, 'const FLAP={')
        self.decoys = object_keys(code, 'const DECOY={')
        self.scenes = object_keys(code, 'const SCENE={') | object_keys(code, 'Object.assign(SCENE,{')
        self.sfx = object_keys(code, 'const sfx={') | set(re.findall(r'\bsfx\.(\w+)=', code))

    def ages(self):
        return {int(a): row for a, row in self.tables['ages'].items()}

    def js_line(self, offset):
        return line_of(self.template, self.js_at + offset)


# ---------------------------------------------------------------- 1. book rules

def plain(html):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]*>', ' ', html or '')).strip()


def check_graph(book, r):
    name, pages, start = book['id'], book['pages'], book.get('start')
    if start not in pages:
        r.fail(f'{name}: the start page "{start}" does not exist'); return
    nxt = {}
    for pid, p in pages.items():
        ways = [k for k in ('next', 'choice', 'end') if p.get(k)]
        if len(ways) != 1:
            r.fail(f'{name}/{pid}: a page needs exactly one of next, choice or end (has {", ".join(ways) or "none"})')
        targets = [p['next']] if p.get('next') else [o.get('go') for o in (p.get('choice') or {}).get('options', [])]
        for t in targets:
            if t not in pages:
                r.fail(f'{name}/{pid}: goes to "{t}", which is not a page')
        nxt[pid] = [t for t in targets if t in pages]
    seen, todo = set(), [start]
    while todo:
        pid = todo.pop()
        if pid not in seen:
            seen.add(pid); todo += nxt[pid]
    for pid in pages:
        if pid not in seen:
            r.warn(f'{name}/{pid}: no path from the start reaches this page')
    ends = {pid for pid, p in pages.items() if p.get('end')}
    back = {pid: [q for q in pages if pid in nxt[q]] for pid in pages}
    can_end, todo = set(), list(ends)
    while todo:
        pid = todo.pop()
        if pid not in can_end:
            can_end.add(pid); todo += back[pid]
    for pid in sorted(seen - can_end):
        r.fail(f'{name}/{pid}: no path from here reaches an end page')


def check_words(book, r):
    for pid, p in book['pages'].items():
        if not plain(p.get('text')):
            r.fail(f'{book["id"]}/{pid}: the page has no words for the grown-up to read')


def check_names(book, eng, r):
    art = book.get('art') or {}
    for pid, p in book['pages'].items():
        where = f'{book["id"]}/{pid}'
        scenes = [p.get('scene')] + [o.get('scene') for o in (p.get('choice') or {}).get('options', [])]
        for s in scenes:
            if s not in eng.scenes and s not in art:
                r.fail(f'{where}: scene "{s}" is not in the kit or the book\'s art')
        pieces = list(p.get('actors') or []) + list(p.get('front') or [])
        for o in (p.get('choice') or {}).get('options', []):
            pieces += o.get('actors') or []
        for f in p.get('flaps') or []:
            pieces += [h for h in ([f['hide']] if isinstance(f.get('hide'), dict) else f.get('hide') or [])]
            if f.get('type') not in eng.flaps:
                r.fail(f'{where}: flap type "{f.get("type")}" is not one of {", ".join(sorted(eng.flaps))}')
        for a in pieces:
            if a.get('who') not in eng.pieces:
                r.fail(f'{where}: "{a.get("who")}" is not a piece the kit can draw (it would silently vanish)')
        for f in finds_of(p):
            if f[0] not in eng.finds:
                r.fail(f'{where}: find "{f[0]}" is not one of {", ".join(sorted(eng.finds))}')
        if p.get('sound') and p['sound'] not in eng.sfx:
            r.fail(f'{where}: sound "{p["sound"]}" is not one of {", ".join(sorted(eng.sfx))}')


def finds_of(p):
    return p.get('find') or ([['ladybug'] + list(p['bug'])] if p.get('bug') else [])


def perch_pool(p, eng):
    big, nobig = 1.35, {'hive', 'shell', 'coral', 'kelp', 'rockS', 'wreck', 'cabbage', 'carrot', 'scarecrow', 'leafBig'}
    pool = [dict(q) for q in eng.tables['perches'].get(p.get('scene'), [])]
    for a in p.get('actors') or []:
        if a.get('hide'):
            continue
        sc = (a.get('s') or 1) * (1 if a['who'] in nobig else big)
        for o in eng.tables['onTop'].get(a['who'], []):
            pool.append({'x': a['x'] + o['dx'] * sc, 'y': a['y'] + o['dy'] * sc, 'open': o.get('open', True),
                         'fit': o.get('fit'), 'on': a['who']})
    for q in p.get('perches') or []:
        pool.append(dict(q, open=q.get('open', True)))
    return pool


def check_finds(book, eng, r):
    x0, y0, x1, y1 = FIND_BOX
    for pid, p in book['pages'].items():
        where = f'{book["id"]}/{pid}'
        fl = finds_of(p)
        fixed = [f for f in fl if len(f) >= 3]
        free = [f for f in fl if len(f) < 3]
        for f in fixed:
            x, y = f[1], f[2]
            if not all(isinstance(v, (int, float)) for v in (x, y)) or not (x0 <= x <= x1 and y0 <= y <= y1):
                r.fail(f'{where}: the {f[0]} at {x},{y} is outside the page ({x0}-{x1} across, {y0}-{y1} down)')
        pool = perch_pool(p, eng)
        for q in pool:
            if not (0 <= q['x'] <= STAGE_W and y0 <= q['y'] <= y1):
                r.fail(f'{where}: perch "{q.get("on", "")}" at {q["x"]:.0f},{q["y"]:.0f} is outside the page')
            c = q.get('cover')
            if isinstance(c, dict) and c.get('who') not in eng.pieces:
                r.fail(f'{where}: perch cover "{c.get("who")}" is not a piece the kit can draw')
            if isinstance(c, int) and not 0 <= c < len(p.get('front') or []):
                r.fail(f'{where}: perch cover {c} points past the page\'s front list')
        if not free:
            continue
        for age in (2, 3, 4, 5):
            taken = [q for q in pool if any(((f[1] - q['x']) ** 2 + (f[2] - q['y']) ** 2) ** .5 < 120 for f in fixed)]
            open_ = [q for q in pool if q not in taken and (age > 2 or q['open'])
                     and not any(((f[1] - q['x']) ** 2 + (f[2] - q['y']) ** 2) ** .5 < PERCH_GAP for f in fixed)]
            if not perches_fit(free, open_):
                kinds = ', '.join(f[0] for f in free)
                r.fail(f'{where}: at age {age} there are not enough perches {PERCH_GAP} apart for {kinds} on scene "{p.get("scene")}"')


def perches_fit(free, pool):
    """Some way to seat every coordinate-free find on its own perch, the perches far enough apart."""
    def seat(i, chosen):
        if i == len(free):
            return True
        for q in pool:
            if q in chosen or (q.get('for') and free[i][0] not in q['for']):
                continue
            if all(((q['x'] - c['x']) ** 2 + (q['y'] - c['y']) ** 2) ** .5 >= PERCH_GAP for c in chosen) and seat(i + 1, chosen + [q]):
                return True
        return False
    return seat(0, [])


# The sound each letter tile must say: word -> (spelling it starts with, sound). Unknown words are flagged for review.
FIRST_SOUND = {
    'ant': ('a', '/a/'), 'apple': ('a', '/a/'), 'bee': ('b', '/b/'), 'bunny': ('b', '/b/'), 'bug': ('b', '/b/'),
    'cat': ('c', '/k/'), 'cow': ('c', '/k/'), 'crab': ('c', '/k/'), 'chick': ('ch', '/ch/'), 'cereal': ('c', '/s/'),
    'dog': ('d', '/d/'), 'duck': ('d', '/d/'), 'egg': ('e', '/e/'), 'fish': ('f', '/f/'), 'frog': ('f', '/f/'),
    'goat': ('g', '/g/'), 'giraffe': ('g', '/j/'), 'hen': ('h', '/h/'), 'horse': ('h', '/h/'), 'jellyfish': ('j', '/j/'),
    'kite': ('k', '/k/'), 'knight': ('kn', '/n/'), 'lamb': ('l', '/l/'), 'moon': ('m', '/m/'), 'mouse': ('m', '/m/'),
    'nest': ('n', '/n/'), 'octopus': ('o', '/o/'), 'owl': ('ow', '/ow/'), 'phone': ('ph', '/f/'), 'pig': ('p', '/p/'),
    'sheep': ('sh', '/sh/'), 'ship': ('sh', '/sh/'), 'snail': ('s', '/s/'), 'sun': ('s', '/s/'), 'thumb': ('th', '/th/'),
    'turtle': ('t', '/t/'), 'whale': ('w', '/w/'), 'yak': ('y', '/y/'), 'zebra': ('z', '/z/'),
}


def check_letters(book, r):
    for pid, p in book['pages'].items():
        lt = p.get('letter')
        if not lt:
            continue
        where = f'{book["id"]}/{pid}'
        if len(lt) != 3:
            r.fail(f'{where}: a letter tile is [tile, sound, word], got {lt}'); continue
        tile, sound, word = lt
        spelled = tile.split()[-1].lower() if ' ' in tile else tile[:len(tile) // 2].lower()   # "Bb" -> b, "Ch ch" -> ch
        if word.lower() not in FIRST_SOUND:
            r.warn(f'{where}: letter tile word "{word}" is not in the sound table; have a grown-up check {tile} {sound}')
            continue
        want_spell, want_sound = FIRST_SOUND[word.lower()]
        if sound != want_sound:
            r.fail(f'{where}: "{word}" starts with the sound {want_sound}, the tile says {sound}')
        if spelled != want_spell:
            r.fail(f'{where}: "{word}" starts with "{want_spell}", the tile shows {tile}')


def css_px(css, selector, prop):
    m = re.search(r'(?:^|[}\s])' + re.escape(selector) + r'\{([^}]*)\}', css)
    if not m:
        return None
    v = re.search(r'(?:^|;)' + prop + r':(\d+(?:\.\d+)?)px', m.group(1))
    return float(v.group(1)) if v else None


def check_tap_floor(books, eng, r):
    """Floor: every target a toddler is asked to tap is at least minCss CSS px across on each tablet in TABLETS.
    The stage is 1600x1000 world units fitted inside the screen, so one world unit is min(W/1600, H/1000) CSS px.
    A find's tap circle has world radius max(findHitR * k, minCss / 2 / pxPerWorld), k the age's find scale.
    Buttons are read from the CSS. Home, Mute and the gear are grown-up hold gates: small on purpose.
    Decoys are exempt: a tap that misses one only sparkles. Measured sizes are checked by the toddler bots."""
    t = eng.tables['tap']
    floor = t['minCss']
    if floor < 64:
        r.fail(f'tables.json: tap.minCss is {floor}, the floor is 64 CSS px')
    per = min(min(w / STAGE_W, h / STAGE_H) for w, h in TABLETS)
    for age, row in eng.ages().items():
        k = row['findScale']
        d = 2 * max(t['findHitR'] * k * per, floor / 2)
        if d < floor:
            r.fail(f'age {age}: a find\'s tap circle is {d:.0f} CSS px across on the smallest tablet, under {floor}')
        r.note(f'tap floor: age {age} finds draw at scale {k}, tap circle {d:.0f} CSS px across on {TABLETS[0][0]}x{TABLETS[0][1]}')
    for sel in ('#next', '#back', '.navbtn'):
        for prop in ('width', 'height'):
            v = css_px(eng.css, sel, prop)
            if v is not None and v < floor:
                r.fail(f'engine CSS: {sel} is {v:.0f} px {prop}, under the {floor} px tap floor')
    lh = css_px(eng.css, '#letter', 'height')
    if lh is not None and lh < floor:
        r.fail(f'engine CSS: the letter tile is {lh:.0f} px tall, under the {floor} px tap floor')
    for b in books:
        for pid, p in b['pages'].items():
            for i, f in enumerate(p.get('flaps') or []):
                side = min(f.get('w', 0), f.get('h', 0)) * per
                if side < floor:
                    r.fail(f'{b["id"]}/{pid}: flap {i} is {side:.0f} CSS px on its short side, under {floor}')


def check_books(books, eng, r):
    ids = [b.get('id') for b in books]
    for dup in {i for i in ids if ids.count(i) > 1}:
        r.fail(f'two books share the id "{dup}"')
    for b in books:
        check_graph(b, r)
        check_words(b, r)
        check_names(b, eng, r)
        check_finds(b, eng, r)
        check_letters(b, r)
    check_tap_floor(books, eng, r)
    pages = sum(len(b['pages']) for b in books)
    nfinds = sum(len(finds_of(p)) for b in books for p in b['pages'].values())
    r.note(f'book rules: {len(books)} books, {pages} pages, {nfinds} finds')


# ---------------------------------------------------------------- 2. budgets

def art_kind(name):
    n = os.path.basename(name).lower()
    if n.startswith('plate'):
        return 'plate'
    if n.startswith('door'):
        return 'door'
    if n.startswith(('sun', 'moon')):
        return 'sunmoon'
    return 'character'


def art_files(books, book_files):
    """Every art file present: the art/ folder, plus any picture a book's "art" entry names."""
    found = {}
    art_dir = os.path.join(ROOT, 'art')
    for dirpath, _, names in os.walk(art_dir):
        for n in names:
            if n.lower().endswith(('.webp', '.png', '.jpg', '.jpeg', '.avif')):
                found[os.path.normpath(os.path.join(dirpath, n))] = None
    for b, f in zip(books, list(book_files) + [None] * len(books)):
        for scene, d in (b.get('art') or {}).items():
            for src in [d.get('src')] + [x.get('src') for x in (d.get('art') or {}).values() if isinstance(x, dict)]:
                if not src:
                    continue
                for base in [ROOT] + ([os.path.dirname(os.path.abspath(f))] if f else []):
                    path = os.path.normpath(os.path.join(base, src))
                    if os.path.exists(path):
                        found[path] = b['id']; break
                else:
                    pass   # a missing picture falls back to the drawn scene
    return list(found)


def check_budgets(books, book_files, page, site_index, r):
    def size(label, data, limit):
        n = len(data.encode('utf-8'))
        (r.fail if n > limit else r.note)(f'budget: {label} is {n / 1024:.1f} KB of {limit / 1024:.0f} KB')
    if page is not None:
        size('the one-page build', page, PAGE_BUDGET)
    if site_index is not None:
        size('site/index.html', site_index, SITE_INDEX_BUDGET)
    for f in book_files:
        n = os.path.getsize(f)
        if n > BOOK_BUDGET:
            r.fail(f'budget: {os.path.basename(f)} is {n / 1024:.1f} KB, over {BOOK_BUDGET / 1024:.0f} KB')
    files = art_files(books, book_files)
    by_scene = {}
    for path in files:
        n, kind = os.path.getsize(path), art_kind(path)
        target, hard = ART_LIMITS[kind]
        rel = os.path.relpath(path, ROOT)
        if n > hard:
            r.fail(f'art budget: {rel} is {n / KB:.0f} KB, over the {hard / KB:.0f} KB limit for a {kind}')
        elif n > target:
            r.warn(f'art budget: {rel} is {n / KB:.0f} KB, over the {target / KB:.0f} KB target for a {kind}')
        by_scene.setdefault(os.path.dirname(path), []).append(n)
    for scene, sizes in by_scene.items():
        total, (target, hard) = sum(sizes), ART_PAGE
        rel = os.path.relpath(scene, ROOT)
        if total > hard:
            r.fail(f'art budget: {rel} (the plate and layers of one page) is {total / KB:.0f} KB, over {hard / KB:.0f} KB')
        elif total > target:
            r.warn(f'art budget: {rel} is {total / KB:.0f} KB, over the {target / KB:.0f} KB page target')
    total = sum(os.path.getsize(p) for p in files)
    if total > ART_BOOK[1]:
        r.fail(f'art budget: all art together is {total / KB / 1024:.1f} MB, over {ART_BOOK[1] / KB / 1024:.0f} MB for the offline cache')
    elif total > ART_BOOK[0]:
        r.warn(f'art budget: all art together is {total / KB / 1024:.1f} MB, over the {ART_BOOK[0] / KB / 1024:.0f} MB target')
    r.note(f'budget: {len(files)} art files ({total / KB:.0f} KB)')


# ---------------------------------------------------------------- run

def run_all(books, book_files=(), page=None, site_index=None, lint=False):
    eng = Engine()
    r = Report()
    check_books(books, eng, r)
    check_budgets(books, book_files, page, site_index, r)
    return r


def summary(r):
    return f'checks: {len(r.problems)} problems, {len(r.warnings)} warnings' + (f', comment lint flagged {len(r.lint)}' if r.lint else '')


def print_report(r, lint=False, out=sys.stdout):
    for w in r.warnings:
        print('warning: ' + w, file=out)
    for p in r.problems:
        print(p, file=out)


def main(argv):
    lint = '--lint' in argv
    files = [a for a in argv if not a.startswith('--')]
    books = [json.load(open(f, encoding='utf-8')) for f in files]
    r = run_all(books, files, lint=lint)
    for n in r.numbers:
        print(n)
    print_report(r, lint)
    print(summary(r))
    return 1 if r.problems else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
