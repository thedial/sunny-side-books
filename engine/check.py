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

PAGE_BUDGET = 256 * 1024                  # one-page build; the build prints today's size
SITE_INDEX_BUDGET = 256 * 1024            # site/index.html
BOOK_BUDGET = 16 * 1024                   # one book file

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
        self.cast = open(os.path.join(HERE, 'cast.js'), encoding='utf-8').read()
        self.kit = open(os.path.join(HERE, 'kit.js'), encoding='utf-8').read() + '\n' + self.cast + '\n' + open(os.path.join(HERE, 'looks.js'), encoding='utf-8').read()
        self.family = json.load(open(os.path.join(HERE, 'family.json'), encoding='utf-8'))
        self.tables = json.load(open(os.path.join(HERE, 'tables.json'), encoding='utf-8'))
        css = re.search(r'<style>(.*?)</style>', self.template, re.S)
        self.css, self.css_at = css.group(1), css.start(1)
        js = re.search(r'<script>(.*?)</script>', self.template, re.S)
        self.js, self.js_at = js.group(1), js.start(1)
        self.js_code, self.js_comments = scan_js(self.js)
        kit_code, self.kit_comments = scan_js(self.kit)
        code = kit_code + '\n' + self.js_code
        self.pieces = object_keys(code, 'const P={') | object_keys(code, 'Object.assign(P,{') | set(re.findall(r'\bP\.(\w+)=', code))
        self.pieces |= {v['kind'] for k, v in self.family.items() if not k.startswith('_') and v['kind'] == 'siblings'}
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
        if 'decoys' in p and not (type(p['decoys']) is int and p['decoys'] >= 0):
            r.fail(f'{where}: "decoys" is the most look-alikes per critter on the page, a whole number 0 or more, not {p["decoys"]!r}')
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


CAST = ('person', 'pet', 'lovey')


def check_family(book, eng, r):
    """A family piece names a slot of the right kind, and every {slot} in the words is one the family has;
    an unknown one would print as {typo} on the page."""
    slots = {k: v for k, v in eng.family.items() if not k.startswith('_')}

    def walk(o, where):
        if isinstance(o, list):
            for x in o:
                walk(x, where)
        elif isinstance(o, dict):
            if o.get('who') in CAST:
                sl = o.get('slot')
                if sl not in slots:
                    r.fail(f'{where}: a {o["who"]} needs a "slot" from the family ({", ".join(slots)}), has {sl!r}')
                elif slots[sl]['kind'] != o['who']:
                    r.fail(f'{where}: slot "{sl}" is a {slots[sl]["kind"]}, not a {o["who"]}')
            for v in o.values():
                walk(v, where)
        elif isinstance(o, str):
            for k in re.findall(r'\{(\w+)\}', o):
                if k not in slots:
                    r.fail(f'{where}: "{{{k}}}" is not a family slot ({", ".join(slots)})')
    for pid, p in book['pages'].items():
        walk(p, f'{book["id"]}/{pid}')
    walk({k: v for k, v in book.items() if k != 'pages'}, book['id'])


# A family can switch an optional member out ("out": true). The book marks what depends on one:
#   words  "[pet: Goodnight, {pet}. | other words]"  (the part after | is optional)
#   pieces "needs": "pet" on any piece, flap or page; a piece with "slot" needs that slot without saying so
#   else   "else": {...} is merged over the thing (dropping its slot) when what it needs is out; no else drops it
# A dropped page is skipped: whatever went to it goes to its "next". personalize() in book-template.html does the same.
BRANCH = re.compile(r'\[(\w+):([^\[\]|]*)(?:\|([^\[\]]*))?\]')
DROP = object()


def optional_slots(eng):
    return {k for k, v in eng.family.items() if not k.startswith('_') and v.get('optional')}


def needs_of(o):
    n = o.get('needs') or []
    return ([n] if isinstance(n, str) else list(n)) + ([o['slot']] if o.get('slot') else [])


def resolve_words(s, out):
    if '[' not in s:
        return s
    s = BRANCH.sub(lambda m: ((m.group(3) or '') if m.group(1) in out else m.group(2)).strip(), s)
    return re.sub(r'\s{2,}', ' ', s).strip()


def resolve(o, out):
    if isinstance(o, list):
        return [x for x in (resolve(v, out) for v in o) if x is not DROP]
    if isinstance(o, str):
        return resolve_words(o, out)
    if not isinstance(o, dict):
        return o
    if any(k in out for k in needs_of(o)):
        if not isinstance(o.get('else'), dict):
            return DROP
        rest = {k: v for k, v in o.items() if k not in ('needs', 'else', 'slot')}
        return resolve({**rest, **o['else']}, out)
    res = {}
    for k, v in o.items():
        if k not in ('needs', 'else'):
            x = resolve(v, out)
            if x is not DROP:
                res[k] = x
    return res


def resolve_book(book, out):
    raw = book['pages']
    gone = {pid for pid, p in raw.items() if any(k in out for k in needs_of(p)) and 'else' not in p}

    def to(pid):
        seen = set()
        while pid in gone and pid not in seen:
            seen.add(pid); pid = raw[pid].get('next')
        return pid
    b = resolve({k: v for k, v in book.items() if k != 'pages'}, out)
    b['pages'] = {pid: resolve(p, out) for pid, p in raw.items() if pid not in gone}
    b['start'] = to(b.get('start'))
    for p in b['pages'].values():
        if p.get('next'):
            p['next'] = to(p['next'])
        for o in (p.get('choice') or {}).get('options', []):
            o['go'] = to(o.get('go'))
    return b


def uses_optional(book, opt):
    s = json.dumps(book)
    return any(f'{{{k}}}' in s or f'"{k}"' in s for k in opt)


def check_marks(book, opt, r):
    """the marks only name optional members, and a skipped page has somewhere to go on to"""
    def walk(o, where):
        if isinstance(o, list):
            for x in o:
                walk(x, where)
        elif isinstance(o, dict):
            n = o.get('needs')
            for k in ([n] if isinstance(n, str) else n or []):
                if k not in opt:
                    r.fail(f'{where}: "needs": "{k}" names a member that is always in the family (optional: {", ".join(sorted(opt))})')
            if 'else' in o and not isinstance(o['else'], dict):
                r.fail(f'{where}: "else" is the fields to use instead, an object')
            for v in o.values():
                walk(v, where)
        elif isinstance(o, str):
            for m in BRANCH.finditer(o):
                if m.group(1) not in opt:
                    r.fail(f'{where}: "[{m.group(1)}: ...]" names a member that is always in the family (optional: {", ".join(sorted(opt))})')
            if BRANCH.sub('', o).count('[') or BRANCH.sub('', o).count(']'):
                r.fail(f'{where}: a bracket that is not a [slot: words | other words] part: {o!r}')
    for pid, p in book['pages'].items():
        walk(p, f'{book["id"]}/{pid}')
        if needs_of(p) and 'else' not in p and not p.get('next'):
            r.fail(f'{book["id"]}/{pid}: a page that can be skipped needs a "next" to go on to (or an "else")')


def check_left_out(book, out, r):
    """with these members out, nothing on any page still names them, and no flap is left hiding nothing"""
    def walk(o, where):
        if isinstance(o, list):
            for x in o:
                walk(x, where)
        elif isinstance(o, dict):
            if o.get('slot') in out:
                r.fail(f'{where}: {o["slot"]} is still drawn')
            for v in o.values():
                walk(v, where)
        elif isinstance(o, str):
            for k in sorted(set(re.findall(r'\{(\w+)\}', o))):
                if k in out:
                    r.fail(f'{where}: still says {{{k}}}: "{plain(o)}"; put it in a [{k}: ... | ...] part')
    for pid, p in book['pages'].items():
        walk(p, f'{book["id"]}/{pid}')
        for i, f in enumerate(p.get('flaps') or []):
            if not f.get('hide'):
                r.fail(f'{book["id"]}/{pid}: flap {i} ({f.get("type")}) hides nothing; give it an "else" with something else to hide')


def check_book_rules(book, eng, r):
    check_graph(book, r)
    check_words(book, r)
    check_names(book, eng, r)
    check_finds(book, eng, r)
    check_letters(book, r)
    check_family(book, eng, r)


def check_optional(book, eng, r):
    """Every page reads complete with any mix of optional members out: the whole book rulebook runs on each mix."""
    opt = sorted(optional_slots(eng))
    check_marks(book, set(opt), r)
    base = Report()
    check_book_rules(resolve_book(book, set()), eng, base)
    r.problems += base.problems; r.warnings += base.warnings
    if not uses_optional(book, opt):
        return 0
    mixes = sorted(({k for i, k in enumerate(opt) if m >> i & 1} for m in range(1, 1 << len(opt))), key=len)
    seen = set(base.problems) | set(base.warnings)
    for out in mixes:
        sub = Report()
        b = resolve_book(book, out)
        check_book_rules(b, eng, sub)
        check_left_out(b, out, sub)
        tag = 'with ' + ' and '.join(sorted(out)) + ' out: '
        r.problems += [tag + p for p in sub.problems if p not in seen]
        r.warnings += [tag + w for w in sub.warnings if w not in seen]
        seen |= set(sub.problems) | set(sub.warnings)
    return len(mixes)


def check_swatches(eng, r):
    """recolor() maps PAL keys to the print palette, so a family color that is a PAL key would draw as some other color."""
    pal = set(re.findall(r"'(#[0-9a-fA-F]{3,6})':", re.search(r'const PAL=\{(.*?)\};', eng.js, re.S).group(1)))
    sw = re.search(r'const SWATCH=\{(.*?)\};', eng.cast, re.S)
    picks = set(re.findall(r'#[0-9a-fA-F]{6}', sw.group(1) if sw else ''))
    picks |= set(re.findall(r'#[0-9a-fA-F]{6}', json.dumps(eng.family)))
    for c in sorted(picks):
        if c.lower() in pal:
            r.fail(f'family colors: {c} is a PAL key, so recolor() would draw it as some other color')
    r.note(f'family: {len([k for k in eng.family if not k.startswith("_")])} slots, {len(picks)} colors to pick from')


def check_books(books, eng, r):
    ids = [b.get('id') for b in books]
    for dup in {i for i in ids if ids.count(i) > 1}:
        r.fail(f'two books share the id "{dup}"')
    mixes = 0
    for b in books:
        mixes += check_optional(b, eng, r)
    r.note(f'not in our family: {mixes} mixes of members out checked')
    check_swatches(eng, r)
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


# ---------------------------------------------------------------- 3. gentle rules

def css_blocks(css):
    """(prelude, body) for each top-level block; @media blocks come back whole."""
    css = re.sub(r'/\*.*?\*/', lambda m: ' ' * len(m.group(0)), css, flags=re.S)
    out, depth, start, body_start = [], 0, 0, 0
    for j, ch in enumerate(css):
        if ch == '{':
            if depth == 0:
                body_start = j + 1
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                out.append((css[start:body_start - 1].strip(), css[body_start:j]))
                start = j + 1
    return out


def css_rules(css):
    """(selector, declarations, media) for every style rule, including those inside @media."""
    for pre, body in css_blocks(css):
        if pre.startswith('@keyframes'):
            continue
        if pre.startswith('@media'):
            for sel, decl in css_blocks(body):
                yield sel, decl, pre
        else:
            yield pre, body, ''


def keyframes(css):
    return {pre.split()[1]: body for pre, body in css_blocks(css) if pre.startswith('@keyframes')}


def seconds(tok):
    m = re.fullmatch(r'(\d*\.?\d+)(ms|s)', tok)
    return None if not m else float(m.group(1)) / (1000 if m.group(2) == 'ms' else 1)


NOT_A_NAME = re.compile(r'[\d.]+|infinite|alternate(-reverse)?|normal|reverse|linear|ease(-in|-out|-in-out)?|forwards|backwards'
                        r'|both|none|var\(.*\)|steps\(.*\)|cubic-bezier\(.*\)')


def parse_animation(value):
    """animation shorthand -> dicts with name, duration (s, None if unreadable), iterations, alternate."""
    out = []
    for part in re.split(r',(?![^(]*\))', value):
        toks = part.split()
        times = [seconds(x) for x in toks if seconds(x) is not None]
        name = next((x for x in toks if seconds(x) is None and not NOT_A_NAME.fullmatch(x)), None)
        count = next((float(x) for x in toks if re.fullmatch(r'\d*\.?\d+', x)), 1.0)
        out.append({'name': name, 'duration': times[0] if times else None,
                    'iterations': float('inf') if 'infinite' in toks else count,
                    'alternate': any(x.startswith('alternate') for x in toks), 'raw': part.strip()})
    return out


def opacity_swings(frames):
    """How many times opacity (or visibility) changes direction in one pass of the keyframes."""
    pts = []
    for sel, decl in css_blocks(frames):
        o = re.search(r'opacity:\s*([\d.]+)', decl)
        v = re.search(r'visibility:\s*(\w+)', decl)
        if not (o or v):
            continue
        val = float(o.group(1)) if o else (1.0 if v.group(1) == 'visible' else 0.0)
        for s in sel.split(','):
            s = s.strip()
            pts.append((0.0 if s == 'from' else 100.0 if s == 'to' else float(s.rstrip('%')), val))
    if not pts:
        return 0
    pts.sort()
    if pts[0][0] > 0:
        pts.insert(0, (0.0, 1.0))
    if pts[-1][0] < 100:
        pts.append((100.0, 1.0))
    swings, last_dir = 0, 0
    for (_, a), (_, b) in zip(pts, pts[1:]):
        if abs(b - a) >= 0.2:
            d = 1 if b > a else -1
            if d != last_dir:
                swings += 1; last_dir = d
    return swings


def check_gentle(eng, r):
    """Speed floor: one pass of any animation, after pace() speeds one-shot animations up for the oldest age.
    Flashing: an animation that repeats and swings opacity or visibility, in flashes a second.
    Every endless animation is switched off for prefers-reduced-motion."""
    ages = eng.ages()
    paces = [ages[a]['pace'] for a in sorted(ages)]
    fastest = min(paces)
    frames = keyframes(eng.css)
    reduced = set()
    for sel, decl, media in css_rules(eng.css):
        if 'prefers-reduced-motion' in media and re.search(r'animation:\s*none', decl):
            reduced |= {s.strip() for s in sel.split(',')}
    flashiest, quickest = 0.0, (99.0, '')
    for sel, decl, media in css_rules(eng.css):
        m = re.search(r'(?:^|;)\s*animation:\s*([^;]+)', decl)
        if not m or 'prefers-reduced-motion' in media:
            continue
        for a in parse_animation(m.group(1)):
            if a['name'] in (None, 'none'):
                continue
            if a['duration'] is None:
                if 'var(' not in a['raw']:
                    r.warn(f'gentle: cannot read the duration of "{a["raw"]}" on {sel}')
                continue
            paced = a['iterations'] != float('inf')
            d = a['duration'] * (fastest if paced else 1)
            if a['name'] not in FAST_OK:
                if d < ANIM_FLOOR_S - 1e-9:
                    r.fail(f'gentle: {sel} runs {a["name"]} in {d:.2f} s' + (f' at age 5 (pace {fastest})' if paced else '')
                           + f', faster than the {ANIM_FLOOR_S} s floor')
                if d < quickest[0]:
                    quickest = (d, a['name'])
            swings = opacity_swings(frames.get(a['name'], ''))
            if swings and a['iterations'] > 1:
                hz = swings / 2 / d
                flashiest = max(flashiest, hz)
                if hz > FLASH_MAX_HZ:
                    r.fail(f'gentle: {sel} flashes ({a["name"]}) {hz:.1f} times a second, over {FLASH_MAX_HZ}')
            if a['iterations'] == float('inf') and sel not in reduced:
                r.fail(f'gentle: {sel} animates forever ({a["name"]}) but is not switched off under prefers-reduced-motion')
            if a['name'] not in frames:
                r.warn(f'gentle: {sel} uses @keyframes {a["name"]}, which is not defined')
    for m in re.finditer(r'animation-duration:\$\{\((\d*\.?\d+)\+Math\.random\(\)\*', eng.js):
        if float(m.group(1)) < ANIM_FLOOR_S:
            r.fail(f'gentle: engine line {eng.js_line(m.start())} sets an animation as short as {m.group(1)} s')
    for m in re.finditer(r'\btween\((\d+)', eng.js_code):
        if int(m.group(1)) / 1000 < ANIM_FLOOR_S:
            r.fail(f'gentle: engine line {eng.js_line(m.start())} tweens for {m.group(1)} ms, faster than the floor')
    if re.search(r'\bsetInterval\(', eng.js_code + eng.kit):
        r.warn('gentle: the engine uses setInterval; check by eye that nothing blinks')
    r.note(f'gentle: quickest animation after pacing {quickest[0]:.2f} s ({quickest[1]}), floor {ANIM_FLOOR_S} s; '
           f'most flashes a second {flashiest:.2f}, cap {FLASH_MAX_HZ}')
    check_gain(eng, r)
    check_burst_pace(eng, paces, r)


def literal(text):
    text = text.strip()
    return float(text) if re.fullmatch(r'\d*\.?\d+', text) else None


def check_gain(eng, r):
    """Peak gain of each synthesized voice, read from the code: tone()'s fifth argument, every vol: option and the
    defaults. Every voice must reach the speakers through soundBus(), whose gain comes from tables.json.
    The toddler bots measure the summed loudness of each tap."""
    code = eng.js_code
    peak = 0.0
    for m in re.finditer(r'function (tone|voice|noise)\(([^)]*)\)', code):
        d = re.search(r'vol=(\d*\.?\d+)', m.group(2))
        if d:
            v = float(d.group(1)); peak = max(peak, v)
            if v > VOICE_GAIN_CAP:
                r.fail(f'gentle: {m.group(1)}() defaults to gain {v}, over the {VOICE_GAIN_CAP} cap for one voice')
    for m in re.finditer(r'(?<![\w.])tone\(', code):
        if code[max(0, m.start() - 9):m.start()] == 'function ':
            continue
        args = call_args(code, m.end() - 1)
        if len(args) >= 5:
            v = literal(args[4][1])
            if v is None:
                r.warn(f'gentle: engine line {eng.js_line(m.start())}: cannot read the tone\'s gain "{args[4][1].strip()}"')
                continue
            peak = max(peak, v)
            if v > VOICE_GAIN_CAP:
                r.fail(f'gentle: engine line {eng.js_line(m.start())}: a tone at gain {v}, over the {VOICE_GAIN_CAP} cap')
    for m in re.finditer(r'\bvol:\s*([^,}]+)', code):
        v = literal(m.group(1))
        if v is None:
            r.warn(f'gentle: engine line {eng.js_line(m.start())}: cannot read the gain "{m.group(1).strip()}"'); continue
        peak = max(peak, v)
        if v > VOICE_GAIN_CAP:
            r.fail(f'gentle: engine line {eng.js_line(m.start())}: a voice at gain {v}, over the {VOICE_GAIN_CAP} cap')
    direct = len(re.findall(r'\.destination\b', code))
    if direct != 1 or not re.search(r'function soundBus\(', code):
        r.fail(f'gentle: every sound must reach the speakers through soundBus(), one gain node ({direct} places connect to the speakers)')
    master = eng.tables.get('sound', {}).get('masterGain')
    if master is None or master > MASTER_GAIN_CAP:
        r.fail(f'gentle: tables.json sound.masterGain is {master}; it must be set and at most {MASTER_GAIN_CAP}')
    r.note(f'gentle: loudest single voice gain {peak}, cap {VOICE_GAIN_CAP}; master gain {master}, cap {MASTER_GAIN_CAP}')


def check_burst_pace(eng, paces, r):
    """A burst stays up burstMs x the age's pace; at every age that must be long enough to see and long enough
    for its pop animation to finish."""
    ages = eng.ages()
    if paces[0] != 1 or any(b > a for a, b in zip(paces, paces[1:])) or paces[-1] < 0.5:
        r.fail(f'gentle: the age pace table {paces} must start at 1, never rise with age, and stay at or above 0.5')
    burst_ms = eng.tables.get('burstMs', 0)
    pop = next((parse_animation(re.search(r'animation:\s*([^;]+)', d).group(1))[0] for s, d, _ in css_rules(eng.css)
                if s == '.pop' and 'animation:' in d), None)
    for age, row in sorted(ages.items()):
        shown = burst_ms * row['pace']
        if shown < BURST_CALM_MIN_MS:
            r.fail(f'gentle: at age {age} a burst stays up {shown:.0f} ms, under {BURST_CALM_MIN_MS} ms')
        if pop and pop['duration'] * 1000 > burst_ms:
            r.fail(f'gentle: at age {age} the burst is removed before its pop animation ends')
    r.note('gentle: bursts stay up ' + ', '.join(f'{burst_ms * ages[a]["pace"]:.0f} ms at {a}' for a in sorted(ages))
           + f' (floor {BURST_CALM_MIN_MS} ms)')
    body = re.search(r'function burst\(.*?\n\S', eng.js_code, re.S)
    if not body or 'BURST_MS' not in body.group(0):
        r.fail('gentle: burst() must keep its burst up for BURST_MS (tables.json burstMs)')


# ---------------------------------------------------------------- 4. determinism

SEEDED = ('pickPerch', 'layFinds')     # where the perch picks and decoys are made


def function_body(code, name):
    m = re.search(r'function ' + name + r'\(', code)
    if not m:
        return None
    i = code.index('{', m.end())
    depth = 0
    for j in range(i, len(code)):
        depth += {'{': 1, '}': -1}.get(code[j], 0)
        if depth == 0:
            return code[i:j + 1]
    return code[i:]


def check_determinism(eng, r):
    """Perch picks and decoys come only from the page's seeded random (book, page, visit, age), so ?seed= replays them.
    The toddler bots replay seeds and compare the layouts."""
    for name in SEEDED:
        body = function_body(eng.js_code, name)
        if body is None:
            r.fail(f'determinism: the engine has no function {name}()'); continue
        if re.search(r'Math\.random|\brnd\(', body):
            r.fail(f'determinism: {name}() uses Math.random; use the page\'s seeded random so a layout can be replayed')
    if not re.search(r'\bmulberry32\(hash32\(', eng.js_code):
        r.fail('determinism: the page layout is not seeded from hash32(book/page/visit/age)')


# ---------------------------------------------------------------- 6. page statechart

SHOWS_OR_SOUNDS = r'(burst|bubble|sparkle|tone|noise|voice|buzz|blub)'
LEFT_BEHIND = re.compile(r'\b' + SHOWS_OR_SOUNDS + r'\(|\bsfx\.|\bSOUND[.\[]|^\s*' + SHOWS_OR_SOUNDS + r'\s*$')


def check_statechart(eng, r):
    """engine/page-states.json is the page's statechart. Here: it is whole, every rule has a check in the toddler bots
    and every check has a rule, and nothing a page starts on a timer can outlive the page (the bots watch the rest)."""
    chart = json.load(open(os.path.join(HERE, 'page-states.json'), encoding='utf-8'))
    for name, part in chart['parts'].items():
        states = set(part['states'])
        if part['start'] not in states:
            r.fail(f'statechart: {name} starts in "{part["start"]}", which is not one of its states')
        for a, why, b in part['moves']:
            for s in (a, b):
                if s not in states:
                    r.fail(f'statechart: {name} moves through "{s}", which is not one of its states')
        reach, todo = {part['start']}, [part['start']]
        while todo:
            s = todo.pop()
            for a, _, b in part['moves']:
                if a == s and b not in reach:
                    reach.add(b); todo.append(b)
        for s in states - reach:
            r.fail(f'statechart: {name} can never reach "{s}"')
        for s in states:
            if not any(a == s for a, _, _ in part['moves']):
                r.fail(f'statechart: {name} can never leave "{s}"')
    bots = open(os.path.join(HERE, 'toddler-bots.mjs'), encoding='utf-8').read()
    checked = set(re.findall(r"broke\('([a-z-]+)'", bots))
    for rule in chart['rules']:
        if rule not in checked:
            r.fail(f'statechart: the rule "{rule}" has no check in toddler-bots.mjs')
    for rule in checked - set(chart['rules']):
        r.fail(f'statechart: toddler-bots.mjs checks "{rule}", which page-states.json does not list')
    for m in re.finditer(r'\bsetTimeout\(', eng.js_code):
        args = call_args(eng.js_code, m.end() - 1)
        if args and LEFT_BEHIND.search(args[0][1]):
            r.fail(f'statechart turn-leaves-nothing: template line {eng.js_line(m.start())} plays or shows something on a bare '
                   f'setTimeout, which outlives a turn; use later() so turning the page drops it')
    for name in ('show', 'shelf'):
        body = function_body(eng.js_code, name)
        if body is None or 'dropLater()' not in body:
            r.fail(f'statechart turn-resets: {name}() does not call dropLater(), so the last page\'s timers run on')
    r.note(f'statechart: {len(chart["parts"])} parts, {sum(len(p["states"]) for p in chart["parts"].values())} states, '
           f'{len(chart["rules"])} rules, each checked by the toddler bots')


# ---------------------------------------------------------------- 8. comment lint

STOP = set('''a an the and or but if of to in on at by for with from into onto as is are be been was were it its this that
these those so then than when while do does did not no yes we you she he they them her his our their one two all any each
every some only just also here there what which who how why up down out off over under after before again still yet can
will would should could may might must has have had get gets got set sets make makes use uses used new old'''.split())
LINTED = ('engine/book-template.html', 'engine/kit.js', 'engine/cast.js', 'engine/looks.js', 'engine/toddler-bots.mjs', 'engine/browser.mjs', 'engine/shots.mjs',
          'engine/check.py', 'engine/build.py')


def words_of(text):
    """Lower-case words, camelCase and snake_case split apart, a plural s dropped."""
    text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)
    return [w[:-1] if len(w) > 3 and w.endswith('s') and not w.endswith('ss') else w
            for w in re.findall(r'[a-z]+', text.lower()) if len(w) > 2]


def restates(comment, code):
    if comment.strip().startswith('-') or re.fullmatch(r'\s*[A-Z]+\s*', comment):
        return False            # a section heading or a build placeholder like /*BOOKS*/
    said = [w for w in words_of(comment) if w not in STOP]
    if len(said) < 2 or len(said) > 10:
        return False
    there = set(words_of(code))
    return sum(w in there for w in said) / len(said) >= 0.75


HISTORY = re.compile(r"\b(used to|no longer|any ?more|previously|instead of the old|(was|were) (removed|changed|replaced|added|moved|broken)"
                     r"|(is|are) now|bug ?fix|fixed (a|the) bug|20\d\d-\d\d-\d\d)\b", re.I)


def tells_history(comment):
    """A comment that tells what the code was before, what changed or when: the commit message already keeps that."""
    return bool(HISTORY.search(comment))


def comment_sites(path, src, multiline=False):
    """(line, comment, the code it sits on or above) for every line comment, and with multiline the block comments too."""
    lines = src.split('\n')
    def code_at(line_no, offset_in_line, text_line):
        before = text_line[:offset_in_line].strip()
        if before:
            return before
        for nxt in lines[line_no:]:
            if nxt.strip() and not nxt.strip().startswith(('//', '#', '/*')):
                return nxt
        return ''
    if path.endswith('.py'):
        for tok in tokenize.generate_tokens(io.StringIO(src).readline):
            if tok.type == tokenize.COMMENT:
                (ln, col) = tok.start
                yield ln, tok.string[1:], code_at(ln, col, lines[ln - 1])
        return
    js = src
    if path.endswith('.html'):
        m = re.search(r'<script>(.*?)</script>', src, re.S)
        js = m.group(1) if m else ''
        base = src.count('\n', 0, m.start(1)) if m else 0
    else:
        base = 0
    _, comments = scan_js(js)
    for off, text in comments:
        if '\n' in text.strip() and not multiline:
            continue
        ln = base + js.count('\n', 0, off) + 1
        col = off - (js.rfind('\n', 0, off) + 1)
        yield ln, text, code_at(ln, col, lines[ln - 1])


LINT_KNOWS = [('show the next page', 'showNextPage(page)', True),
              ('a toddler taps at nothing in particular this often', 'wild: 0.25,', False)]
HISTORY_KNOWS = [('the bow used to sit on the mouth', True), ('one-page build: 156.8 KB on 2026-11-02', True),
                 ('a bow at the neck, under the chin', False), ('so taps know what was touched', False)]


def check_comments(r):
    """A comment that only says what the next line does is flagged: rename or reshape the code instead.
    So is one that tells the edit's history (what it was, what changed, when): that is the commit message's job."""
    read = 0
    for comment, code, flagged in LINT_KNOWS:
        if restates(comment, code) != flagged:
            r.fail(f'comment lint: it no longer tells "{comment}" from its code correctly')
    for comment, flagged in HISTORY_KNOWS:
        if tells_history(comment) != flagged:
            r.fail(f'comment lint: it no longer tells whether "{comment}" is edit history')
    for rel in LINTED:
        path = os.path.join(ROOT, rel)
        if not os.path.exists(path):
            continue
        src = open(path, encoding='utf-8').read()
        for ln, text, code in comment_sites(rel, src, multiline=True):
            read += 1
            if tells_history(text):
                r.lint.append(f'{rel}:{ln}: "{" ".join(text.split())[:80]}" tells edit history; that goes in the commit message')
            elif '\n' not in text.strip() and restates(text, code):
                r.lint.append(f'{rel}:{ln}: "{text.strip()}" only restates the code')
    r.note(f'comment lint: {read} comments read, {len(r.lint)} flagged (restating the code or telling edit history)')


# ---------------------------------------------------------------- run

def run_all(books, book_files=(), page=None, site_index=None, lint=False):
    eng = Engine()
    r = Report()
    check_books(books, eng, r)
    check_budgets(books, book_files, page, site_index, r)
    check_gentle(eng, r)
    check_determinism(eng, r)
    check_statechart(eng, r)
    check_comments(r)
    return r


def summary(r):
    return f'checks: {len(r.problems)} problems, {len(r.warnings)} warnings' + (f', comment lint flagged {len(r.lint)}' if r.lint else '')


def print_report(r, lint=False, out=sys.stdout):
    for w in r.warnings:
        print('warning: ' + w, file=out)
    for p in r.problems:
        print(p, file=out)
    if lint:
        for c in r.lint:
            print('lint: ' + c, file=out)


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
