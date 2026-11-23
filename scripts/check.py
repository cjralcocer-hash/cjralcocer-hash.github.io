#!/usr/bin/env python3
"""Checks the site before it goes live. Exits 1 if anything is wrong.

    python3 scripts/check.py

Needs Python 3.9 or newer and no packages. It checks that
  - every .json file parses
  - es.json and en.json have the same keys, kinds of value and {placeholders}
  - every string the pages and scripts ask for exists in both languages
  - the generated pages and sitemap.xml match src/ and i18n/ (otherwise run scripts/build.py)
  - every local link, image, script and stylesheet in the generated pages points at a real file
  - partners.json and people.json have the shape the site expects
Strings that nothing uses are only listed as a warning.
"""
import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import build  # noqa: E402

errors = []
warnings = []


def err(msg):
    errors.append(msg)


def load_json(rel):
    try:
        with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        err('%s is missing' % rel)
    except ValueError as e:
        err('%s is not valid JSON: %s' % (rel, e))
    return None


def check_json_files():
    for path in sorted(glob.glob(os.path.join(ROOT, '*.json')) + glob.glob(os.path.join(ROOT, 'i18n', '*.json'))
                       + glob.glob(os.path.join(ROOT, 'src', '*.json'))):
        load_json(os.path.relpath(path, ROOT))


def placeholders(v):
    return set(re.findall(r'\{(\w+)\}', v)) if isinstance(v, str) else set()


def check_i18n(cfg):
    strings = {l: load_json('i18n/%s.json' % l) or {} for l in cfg['languages']}
    langs = cfg['languages']
    a, b = langs[0], langs[1]
    for key in sorted(set(strings[a]) | set(strings[b])):
        if key not in strings[a]:
            err('i18n/%s.json is missing "%s"' % (a, key))
        elif key not in strings[b]:
            err('i18n/%s.json is missing "%s"' % (b, key))
        else:
            va, vb = strings[a][key], strings[b][key]
            if type(va) is not type(vb):
                err('"%s" is %s in %s but %s in %s' % (key, type(va).__name__, a, type(vb).__name__, b))
            elif placeholders(va) != placeholders(vb):
                err('"%s" uses different {placeholders} in %s and %s' % (key, a, b))
            elif isinstance(va, str) and (not va.strip() or not vb.strip()):
                err('"%s" is empty' % key)
    return strings


def check_used_keys(cfg, strings):
    used = set()
    wanted = []  # (key, where)
    templates = [('src/layout.html', None)] + [('src/pages/%s.html' % p['id'], p['id']) for p in cfg['pages']]
    for rel, page_id in templates:
        with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
            text = f.read()
        for kind, name in build.TOKEN.findall(text):
            if kind in ('t', 'h'):
                wanted.append((name, rel))
            elif kind == 'p':
                ids = [page_id] if page_id else [p['id'] for p in cfg['pages']]
                for i in ids:
                    wanted.append(('%s.%s' % (i, name), rel))
    for p in cfg['pages']:
        if p.get('nav'):
            wanted.append((p['nav'], 'src/pages.json'))
    wanted.append(('navSiteLabel', 'scripts/build.py'))
    for path in glob.glob(os.path.join(ROOT, '*.js')):
        with open(path, encoding='utf-8') as f:
            text = f.read()
        for key in re.findall(r"\bt\('([\w.]+)'\s*[,)]", text):
            wanted.append((key, os.path.basename(path)))
        for key in re.findall(r"'(unclearOne|unclearMany|countAll|countSome)'", text):
            wanted.append((key, os.path.basename(path)))
    for key, where in wanted:
        used.add(key)
        for lang, table in strings.items():
            if key not in table:
                err('%s asks for "%s", which is missing in i18n/%s.json' % (where, key, lang))
    first = strings[cfg['languages'][0]]
    for key in sorted(first):
        if key not in used and not key.startswith('type_'):
            warnings.append('string "%s" is not used by any page or script' % key)


def check_generated():
    try:
        files = build.build_all()
    except build.BuildError as e:
        err('build failed: %s' % e)
        return {}
    for rel, text in sorted(files.items()):
        try:
            with open(os.path.join(ROOT, rel), encoding='utf-8', newline='') as f:
                same = f.read() == text
        except FileNotFoundError:
            same = False
        if not same:
            err('%s is out of date: run  python3 scripts/build.py' % rel)
    return files


LINK = re.compile(r'''\b(?:href|src)="([^"]*)"''')
SRCSET = re.compile(r'''\bsrcset="([^"]*)"''')
OG_IMAGE = re.compile(r'''<meta property="og:image" content="([^"]*)"''')


def local_target(cfg, rel_page, ref):
    ref = ref.split('#')[0].split('?')[0]
    if not ref:
        return None
    if ref.startswith(cfg['site']):
        ref = ref[len(cfg['site']):].lstrip('/')
        path = os.path.join(ROOT, ref)
    elif re.match(r'^(?:[a-z][a-z0-9+.-]*:|//)', ref):
        return None
    else:
        path = os.path.normpath(os.path.join(ROOT, os.path.dirname(rel_page), ref))
    if ref == '' or path.endswith(os.sep) or os.path.isdir(path):
        path = os.path.join(path, 'index.html')
    return path


def check_links(cfg, files):
    for rel, text in sorted(files.items()):
        if not rel.endswith('.html'):
            continue
        refs = LINK.findall(text) + OG_IMAGE.findall(text)
        for ss in SRCSET.findall(text):
            refs += [part.strip().split(' ')[0] for part in ss.split(',') if part.strip()]
        for ref in refs:
            path = local_target(cfg, rel, ref)
            if path and not os.path.exists(path):
                err('%s links to "%s", but that file does not exist' % (rel, ref))
    sm = files.get('sitemap.xml', '')
    for loc in re.findall(r'<loc>([^<]*)</loc>', sm):
        path = local_target(cfg, 'sitemap.xml', loc)
        if path and not os.path.exists(path):
            err('sitemap.xml lists %s, but that page does not exist' % loc)


def check_entries():
    for rel, key, need in (('partners.json', 'partners', 'name'), ('people.json', 'people', 'name')):
        data = load_json(rel)
        if data is None:
            continue
        items = data.get(key)
        if not isinstance(items, list):
            err('%s needs a "%s" list' % (rel, key))
            continue
        seen = set()
        for i, item in enumerate(items):
            where = '%s entry %d' % (rel, i + 1)
            if not isinstance(item, dict) or not item.get('id') or not item.get(need):
                err('%s needs an "id" and a "%s"' % (where, need))
                continue
            if item['id'] in seen:
                err('%s repeats the id "%s"' % (where, item['id']))
            seen.add(item['id'])
            if item.get('url') and not re.match(r'^https?://\S+$', item['url']):
                err('%s: "url" must start with http:// or https://' % where)
            photo = item.get('photo')
            if photo and not os.path.exists(os.path.join(ROOT, photo)):
                err('%s: photo "%s" does not exist' % (where, photo))


def main():
    cfg = load_json('src/pages.json')
    check_json_files()
    if cfg:
        strings = check_i18n(cfg)
        check_used_keys(cfg, strings)
        files = check_generated()
        check_links(cfg, files)
    check_entries()
    for w in warnings:
        print('warning: ' + w)
    if errors:
        for e in errors:
            print('ERROR: ' + e)
        print('\n%d problem(s) found.' % len(errors))
        return 1
    print('All checks passed.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
