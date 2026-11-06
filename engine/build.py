"""Build the bookshelf.
  python3 -I build.py out.html book1.json book2.json ...          (one page, for the Claude artifact)
  python3 -I build.py --site site/ book1.json book2.json ...      (installable offline web app for any host)
The checks in check.py run first; if any fails, nothing is written.
"""
import json, sys, os, hashlib, importlib.util
here = os.path.dirname(os.path.abspath(__file__))
args = sys.argv[1:]
site = args[0] == '--site'
if site: args = args[1:]
out, files = args[0], args[1:]
spec_r = importlib.util.spec_from_file_location('reader', os.path.join(here, 'reader.py'))
reader = importlib.util.module_from_spec(spec_r); spec_r.loader.exec_module(reader)
t = reader.assemble()[0]
kit = open(os.path.join(here, 'kit.js'), encoding='utf-8').read() + '\n' + open(os.path.join(here, 'cast.js'), encoding='utf-8').read()
family = json.load(open(os.path.join(here, 'family.json'), encoding='utf-8'))
tables = json.load(open(os.path.join(here, 'tables.json'), encoding='utf-8'))
books = [json.load(open(f, encoding='utf-8')) for f in files]
page = t.replace('/*KIT*/', kit).replace('/*TABLES*/', json.dumps(tables, separators=(',', ':'))).replace('/*FAMILY*/', json.dumps(family, separators=(',', ':'))).replace('/*BOOKS*/', json.dumps(books))

ver = hashlib.sha1(page.encode()).hexdigest()[:10]
head = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">'
        '<meta name="theme-color" content="#8fc3b8"><meta name="apple-mobile-web-app-capable" content="yes">'
        '<meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Sunny Side Books">'
        '<link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icon.svg">'
        '<link rel="apple-touch-icon" href="icon-192.png"></head><body>')
tail = ('<script>if("serviceWorker" in navigator) addEventListener("load",()=>navigator.serviceWorker.register("sw.js"));'
        'try{screen.orientation&&screen.orientation.lock&&screen.orientation.lock("landscape").catch(()=>{})}catch(e){}</script></body></html>')
site_index = head + page + tail

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('check', os.path.join(here, 'check.py'))
check = importlib.util.module_from_spec(spec); spec.loader.exec_module(check)
report = check.run_all(books, files, page=page, site_index=site_index if site else None)
check.print_report(report)
if report.problems:
    print(f'build stopped: {len(report.problems)} problem(s), nothing written', file=sys.stderr)
    sys.exit(1)

if not site:
    open(out, 'w', encoding='utf-8').write(page)
else:
    os.makedirs(out, exist_ok=True)
    open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(site_index)
    json.dump({"name": "Sunny Side Books", "short_name": "Books", "start_url": "./", "scope": "./", "display": "fullscreen",
               "orientation": "landscape", "background_color": "#8fc3b8", "theme_color": "#8fc3b8",
               "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png"},
                         {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"}]},
              open(os.path.join(out, 'manifest.webmanifest'), 'w'), indent=1)
    open(os.path.join(out, 'sw.js'), 'w', encoding='utf-8').write(f"""// offline: keep the books on the device after the first visit
const V='books-{ver}', CORE=['./','index.html','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)));self.skipWaiting();}});
self.addEventListener('activate',e=>{{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))));self.clients.claim();}});
self.addEventListener('fetch',e=>{{ if(e.request.method!=='GET') return;
  e.respondWith(caches.match(e.request).then(hit=>{{ const net=fetch(e.request).then(r=>{{ if(r&&(r.ok||r.type==='opaque')){{const cp=r.clone();caches.open(V).then(c=>c.put(e.request,cp));}} return r; }}).catch(()=>hit);
    return hit||net; }})); }});
""")
    open(os.path.join(out, '_headers'), 'w').write("/sw.js\n  Cache-Control: no-cache\n/index.html\n  Cache-Control: no-cache\n")
print('built', ', '.join(b['title'] for b in books), '(site)' if site else '')
for line in report.numbers + [check.summary(report)]:
    print(line)
