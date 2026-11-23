"""The list of places as plain HTML and JSON-LD, written at build time.

The page's own script (list.js) still draws the live list in the browser, with "Open today", search and filters.
This file makes the same cards ahead of time, so the list also works with JavaScript off, on slow phones,
and for search engines. Nothing here depends on today's date, so the output only changes when the data does.

Keep it in step with card() in list.js. Icons are read from common.js so they exist in one place only.
"""
import json
import os
import re
import unicodedata
from urllib.parse import quote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Strings asked for by name here (scripts/check.py reads this list). type_<x> is added by the check itself.
KEYS = ['address', 'hours', 'contact', 'email', 'sourceFrom', 'sourceChecked', 'alertLabel', 'call', 'callShort',
        'callFind', 'callFindShort', 'callForLocation', 'directions', 'directionsHint', 'noPhone', 'ext',
        'reportLink', 'reportAria', 'reportTitle', 'reportBody', 'countAll', 'shortDate']

TYPES = ('pantry', 'mobile', 'meals')
NBSP = ' '
NB_HYPHEN = '‑'


class PlacesError(Exception):
    pass


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')


def read_json(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return json.load(f)


def icons():
    with open(os.path.join(ROOT, 'common.js'), encoding='utf-8') as f:
        text = f.read()
    found = dict(re.findall(r"^\s*(\w+): '(<svg.*?</svg>)'", text, re.M))
    for name in ('pin', 'clock', 'info', 'phone', 'nav', 'alert', 'user', 'mail', 'doc'):
        if name not in found:
            raise PlacesError('common.js has no ICON.%s (scripts/places.py reads the icons from there)' % name)
    return found


def merged_places():
    """data.json places, then community.json places, with community.json 'updates' applied. Mirrors addCommunity()."""
    data = read_json('data.json')
    places = [dict(p) for p in data['places']]
    try:
        cj = read_json('community.json')
    except (FileNotFoundError, ValueError):
        cj = {}
    by_id = {str(p['id']): p for p in places}
    for u in cj.get('updates', []):
        p = by_id.get(str(u.get('find_id')))
        src = u.get('source') or {}
        if not p or not str(src.get('url', '')).startswith(('http://', 'https://')):
            continue
        p['source'] = {'url': src['url'], 'checked_on': src.get('checked_on')}
        p['alert'] = u.get('alert')  # { en, es }
        for k in ('hours', 'hours_es'):
            if u.get(k):
                p[k] = u[k]
        if u.get('no_directions') is True:
            p['noDirections'] = True
    for c in cj.get('places', []):
        src = c.get('source') or {}
        hours, hours_es = c.get('hours') or [], c.get('hours_es') or []
        types = [t for t in c.get('types', []) if t in TYPES]
        if not (c.get('name') and c.get('city') and c.get('address') and str(src.get('url', '')).startswith('http')
                and types and (hours or hours_es)):
            continue
        places.append({
            'id': str(c['id']), 'name': c['name'], 'org': c.get('org') or c['name'], 'city': c['city'],
            'address': c['address'], 'types': types, 'hours': hours or hours_es, 'hours_es': hours_es or hours,
            'notes': c.get('notes', []), 'notes_es': c.get('notes_es', []),
            'contact': c.get('contact'), 'contact_es': c.get('contact_es'),
            'phones': [x for x in c.get('phones', []) if re.match(r'^\+\d{8,15}(,\d+)?$', x)],
            'email': c.get('email') if re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', c.get('email') or '') else None,
            'community': True, 'source': {'url': src['url'], 'checked_on': src.get('checked_on')},
        })

    def key(p):
        city = unicodedata.normalize('NFD', p['city']).encode('ascii', 'ignore').decode().lower()
        name = unicodedata.normalize('NFD', p['name']).encode('ascii', 'ignore').decode().lower()
        return city, name
    places.sort(key=key)
    return places, data.get('find')


def fill(text, **vars):
    return re.sub(r'\{(\w+)\}', lambda m: str(vars[m.group(1)]) if m.group(1) in vars else m.group(0), text)


def format_phone(tel, ext_word):
    m = re.match(r'^\+1(\d{3})(\d{3})(\d{4})(?:,(\d+))?$', tel)
    if not m:
        return tel
    return '(%s) %s-%s' % m.groups()[:3] + (' %s %s' % (ext_word, m.group(4)) if m.group(4) else '')


def clean_address(address):
    m = re.search(r'\d', address)
    a = address[m.start():] if m else address
    m = re.match(r'^(.*?\bCA,?\s+\d{5})', a)
    return m.group(1) if m else a


def short_date(strings, iso):
    y, m, d = (int(x) for x in iso.split('-'))
    return fill(strings['shortDate'], d=d, m=strings['months'][m - 1], y=y)


def host(url):
    return re.sub(r'^www\.', '', re.sub(r'^https?://([^/:?#]+).*$', r'\1', url))


def issue_url(base, title, body):
    """A link that opens a new GitHub issue with the title and text already filled in."""
    return '%s?title=%s&body=%s' % (base, quote(title, safe="!~*'()"), quote(body, safe="!~*'()"))


def report_url(base, strings, p):
    return issue_url(base, fill(strings['reportTitle'], name=p['name']), fill(strings['reportBody'], name=p['name'], id=p['id']))


def card(p, lang, strings, find, ic, report_base):
    t = lambda k: strings[k]  # noqa: E731
    out = ['<article class="card" id="place-%s" data-id="%s">' % (esc(str(p['id'])), esc(str(p['id']))), '<h2>%s</h2>' % esc(p['name'])]

    sep = '<span class="sr-only">, </span><span aria-hidden="true"> · </span>'
    kinds = ', '.join(t('type_' + x) if i == 0 else t('type_' + x).lower() for i, x in enumerate(p['types']))
    out.append('<p class="sub">%s%s%s</p>' % (esc(kinds), sep, esc(p['city'])))

    alert = p.get('alert')
    if alert:
        text = alert if isinstance(alert, str) else (alert.get(lang) or alert.get('en') or alert.get('es'))
        if text:
            out.append('<div class="alert">%s<p><span class="sr-only">%s: </span>%s</p></div>'
                       % (ic['alert'], esc(t('alertLabel')), esc(text)))

    def row(cls, icon, inner):
        return '<div class="row%s">%s<div>%s</div></div>' % (' ' + cls if cls else '', icon, inner)

    def list_row(cls, icon, label, lines):
        lis = ''.join('<li>%s</li>' % esc(re.sub(r'(\d) (AM|PM)', r'\1' + NBSP + r'\2', h)) for h in lines)
        sr = '<span class="sr-only">%s: </span>' % esc(label) if label else ''
        return row(cls, icon, '%s<ul>%s</ul>' % (sr, lis))

    meta = []
    if not p.get('noDirections'):
        meta.append(row('', ic['pin'], '<span class="sr-only">%s: </span>%s' % (esc(t('address')), esc(p['address']))))
    meta.append(list_row('', ic['clock'], t('hours'), p['hours_es'] if lang == 'es' else p['hours']))
    notes = p.get('notes_es' if lang == 'es' else 'notes') or []
    if notes:
        meta.append(list_row('note', ic['info'], '', notes))
    contact = p.get('contact_es' if lang == 'es' else 'contact')
    if contact and re.search(r'[A-Za-zÁÉÍÓÚáéíóúñÑ]{3,}', contact):
        c = re.sub(r'\)\s(\d)', ')' + NBSP + r'\1', re.sub(r'(\d)-(\d)', r'\1' + NB_HYPHEN + r'\2', contact))
        meta.append(row('small', ic['user'], esc(t('contact') + ': ' + c)))
    if p.get('email'):
        meta.append(row('small link', ic['mail'], '<span class="sr-only">%s: </span><a class="mail" href="mailto:%s">%s</a>'
                        % (esc(t('email')), esc(p['email']), esc(p['email']))))
    src = p.get('source')
    if src:
        label = fill(t('sourceFrom'), org=p.get('org') or host(src['url']))
        checked = '<span>%s</span>' % esc(fill(t('sourceChecked'), date=short_date(strings, src['checked_on']))) if src.get('checked_on') else ''
        meta.append(row('small link src-line', ic['doc'],
                        '<a class="src" href="%s" rel="noopener">%s</a>%s' % (esc(src['url']), esc(label), checked)))
    out.append('<div class="meta">%s</div>' % ''.join(meta))

    def tile(tag, cls, icon, label, sub='', attrs=''):
        return '<%s class="btn %s"%s>%s<span>%s</span>%s</%s>' % (
            tag, cls, attrs, icon, esc(label), '<span class="num">%s</span>' % esc(sub) if sub else '', tag)

    def call_tile(tel, label, aria):
        num = format_phone(tel, t('ext')).replace(') ', ')' + NBSP).replace('-', NB_HYPHEN, 1)
        return tile('a', 'call', ic['phone'], label, num, ' href="tel:%s" aria-label="%s"' % (esc(tel), esc(aria)))

    btns = []
    phones = p.get('phones') or []
    for tel in phones:
        btns.append(call_tile(tel, t('callShort'), fill(t('call'), num=format_phone(tel, t('ext')))))
    if not phones and find:
        btns.append(call_tile(find['phone'], t('callFindShort'), fill(t('callFind'), num=find['phone_display'])))
    if p.get('noDirections'):
        btns.append(tile('div', 'nodir', ic['pin'], t('callForLocation')))
    else:
        href = 'https://www.google.com/maps/dir/?api=1&destination=' + quote(clean_address(p['address']), safe="!~*'()")
        d = tile('a', 'dir', ic['nav'], t('directions'), '', ' href="%s" target="_blank" rel="noopener"' % esc(href))
        btns.append(d.replace('</a>', '<span class="sr-only"> %s</span></a>' % esc(t('directionsHint'))))
    out.append('<div class="btns%s">%s</div>' % (' three' if len(phones) > 1 else '', ''.join(btns)))
    if not phones:
        out.append('<p class="nophone">%s</p>' % esc(t('noPhone')))
    out.append('<p class="more"><a href="%s" target="_blank" rel="noopener" aria-label="%s">%s</a></p>' % (
        esc(report_url(report_base, strings, p)), esc(fill(t('reportAria'), name=p['name'])), esc(t('reportLink'))))
    out.append('</article>')
    return ''.join(out)


def render_cards(lang, strings, report_base):
    places, find = merged_places()
    ic = icons()
    return '\n'.join(card(p, lang, strings, find, ic, report_base) for p in places), places


def count_text(strings, total):
    return fill(strings['countAll'], total=total)


def street_of(p):
    a = clean_address(p['address'])
    i = a.find(p['city'])
    return a[:i].strip(' ,') if i > 0 else a


def json_ld(lang, strings, site, page_url, places):
    """schema.org list of the places, so search engines can read the same facts as people."""
    items = []
    for n, p in enumerate(places, 1):
        place = {'@type': 'Place', 'name': p['name'], 'isAccessibleForFree': True,
                 'description': ' '.join(p['hours_es'] if lang == 'es' else p['hours'])}
        addr = {'@type': 'PostalAddress', 'addressLocality': p['city'], 'addressRegion': 'CA', 'addressCountry': 'US'}
        if not p.get('noDirections'):
            addr['streetAddress'] = street_of(p)
            z = re.search(r'\bCA,?\s+(\d{5})', p['address'])
            if z:
                addr['postalCode'] = z.group(1)
        place['address'] = addr
        if p.get('phones'):
            place['telephone'] = format_phone(p['phones'][0], strings['ext'])
        items.append({'@type': 'ListItem', 'position': n, 'item': place})
    doc = {'@context': 'https://schema.org', '@type': 'ItemList', 'name': strings['siteName'], 'url': page_url,
           'inLanguage': lang, 'numberOfItems': len(items), 'itemListElement': items}
    blob = json.dumps(doc, ensure_ascii=False, indent=1).replace('</', '<\\/').replace('<!--', '<\\!--')
    return '<script type="application/ld+json">\n%s\n</script>' % blob
