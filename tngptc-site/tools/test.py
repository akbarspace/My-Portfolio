# Usage: python3 -I tools/test.py  (needs playwright + chromium). Checks local links, menu, lightbox, overflow; saves screenshots.
import os, re, sys, glob
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
shots = sys.argv[1] if len(sys.argv) > 1 else None
pages = sorted(glob.glob(root + '/*.html') + glob.glob(root + '/departments/*.html'))
errs = []; ext = set()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    for name, vp in (('desktop', {'width':1366,'height':800}), ('mobile', {'width':390,'height':800})):
        pg = b.new_page(viewport=vp)
        pg.on('pageerror', lambda e: errs.append(f'JS error: {e}'))
        for f in pages:
            pg.goto('file://' + f); pg.wait_for_timeout(150)
            rel = os.path.relpath(f, root)
            if pg.evaluate('document.documentElement.scrollWidth > innerWidth + 1'): errs.append(f'{name} horizontal overflow: {rel}')
            for h in pg.eval_on_selector_all('a[href]', 'a=>a.map(x=>x.getAttribute("href"))'):
                if h.startswith(('http', 'mailto:', 'tel:', '#', 'javascript')):
                    if h.startswith('http'): ext.add(h)
                    if h == '#' : errs.append(f'dead # link in {rel}')
                    continue
                t = os.path.normpath(os.path.join(os.path.dirname(f), h.split('#')[0]))
                if not os.path.exists(t): errs.append(f'broken link {h} in {rel}')
            for s in pg.eval_on_selector_all('img[src]', 'a=>a.map(x=>x.getAttribute("src"))'):
                if not s.startswith('http') and not os.path.exists(os.path.normpath(os.path.join(os.path.dirname(f), s))): errs.append(f'missing img {s} in {rel}')
            if shots and rel in ('index.html','departments/civil.html','gallery.html'):
                pg.screenshot(path=f'{shots}/{name}-{rel.replace("/","_")}.png', full_page=False)
        # mobile menu
        if name == 'mobile':
            pg.goto('file://' + root + '/index.html')
            pg.click('.menu-btn'); pg.wait_for_timeout(400)
            if not pg.is_visible('#site-nav a[href="departments.html"]'): errs.append('mobile menu did not open')
            pg.click('#site-nav a[href="departments.html"]'); pg.wait_for_timeout(200)
            if not pg.url.endswith('departments.html'): errs.append('menu link did not navigate')
        # every dept card opens correct page
        pg.goto('file://' + root + '/departments.html')
        cards = pg.eval_on_selector_all('.dept-card h3 a', 'a=>a.map(x=>[x.textContent,x.getAttribute("href")])')
        for t, h in cards:
            pg.goto('file://' + root + '/departments.html'); pg.click(f'.dept-card h3 a[href="{h}"]'); pg.wait_for_timeout(100)
            if t.strip() not in pg.inner_text('h1'): errs.append(f'card {t} opened wrong page {pg.url}')
        # lightbox
        pg.goto('file://' + root + '/gallery.html'); pg.click('.gal button >> nth=0'); pg.wait_for_timeout(100)
        if not pg.is_visible('.lightbox.open'): errs.append('lightbox did not open')
        pg.keyboard.press('ArrowRight'); pg.keyboard.press('Escape')
        if pg.is_visible('.lightbox.open'): errs.append('lightbox did not close')
        pg.close()
    b.close()
print('pages:', len(pages), '| external links (not fetched):', len(ext))
print('\n'.join(errs) if errs else 'ALL CHECKS PASSED')
