#!/usr/bin/env python3
"""Finds map coordinates for places that have none yet, and writes them to geo.json.

    python3 scripts/geocode.py           add the places that are missing or whose address changed
    python3 scripts/geocode.py --check   change nothing; exit 1 if a place is missing or out of date

The site's "Near me" button sorts places by straight-line distance from the visitor, using geo.json.
Coordinates come from OpenStreetMap's Nominatim service (one request per second, as its policy asks), so they
are only fetched when a place is new or its address changed. Run this after adding a place or changing an address.
Needs Python 3.9 or newer and no packages. Each entry keeps the address it was looked up for, so check.py can tell
when an address was edited and the coordinates are out of date.
"""
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import places  # noqa: E402

GEO = os.path.join(ROOT, 'geo.json')
UA = 'comidacoachellavalley-geocode (student project; runs by hand when a place is added)'
# A box around the Coachella Valley and the Salton Sea shore. Anything outside is treated as a wrong match.
BOX = {'lat': (33.25, 34.10), 'lon': (-117.00, -115.40)}


def lookup(query):
    url = 'https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode(
        {'q': query, 'format': 'jsonv2', 'limit': 1, 'countrycodes': 'us'})
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        found = json.load(r)
    time.sleep(1.1)
    if not found:
        return None
    lat, lon = float(found[0]['lat']), float(found[0]['lon'])
    ok = BOX['lat'][0] <= lat <= BOX['lat'][1] and BOX['lon'][0] <= lon <= BOX['lon'][1]
    return (round(lat, 5), round(lon, 5)) if ok else None


def variants(address):
    """The address as written, then simpler spellings that Nominatim is more likely to know."""
    a = places.clean_address(address)
    out = [a]
    b = re.sub(r'^(\d+)-(\d+)', r'\1\2', a)                       # 74-200 -> 74200
    b = re.sub(r',?\s*(?:Ste|Suite|Unit)\.?\s*\w+', '', b)             # drop "Ste. 101"
    b = re.sub(r'\bAve\.?(?=\s|,)', 'Avenue', b)
    b = re.sub(r'\bAvenue\s+(\d+)(?:st|nd|rd|th)\b', r'\1th Avenue', b)
    b = re.sub(r'\b(Blvd|Dr|St|Rd|Ln|Pkwy)\.', lambda m: {'Blvd': 'Boulevard', 'Dr': 'Drive', 'St': 'Street', 'Rd': 'Road', 'Ln': 'Lane', 'Pkwy': 'Parkway'}[m.group(1)], b)
    if b != a:
        out.append(b)
    return out


def load():
    try:
        with open(GEO, encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {'note': '', 'places': {}}


def wanted():
    """(id, address, city, noDirections) for every place on the site."""
    plist, _ = places.merged_places()
    return [(str(p['id']), p['address'], p['city'], bool(p.get('noDirections'))) for p in plist]


def needs_lookup(geo, pid, address, no_dir):
    if no_dir:
        return False
    e = geo['places'].get(pid)
    return not e or e.get('address') != address


def main(argv):
    geo = load()
    todo = [w for w in wanted() if needs_lookup(geo, w[0], w[1], w[3])]
    if '--check' in argv:
        for pid, address, _, _ in todo:
            print('needs coordinates: %s  %s' % (pid, address))
        if not todo:
            print('geo.json is up to date.')
        return 1 if todo else 0
    for pid, address, city, _ in todo:
        pos = None
        for q in variants(address):
            pos = lookup(q)
            if pos:
                break
        approx = False
        if not pos:
            pos = lookup('%s, CA' % city.split('/')[0].strip()) or lookup('%s, CA' % address.split(',')[-2].split('/')[0].strip())
            approx = True
        if not pos:
            print('NO MATCH: %s  %s' % (pid, address))
            continue
        entry = {'address': address, 'lat': pos[0], 'lon': pos[1]}
        if approx:
            entry['approx'] = True
        geo['places'][pid] = entry
        print('%s  %s -> %s%s' % (pid, address, pos, ' (city only)' if approx else ''))
    geo['note'] = ('Map coordinates for "Near me" sorting, from OpenStreetMap Nominatim (data (c) OpenStreetMap contributors, ODbL). '
                   'Made by scripts/geocode.py. "approx" means only the city could be found.')
    geo['places'] = dict(sorted(geo['places'].items(), key=lambda kv: kv[0]))
    with open(GEO, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(geo, f, ensure_ascii=False, indent=1)
        f.write('\n')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
