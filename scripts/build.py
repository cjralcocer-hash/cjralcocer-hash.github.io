#!/usr/bin/env python3
"""Builds the HTML pages and sitemap.xml from src/ and i18n/.

    python3 scripts/build.py           write the files
    python3 scripts/build.py --check   change nothing; exit 1 if a generated file is out of date

Needs Python 3.9 or newer and no packages. The output is committed, so GitHub Pages serves it as is.

Inputs
  src/pages.json        site address, languages, and the list of pages
  src/layout.html       everything shared: head, language bar, header, footer, scripts
  src/pages/<id>.html   one file per page, in sections:  <!--@header-->  <!--@main-->  <!--@band-->
  i18n/es.json, en.json every visible string, one key per string, the same keys in both files

Tokens inside src/ files
  {{t:key}}   string from i18n, escaped for HTML
  {{h:key}}   string from i18n, inserted as HTML (only for our own strings that hold a link)
  {{p:name}}  page string: looks up "<page id>.<name>" (docTitle, description, ogTitle, ogDescription, ogImageAlt)
  {{es:key}}  string from i18n/es.json whatever the page language (for the bilingual printed flyer)
  {{en:key}}  the same from i18n/en.json
  {{v:name}}  value computed here: lang, root, site, canonical, pageId, home, siteHost, findTel, cards, jsonld, analytics, ...
  {{@name}}   a section of the page file
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import places  # noqa: E402
import qr  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOKEN = re.compile(r'\{\{(t|h|p|v|es|en):([\w.]+)\}\}')
SLOT = re.compile(r'\{\{@(\w+)\}\}')
SECTION = re.compile(r'<!--@(\w+)-->\n')


class BuildError(Exception):
    pass


def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return f.read()


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')


GA_ID = re.compile(r'^G-[A-Z0-9]+$')


def analytics_html(cfg):
    """Google Analytics tag, only when src/pages.json has a googleAnalytics ID like G-ABC123."""
    ga = cfg.get('googleAnalytics', '')
    if not ga:
        return ''
    if not GA_ID.match(ga):
        raise BuildError('googleAnalytics in src/pages.json must look like G-ABC123, got %r' % ga)
    return ('<script async src="https://www.googletagmanager.com/gtag/js?id=%s"></script>\n'
            '<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}'
            "gtag('js',new Date());gtag('config','%s');</script>" % (ga, ga))


def load_config():
    return json.loads(read('src/pages.json'))


def load_strings(cfg):
    return {lang: json.loads(read('i18n/%s.json' % lang)) for lang in cfg['languages']}


def split_sections(text):
    parts = SECTION.split(text)
    # parts = [before, name1, body1, name2, body2, ...]
    return {parts[i]: parts[i + 1].rstrip('\n') for i in range(1, len(parts), 2)}


def lang_prefix(cfg, lang):
    return '' if lang == cfg['defaultLanguage'] else lang + '/'


def page_url(cfg, page, lang):
    return cfg['site'] + '/' + lang_prefix(cfg, lang) + page['path']


def root_for(cfg, page, lang):
    depth = len([s for s in page['path'].split('/') if s]) + (0 if lang == cfg['defaultLanguage'] else 1)
    return '../' * depth


def out_path(cfg, page, lang):
    return lang_prefix(cfg, lang) + page['path'] + 'index.html'


def nav_html(cfg, page, lang, root, strings):
    items = [p for p in cfg['pages'] if p.get('nav')]
    if len(items) < 2:
        return ''
    lis = []
    for p in items:
        href = root + lang_prefix(cfg, lang) + p['path'] or './'
        cur = ' aria-current="page"' if p['id'] == page['id'] else ''
        lis.append('<li><a href="%s"%s>%s</a></li>' % (href, cur, esc(lookup(strings, p['nav'], lang))))
    return '<nav class="sitenav" aria-label="%s"><ul>%s</ul></nav>' % (
        esc(lookup(strings, 'navSiteLabel', lang)), ''.join(lis))


def lookup(strings, key, lang):
    try:
        v = strings[lang][key]
    except KeyError:
        raise BuildError('missing string "%s" in i18n/%s.json' % (key, lang))
    if not isinstance(v, str):
        raise BuildError('string "%s" in i18n/%s.json is not text' % (key, lang))
    return v


def load_find():
    try:
        find = json.loads(read('data.json'))['find']
        return {k: find[k] for k in ('phone', 'phone_display', 'hours_es', 'hours_en')}
    except (KeyError, ValueError, FileNotFoundError):
        raise BuildError('data.json needs a "find" entry with phone, phone_display, hours_es and hours_en')


def render_page(cfg, strings, layout, page, lang):
    root = root_for(cfg, page, lang)
    others = [l for l in cfg['languages'] if l != lang]
    other = others[0]
    default = cfg['defaultLanguage']
    find = load_find()
    json_blob = json.dumps(strings, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/').replace('<!--', '<\\!--')
    values = {
        'lang': lang,
        'root': root,
        'site': cfg['site'],
        'canonical': page_url(cfg, page, lang),
        'urlEs': page_url(cfg, page, 'es'),
        'urlEn': page_url(cfg, page, 'en'),
        'otherLang': other,
        'otherHref': root + lang_prefix(cfg, other) + page['path'],
        'ogLocale': {'es': 'es_US', 'en': 'en_US'}[lang],
        'ogLocaleAlt': {'es': 'es_US', 'en': 'en_US'}[other],
        'pageId': page['id'],
        'home': root + lang_prefix(cfg, lang),
        'siteHost': re.sub(r'^https?://', '', cfg['site']),
        'findTel': find['phone'],
        'findPhone': esc(find['phone_display']),
        'findHoursEs': esc(find['hours_es']),
        'findHoursEn': esc(find['hours_en']),
        'skipTo': page.get('skipTo', 'main'),
        'nav': nav_html(cfg, page, lang, root, strings),
        'scripts': '\n'.join('<script src="%s%s"></script>' % (root, s) for s in page['scripts']),
        'i18nJson': json_blob,
        'reportUrl': 'https://github.com/%s/issues/new' % cfg['repo'],
        'suggestUrl': places.issue_url('https://github.com/%s/issues/new' % cfg['repo'], lookup(strings, 'suggestTitle', lang), lookup(strings, 'suggestBody', lang)),
        'a11yUrl': places.issue_url('https://github.com/%s/issues/new' % cfg['repo'], lookup(strings, 'a11yTitle', lang), lookup(strings, 'a11yBody', lang)),
        'cards': '',
        'count': '',
        'jsonld': '',
        'analytics': analytics_html(cfg),
    }
    if page.get('list'):
        try:
            cards, plist = places.render_cards(lang, strings[lang], values['reportUrl'])
        except places.PlacesError as e:
            raise BuildError(str(e))
        values['cards'] = cards
        values['count'] = esc(places.count_text(strings[lang], len(plist)))
        values['jsonld'] = places.json_ld(lang, strings[lang], cfg['site'], values['canonical'], plist)
    sections = split_sections(read('src/pages/%s.html' % page['id']))

    def slot(m):
        return sections.get(m.group(1), '')

    doc = SLOT.sub(slot, layout)

    def token(m):
        kind, name = m.group(1), m.group(2)
        if kind == 'v':
            if name not in values:
                raise BuildError('unknown value {{v:%s}} in page "%s"' % (name, page['id']))
            return values[name]
        if kind == 'p':
            return esc(lookup(strings, page['id'] + '.' + name, lang))
        if kind in ('es', 'en'):
            return esc(lookup(strings, name, kind))
        text = lookup(strings, name, lang)
        return text if kind == 'h' else esc(text)

    return TOKEN.sub(token, doc)


def sitemap(cfg):
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
             '        xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for page in cfg['pages']:
        for lang in cfg['languages']:
            lines.append('  <url>')
            lines.append('    <loc>%s</loc>' % page_url(cfg, page, lang))
            for l in cfg['languages']:
                lines.append('    <xhtml:link rel="alternate" hreflang="%s" href="%s"/>' % (l, page_url(cfg, page, l)))
            lines.append('    <xhtml:link rel="alternate" hreflang="x-default" href="%s"/>' % page_url(cfg, page, cfg['defaultLanguage']))
            lines.append('  </url>')
    lines.append('</urlset>')
    return '\n'.join(lines) + '\n'


def build_all():
    """Returns {relative path: file text} for every generated file."""
    cfg = load_config()
    strings = load_strings(cfg)
    layout = read('src/layout.html')
    out = {}
    for page in cfg['pages']:
        for lang in cfg['languages']:
            out[out_path(cfg, page, lang)] = render_page(cfg, strings, layout, page, lang)
    out['sitemap.xml'] = sitemap(cfg)
    out['images/qr-site.svg'] = qr.to_svg(qr.matrix(cfg['site'] + '/'), title=cfg['site'] + '/')
    return out


def main(argv):
    check = '--check' in argv
    try:
        files = build_all()
    except BuildError as e:
        print('Build failed: %s' % e, file=sys.stderr)
        return 1
    stale = []
    for rel, text in sorted(files.items()):
        path = os.path.join(ROOT, rel)
        try:
            with open(path, encoding='utf-8', newline='') as f:
                same = f.read() == text
        except FileNotFoundError:
            same = False
        if same:
            continue
        stale.append(rel)
        if not check:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, 'w', encoding='utf-8', newline='\n') as f:
                f.write(text)
    if check:
        if stale:
            print('Out of date (run: python3 scripts/build.py): ' + ', '.join(stale), file=sys.stderr)
            return 1
        print('Generated files are up to date (%d files).' % len(files))
        return 0
    print('Wrote %s.' % (', '.join(stale) if stale else 'nothing (already up to date)'))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
