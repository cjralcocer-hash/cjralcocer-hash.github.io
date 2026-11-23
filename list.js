/* comidacoachellavalley: the list page (search, filters, cards).
   Loads data.json and shows the list. No libraries, no tracking, nothing saved on the phone.
   The Spanish page is /index.html and the English page is /en/index.html. Both use this file.
   The page language comes from <html lang="..."> on each page. */
(function () {
  'use strict';

  // This script belongs to the page with the list. On any other page it does nothing.
  if (!document.getElementById('results') || !window.CV) return;

  var CV = window.CV, t = CV.t, lang = CV.lang, el = CV.el, norm = CV.norm, iso = CV.iso, parseIso = CV.parseIso;
  var shortDate = CV.shortDate, str = CV.str, strs = CV.strs, ICON = CV.ICON, now = CV.now, STR = CV.STR;

  var TYPES = ['pantry', 'mobile', 'meals'];

  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  var $ = function (id) { return document.getElementById(id); };
  var els = {
    q: $('q'), city: $('city'), type: $('type'), today: $('today'), todayName: $('todayName'),
    count: $('count'), clear: $('clear'), unclear: $('unclearNote'), results: $('results'), notice: $('notice'), checked: $('checked')
  };

  var places = [];
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

  // "Report a problem" opens a new GitHub issue with the place's name filled in. Same link as the build writes.
  function reportLink(p) {
    var wrap = el('p', 'report');
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

  function card(p, isOpenToday) {
    var c = el('article', 'card');
    c.setAttribute('data-id', p.id);
    c.appendChild(el('h2', null, p.name));

    // One quiet line: ● Open today · Food pantry · Indio
    var sub = el('p', 'sub');
    if (isOpenToday) {
      var o = el('span', 'open');
      o.appendChild(el('span', 'dot'));
      o.appendChild(document.createTextNode(t('openToday')));
      sub.appendChild(o);
      sep(sub);
    }
    sub.appendChild(document.createTextNode(p.types.map(function (x, i) {
      var s = t('type_' + x);
      return i ? s.toLowerCase() : s;
    }).join(', ')));
    sep(sub);
    sub.appendChild(document.createTextNode(p.city));
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
    c.appendChild(reportLink(p));
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

  function render() {
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
      shown.push({ p: p, open: open });
    });

    var frag = document.createDocumentFragment();
    shown.forEach(function (x) { frag.appendChild(card(x.p, x.open)); });
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

  els.q.addEventListener('input', render);
  els.city.addEventListener('change', render);
  els.type.addEventListener('change', render);
  els.today.addEventListener('change', render);
  els.clear.addEventListener('click', clearAll);

  applyStaticText();

  // community.json is optional: if it is missing or broken, the FIND list shows as before.
  Promise.all([CV.getJson('data.json'), CV.getJson('community.json').catch(function () { return null; })])
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
    })
    .catch(function () {
      els.count.textContent = t('loadError');
    });
})();
