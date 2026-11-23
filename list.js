/* comidacoachellavalley: the list page (search, filters, cards).
   Loads data.json and shows the list. No libraries, no tracking, nothing saved on the phone.
   The Spanish page is /index.html and the English page is /en/index.html. Both use this file.
   The page language comes from <html lang="..."> on each page. */
(function () {
  'use strict';

  // This script belongs to the page with the list. On any other page it does nothing.
  if (!document.getElementById('results') || !window.CV) return;

  var CV = window.CV, t = CV.t, lang = CV.lang, el = CV.el, norm = CV.norm, iso = CV.iso, parseIso = CV.parseIso;
  var shortDate = CV.shortDate, str = CV.str, strs = CV.strs, ICON = CV.ICON, STR = CV.STR;
  var now = CV.getNow();  // set again each time the list is drawn, so "open now" does not go stale

  var TYPES = ['pantry', 'mobile', 'meals'];

  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  var $ = function (id) { return document.getElementById(id); };
  var els = {
    q: $('q'), city: $('city'), type: $('type'), today: $('today'), todayName: $('todayName'),
    count: $('count'), clear: $('clear'), unclear: $('unclearNote'), results: $('results'), notice: $('notice'), checked: $('checked'),
    nearWrap: $('nearWrap'), near: $('near'), nearLabel: $('nearLabel'), nearMsg: $('nearMsg'), live: $('live')
  };

  var places = [];
  var geo = {};                       // geo.json: map coordinates by place id
  var near = { on: false, pos: null }; // "Near me": the visitor's position lives only in this variable
  var info = { calendarMonth: '', closure: null, find: null, notices: [] };

  // Is this place giving out food on this date? Uses its schedule rules, then FIND's monthly calendar and closure.
  function openOn(p, date) {
    var today = iso(date);
    var mobile = !p.community && p.types.indexOf('mobile') !== -1;  // FIND's calendar and closure cover only FIND markets
    if (mobile && info.closure && today >= info.closure.from && today <= info.closure.to) return false;
    if (p.add_dates && p.add_dates.indexOf(today) !== -1) return true;
    if (mobile && p.on_calendar === false && info.calendarMonth && today.indexOf(info.calendarMonth) === 0) return false;
    if (!p.schedule) return false;
    var dow = DAYS[date.getDay()];
    var dom = date.getDate();
    var nth = Math.ceil(dom / 7);
    var daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    var isLast = dom + 7 > daysInMonth;
    var month = date.getMonth() + 1;
    return p.schedule.some(function (r) {
      if (r.days.indexOf(dow) === -1) return false;
      if (r.weeks && !r.weeks.some(function (w) { return w === nth || (w === 'last' && isLast); })) return false;
      if (r.dom && (dom < r.dom[0] || dom > r.dom[1])) return false;
      if (r.months && r.months.indexOf(month) === -1) return false;
      return true;
    });
  }

  // Times of day for a place, read from its English hours text. Only when that is unambiguous: every time in the
  // text belongs to a "7:00 AM to 9:00 AM" range, and there is one range, or two on the same line (morning and
  // afternoon). Anything else (different days with different times, "starts at 3 PM", meals at set times)
  // gives null, and the card says only "Open today".
  var TIME = '(\\d{1,2})(?::(\\d{2}))?\\s*([AP])M';
  function minutes(h, m, ap) { return (+h % 12) * 60 + (m ? +m : 0) + (ap.toUpperCase() === 'P' ? 720 : 0); }
  function label(h, m, ap) { return +h + ':' + (m || '00') + '\u00a0' + ap.toUpperCase() + 'M'; }
  function windowsOf(p) {
    if (p.windows !== undefined) return p.windows;
    var w = null, lines = p.hours || [];
    var all = 0, ranges = [], lineOfRange = [];
    lines.forEach(function (line, i) {
      all += (line.match(new RegExp(TIME, 'gi')) || []).length;
      var re = new RegExp(TIME + '\\s*(?:to|-|\u2013)\\s*' + TIME, 'gi'), m;
      while ((m = re.exec(line))) {
        var a = minutes(m[1], m[2], m[3]), b = minutes(m[4], m[5], m[6]);
        if (b > a) ranges.push({ from: a, to: b, fromLabel: label(m[1], m[2], m[3]), toLabel: label(m[4], m[5], m[6]) });
        else all += 99;  // a range that runs past midnight: do not guess
        lineOfRange.push(i);
      }
    });
    if (ranges.length && ranges.length <= 2 && all === ranges.length * 2 && (ranges.length === 1 || lineOfRange[0] === lineOfRange[1])) w = ranges;
    p.windows = w;
    return w;
  }

  // Where is a place that is open today in its day? Returns { kind, time } or null (no times we can trust).
  // kind: open (until time) | soon (closes within the hour, at time) | later (opens at time) | over (finished).
  function statusToday(p) {
    var w = windowsOf(p);
    if (!w) return null;
    var nowMin = now.getHours() * 60 + now.getMinutes();
    for (var i = 0; i < w.length; i++) {
      if (nowMin >= w[i].from && nowMin < w[i].to) return { kind: w[i].to - nowMin <= 60 ? 'soon' : 'open', time: w[i].toLabel };
      if (nowMin < w[i].from) return { kind: 'later', time: w[i].fromLabel };
    }
    return { kind: 'over' };
  }

  function formatPhone(tel) {
    var m = /^\+1(\d{3})(\d{3})(\d{4})(?:,(\d+))?$/.exec(tel);
    if (!m) return tel;
    return '(' + m[1] + ') ' + m[2] + '-' + m[3] + (m[4] ? ' ' + t('ext') + ' ' + m[4] : '');
  }

  function cleanAddress(address) {
    var a = address.slice(Math.max(0, address.search(/\d/)));
    var m = /^(.*?\bCA,?\s+\d{5})/.exec(a);
    return m ? m[1] : a;
  }

  function directionsUrl(address) {
    return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(cleanAddress(address));
  }

  // More than 90 days between the source check and today (or ?date=).
  function isStale(source) {
    var d = parseIso(source.checked_on);
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((today - d) / 864e5) > 90;
  }

  // The page text itself is written by the build; only the weekday name depends on today's date.
  function applyStaticText() {
    var day = now.toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { weekday: 'long' });
    els.todayName.textContent = '(' + day + ')';
  }

  // Short notices from data.json (for example the holiday closure). They show only between their dates.
  function showNotices() {
    var today = iso(now);
    var list = info.notices.filter(function (n) { return today >= n.from && today <= n.until; });
    els.notice.innerHTML = ICON.info;
    list.forEach(function (n) {
      var p = el('p', null, n[lang]);
      els.notice.appendChild(p);
    });
    els.notice.hidden = !list.length;
  }

  function buildCityOptions() {
    var counts = {};
    places.forEach(function (p) { counts[p.city] = (counts[p.city] || 0) + 1; });
    Object.keys(counts).sort().forEach(function (c) {
      var o = el('option', null, c + ' (' + counts[c] + ')');
      o.value = c;
      els.city.appendChild(o);
    });
  }

  function matches(p, words, city, type) {
    if (city && p.city !== city) return false;
    if (type && p.types.indexOf(type) === -1) return false;
    if (!words.length) return true;
    var hay = norm([p.name, p.org, p.city, p.address, p.hours.join(' '), p.hours_es.join(' '),
      p.types.map(function (x) { return STR.en['type_' + x] + ' ' + STR.es['type_' + x]; }).join(' ')].join(' '));
    return words.every(function (w) { return hay.indexOf(w) !== -1; });
  }

  function listRow(cls, icon, srLabel, lines) {
    var row = el('div', 'row' + (cls ? ' ' + cls : ''));
    row.innerHTML = icon;
    var box = el('div');
    if (srLabel) box.appendChild(el('span', 'sr-only', srLabel + ': '));
    var ul = el('ul');
    lines.forEach(function (h) { ul.appendChild(el('li', null, h.replace(/(\d) (AM|PM)/g, '$1\u00a0$2'))); });
    box.appendChild(ul);
    row.appendChild(box);
    return row;
  }

  // Screen readers hear a comma, eyes see a middle dot.
  function sep(parent) {
    parent.appendChild(el('span', 'sr-only', ', '));
    var s = el('span', null, ' · ');
    s.setAttribute('aria-hidden', 'true');
    parent.appendChild(s);
  }

  function row(cls, icon, nodes) {
    var r = el('div', 'row' + (cls ? ' ' + cls : ''));
    r.innerHTML = icon;
    var box = el('div');
    nodes.forEach(function (n) { box.appendChild(typeof n === 'string' ? document.createTextNode(n) : n); });
    r.appendChild(box);
    return r;
  }

  function tile(tag, cls, icon, label, sub) {
    var a = el(tag, 'btn ' + cls);
    a.innerHTML = icon;
    a.appendChild(el('span', null, label));
    if (sub) a.appendChild(el('span', 'num', sub));
    return a;
  }

  function callTile(tel, label, aria) {
    // keep "(760) 775-3663" on one line; an extension may wrap
    var a = tile('a', 'call', ICON.phone, label, formatPhone(tel).replace(') ', ') ').replace('-', '‑'));
    a.href = 'tel:' + tel;
    a.setAttribute('aria-label', aria);
    return a;
  }

  function host(url) {
    return new URL(url).hostname.replace(/^www\./, '');
  }

  // Share this place: the phone's share sheet where there is one, otherwise copy the text.
  var canShare = !!(navigator.share || (navigator.clipboard && navigator.clipboard.writeText));

  function placeUrl(p) {
    var link = document.querySelector('link[rel="canonical"]');
    return (link ? link.href : location.origin + location.pathname).split('#')[0] + '#place-' + p.id;
  }

  function shareText(p) {
    var lines = [p.name];
    if (!p.noDirections) lines.push(cleanAddress(p.address));
    lines = lines.concat(lang === 'es' ? p.hours_es : p.hours);
    if (p.phones.length) lines.push(t('call', { num: formatPhone(p.phones[0]) }));
    return lines.join('\n');
  }

  function sharePlace(p) {
    var text = shareText(p), url = placeUrl(p);
    if (navigator.share) {
      navigator.share({ title: p.name, text: text, url: url }).catch(function () { /* closed without sharing */ });
    } else {
      navigator.clipboard.writeText(text + '\n' + url).then(function () {
        els.live.textContent = '';
        setTimeout(function () { els.live.textContent = t('shareCopied', { name: p.name }); }, 50);
      }, function () { /* copying was refused: nothing to do */ });
    }
  }

  // Under each card: Share (only where it can work) and "Report a problem", which opens a new GitHub issue
  // with the place's name filled in (the same link the build writes).
  function moreRow(p) {
    var wrap = el('p', 'more');
    if (canShare) {
      var b = el('button', null, t('shareLabel'));
      b.type = 'button';
      b.setAttribute('aria-label', t('shareAria', { name: p.name }));
      b.addEventListener('click', function () { sharePlace(p); });
      wrap.appendChild(b);
    }
    var base = document.body.getAttribute('data-report');
    if (!base) return wrap;
    var a = el('a', null, t('reportLink'));
    a.href = base + '?title=' + encodeURIComponent(t('reportTitle', { name: p.name })) +
      '&body=' + encodeURIComponent(t('reportBody', { name: p.name, id: p.id }));
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', t('reportAria', { name: p.name }));
    wrap.appendChild(a);
    return wrap;
  }

  function card(p, isOpenToday, dist) {
    var c = el('article', 'card');
    c.id = 'place-' + p.id;
    c.setAttribute('data-id', p.id);
    c.appendChild(el('h2', null, p.name));

    // One quiet line: ● Open today · Food pantry · Indio
    var sub = el('p', 'sub');
    if (isOpenToday) {
      var st = statusToday(p);
      var o = el('span', 'open' + (st && st.kind === 'over' ? ' over' : ''));
      if (!st || st.kind !== 'over') o.appendChild(el('span', 'dot'));
      var words = !st ? 'openToday' : { open: 'openNowUntil', soon: 'closesSoon', later: 'opensLater', over: 'closedToday' }[st.kind];
      o.appendChild(document.createTextNode(t(words, { time: st ? st.time : '' })));
      sub.appendChild(o);
      sep(sub);
    }
    sub.appendChild(document.createTextNode(p.types.map(function (x, i) {
      var s = t('type_' + x);
      return i ? s.toLowerCase() : s;
    }).join(', ')));
    sep(sub);
    sub.appendChild(document.createTextNode(p.city));
    if (dist != null) {
      sep(sub);
      var n = dist < 10 ? dist.toFixed(1) : String(Math.round(dist));
      sub.appendChild(document.createTextNode(t(p.geo && p.geo.approx ? 'distApprox' : 'distAbout', { n: n })));
    }
    c.appendChild(sub);

    if (p.alert) {
      var al = el('div', 'alert');
      al.innerHTML = ICON.alert;
      var ap = el('p');
      ap.appendChild(el('span', 'sr-only', t('alertLabel') + ': '));
      ap.appendChild(document.createTextNode(p.alert));
      al.appendChild(ap);
      c.appendChild(al);
    }

    var meta = el('div', 'meta');
    // A place marked "no directions" (for example one that left its building) shows no street address.
    if (!p.noDirections) meta.appendChild(row('', ICON.pin, [el('span', 'sr-only', t('address') + ': '), p.address]));
    meta.appendChild(listRow('', ICON.clock, t('hours'), lang === 'es' ? p.hours_es : p.hours));

    var notes = (lang === 'es' ? p.notes_es : p.notes).slice();
    if (p.temp && iso(now) <= p.temp.until) notes.push(p.temp[lang]);
    if (notes.length) meta.appendChild(listRow('note', ICON.info, '', notes));

    var contact = lang === 'es' ? p.contact_es : p.contact;
    if (contact && /[A-Za-zÁÉÍÓÚáéíóúñÑ]{3,}/.test(contact)) {
      // keep phone numbers on one line (non-breaking hyphen)
      meta.appendChild(row('small', ICON.user, [t('contact') + ': ' + contact.replace(/(\d)-(\d)/g, '$1\u2011$2').replace(/\)\s(\d)/g, ')\u00a0$1')]));
    }
    if (p.email) {
      var ma = el('a', 'mail', p.email);
      ma.href = 'mailto:' + p.email;
      meta.appendChild(row('small link', ICON.mail, [el('span', 'sr-only', t('email') + ': '), ma]));
    }
    if (p.source) {
      var sa = el('a', 'src', t('sourceFrom').replace('{org}', p.org || host(p.source.url)));
      sa.href = p.source.url;
      sa.rel = 'noopener';
      meta.appendChild(row('small link src-line', ICON.doc, [sa, el('span', null, t('sourceChecked').replace('{date}', shortDate(p.source.checked_on)))]));
      if (isStale(p.source)) meta.appendChild(row('warn', ICON.alert, [t('stale')]));
    }
    c.appendChild(meta);

    // Every listing gets a Call tile and a Directions tile (or a note when the site has no fixed address).
    var btns = el('div', 'btns' + (p.phones.length > 1 ? ' three' : ''));
    if (p.phones.length) {
      p.phones.forEach(function (tel) {
        btns.appendChild(callTile(tel, t('callShort'), t('call', { num: formatPhone(tel) })));
      });
    } else if (info.find) {
      btns.appendChild(callTile(info.find.phone, t('callFindShort'), t('callFind', { num: info.find.phone_display })));
    }
    if (p.noDirections) {
      btns.appendChild(tile('div', 'nodir', ICON.pin, t('callForLocation')));
    } else {
      var d = tile('a', 'dir', ICON.nav, t('directions'));
      d.href = directionsUrl(p.address);
      d.target = '_blank';
      d.rel = 'noopener';
      d.appendChild(el('span', 'sr-only', ' ' + t('directionsHint')));
      btns.appendChild(d);
    }
    c.appendChild(btns);
    if (!p.phones.length) c.appendChild(el('p', 'nophone', t('noPhone')));
    c.appendChild(moreRow(p));
    return c;
  }

  // community.json: church and group sites, plus corrections to FIND listings. Anything malformed is skipped.
  function cleanSource(s) {
    return s && /^https?:\/\//.test(s.url) && parseIso(s.checked_on) ? { url: s.url, checked_on: s.checked_on } : null;
  }

  function cleanSchedule(sc) {
    if (!Array.isArray(sc) || !sc.length) return null;
    return sc.every(function (r) {
      return r && Array.isArray(r.days) && r.days.length && r.days.every(function (d) { return DAYS.indexOf(d) !== -1; }) &&
        (r.weeks == null || (Array.isArray(r.weeks) && r.weeks.every(function (w) { return w === 'last' || (w >= 1 && w <= 5); }))) &&
        (r.dom == null || (Array.isArray(r.dom) && r.dom.length === 2)) &&
        (r.months == null || Array.isArray(r.months));
    }) ? sc : null;
  }

  function cleanPlace(c) {
    if (!c) return null;
    var name = str(c.name), city = str(c.city), address = str(c.address), source = cleanSource(c.source);
    var hours = strs(c.hours), hoursEs = strs(c.hours_es);
    var types = strs(c.types).filter(function (x) { return TYPES.indexOf(x) !== -1; });
    if (!name || !city || !address || !source || !types.length || !(hours.length || hoursEs.length)) return null;
    return {
      id: String(c.id), name: name, org: str(c.org) || name, city: city, address: address, types: types,
      hours: hours.length ? hours : hoursEs, hours_es: hoursEs.length ? hoursEs : hours,
      notes: strs(c.notes), notes_es: strs(c.notes_es), contact: str(c.contact), contact_es: str(c.contact_es),
      phones: strs(c.phones).filter(function (x) { return /^\+\d{8,15}(,\d+)?$/.test(x); }),
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email) ? c.email : null,
      schedule: cleanSchedule(c.schedule), community: true, source: source
    };
  }

  // Checks everything first, then changes the list. Returns community.json's checked_on date, or null.
  function addCommunity(cj) {
    if (!cj || typeof cj !== 'object') return null;
    var added = (Array.isArray(cj.places) ? cj.places : []).map(cleanPlace).filter(Boolean);
    var byId = {};
    places.forEach(function (p) { byId[p.id] = p; });
    var changes = (Array.isArray(cj.updates) ? cj.updates : []).map(function (u) {
      var p = u && byId[u.find_id], source = u && cleanSource(u.source);
      if (!p || !source) return null;
      var a = u.alert || {};
      var c = { source: source, alert: str(a[lang]) || str(a.en) || str(a.es) };
      if (strs(u.hours).length) c.hours = strs(u.hours);
      if (strs(u.hours_es).length) c.hours_es = strs(u.hours_es);
      if ('schedule' in u) c.schedule = cleanSchedule(u.schedule);
      if (u.no_directions === true) c.noDirections = true;
      return { p: p, c: c };
    }).filter(Boolean);
    changes.forEach(function (x) { for (var k in x.c) x.p[k] = x.c[k]; });
    places = places.concat(added);
    return parseIso(cj.checked_on) ? cj.checked_on : null;
  }

  function distanceMiles(a, b) {
    var rad = Math.PI / 180, dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 3958.8 * 2 * Math.asin(Math.sqrt(h));
  }

  var lastRender = 0;

  function render() {
    now = CV.getNow();
    lastRender = Date.now();
    var words = norm(els.q.value).split(/\s+/).filter(Boolean);
    var city = els.city.value;
    var type = els.type.value;
    var todayOnly = els.today.checked;

    var shown = [];
    var hiddenUnclear = 0;
    places.forEach(function (p) {
      if (!matches(p, words, city, type)) return;
      var open = openOn(p, now);
      if (todayOnly && !open) {
        if (!p.schedule) hiddenUnclear++;
        return;
      }
      shown.push({ p: p, open: open, dist: near.on && near.pos && p.geo ? distanceMiles(near.pos, p.geo) : null });
    });
    if (near.on) {
      // Nearest first. Places with no map spot go last, in their usual order.
      shown = shown.map(function (x, i) { x.i = i; return x; }).sort(function (a, b) {
        if (a.dist == null || b.dist == null) return (a.dist == null) - (b.dist == null) || a.i - b.i;
        return a.dist - b.dist;
      });
    }

    var frag = document.createDocumentFragment();
    shown.forEach(function (x) { frag.appendChild(card(x.p, x.open, x.dist)); });
    if (!shown.length) {
      var e = el('div', 'empty');
      e.appendChild(el('p', null, t('none')));
      var cb = el('button', 'link-btn', t('clear'));
      cb.type = 'button';
      cb.addEventListener('click', clearAll);
      e.appendChild(cb);
      frag.appendChild(e);
    }
    els.results.textContent = '';
    els.results.appendChild(frag);

    els.count.textContent = shown.length === places.length ? t('countAll', { total: places.length }) : t('countSome', { n: shown.length, total: places.length });
    els.clear.hidden = !(words.length || city || type || todayOnly);
    els.unclear.hidden = !(todayOnly && hiddenUnclear);
    els.unclear.textContent = hiddenUnclear ? t(hiddenUnclear === 1 ? 'unclearOne' : 'unclearMany', { n: hiddenUnclear }) : '';
  }

  function clearAll() {
    els.q.value = '';
    els.city.value = '';
    els.type.value = '';
    els.today.checked = false;
    render();
    els.q.focus();
  }

  function nearMessage(key) {
    els.nearMsg.textContent = key ? t(key) : '';
    els.nearMsg.hidden = !key;
  }

  function setNear(on) {
    near.on = on;
    els.near.setAttribute('aria-pressed', on ? 'true' : 'false');
    els.nearLabel.textContent = t(on ? 'nearOff' : 'nearOn');
    nearMessage(on ? 'nearSorted' : '');
    render();
  }

  // One request for the visitor's position, only after they press the button. It is kept in a variable
  // for this visit; it is not sent anywhere and not saved.
  function toggleNear() {
    if (near.on) { near.pos = null; setNear(false); return; }
    nearMessage('nearLocating');
    navigator.geolocation.getCurrentPosition(function (pos) {
      near.pos = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      setNear(true);
    }, function (err) {
      nearMessage(err && err.code === 1 ? 'nearDenied' : 'nearFailed');
    }, { timeout: 15000, maximumAge: 300000 });
  }

  function setUpNear() {
    if (!els.near || !navigator.geolocation || !Object.keys(geo).length) return;
    els.near.insertAdjacentHTML('afterbegin', ICON.pin);
    els.near.addEventListener('click', toggleNear);
    els.nearWrap.hidden = false;
  }

  // A link to one place (#place-8) scrolls to its card once the live list has replaced the built one.
  function goToHash() {
    var m = /^#(place-[\w-]+)$/.exec(location.hash);
    var target = m && document.getElementById(m[1]);
    if (!target) return;
    target.setAttribute('tabindex', '-1');
    target.scrollIntoView();
    target.focus({ preventScroll: true });
  }

  // A tab left open for hours: draw the list again when the visitor comes back, so "open now" is true.
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && places.length && Date.now() - lastRender > 10 * 60 * 1000) render();
  });

  els.q.addEventListener('input', render);
  els.city.addEventListener('change', render);
  els.type.addEventListener('change', render);
  els.today.addEventListener('change', render);
  els.clear.addEventListener('click', clearAll);

  applyStaticText();

  // community.json is optional: if it is missing or broken, the FIND list shows as before.
  // geo.json (map spots for "Near me") is optional too: without it the button stays hidden.
  Promise.all([CV.getJson('data.json'), CV.getJson('community.json').catch(function () { return null; }),
    CV.getJson('geo.json').catch(function () { return null; })])
    .then(function (res) {
      var data = res[0];
      info.calendarMonth = data.calendar_month || '';
      info.closure = data.closure || null;
      info.find = data.find || null;
      info.notices = data.notices || [];
      places = data.places.slice();
      var communityDate = null;
      try { communityDate = addCommunity(res[1]); } catch (e) { communityDate = null; }
      places.sort(function (a, b) {
        return a.city.localeCompare(b.city) || a.name.localeCompare(b.name);
      });
      var gp = res[2] && res[2].places;
      if (gp && typeof gp === 'object') {
        places.forEach(function (p) {
          var g = gp[p.id];
          if (g && typeof g.lat === 'number' && typeof g.lon === 'number' && g.address === p.address) { p.geo = g; geo[p.id] = g; }
        });
      }
      if (data.source && data.source.checked_on && els.checked) {
        els.checked.textContent = t('checkedFind').replace('{date}', shortDate(data.source.checked_on));
        if (communityDate) {
          sep(els.checked);
          els.checked.appendChild(document.createTextNode(t('checkedCommunity').replace('{date}', shortDate(communityDate))));
        }
      }
      buildCityOptions();
      showNotices();
      render();
      setUpNear();
      goToHash();
    })
    .catch(function () {
      els.count.textContent = t('loadError');
    });
})();
