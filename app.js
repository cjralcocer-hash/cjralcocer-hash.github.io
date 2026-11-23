/* comidacoachellavalley
   Loads data.json and shows the list. No libraries, no tracking, nothing saved on the phone.
   The Spanish page is /index.html and the English page is /en/index.html. Both use this file.
   The page language comes from <html lang="..."> on each page. */
(function () {
  'use strict';

  var STR = {
    en: {
      skip: 'Skip to the list',
      siteName: 'comidacoachellavalley',
      title: 'Free food places in the Coachella Valley',
      lead: 'Food pantries, mobile markets and hot meals. Search or filter, then call or get directions.',
      checkedFind: 'FIND Food Bank: checked {date}',
      checkedCommunity: 'Churches and groups: checked {date}',
      sourceFrom: 'Info from {org}',
      sourceChecked: 'Checked {date}',
      stale: 'Not re-checked recently — call first',
      callForLocation: 'Call for the location',
      callShort: 'Call',
      callFindShort: 'Call FIND',
      alertLabel: 'Notice',
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      shortDate: function (d, m, y) { return m + ' ' + d + ', ' + y; },
      toolsTitle: 'Search and filters',
      searchLabel: 'Search',
      searchPh: 'Name, city or street',
      cityLabel: 'City',
      allCities: 'All cities',
      typeLabel: 'Type',
      allTypes: 'All types',
      type_pantry: 'Food pantry',
      type_mobile: 'Mobile market',
      type_meals: 'Hot meals',
      openToday: 'Open today',
      loading: 'Loading the list…',
      clear: 'Clear filters',
      contactTitle: 'Need help? Contact FIND Food Bank',
      contactLead: 'FIND Food Bank keeps the list of places and the monthly Mobile Market calendar. They can help if a place has no phone number or if you are not sure where to go.',
      contactCall: 'Call (760) 775-3663',
      contactAddressLabel: 'Address',
      contactAddress: '83775 Citrus Ave, Indio, CA 92201',
      contactEmailLabel: 'Email',
      contactHours: 'Phone hours: Monday to Friday, 8 AM to 4:30 PM.',
      contactCalendar: "See FIND's Mobile Market calendar",
      footer1: 'A student project for the California State Seal of Civic Engagement. Not run by FIND Food Bank.',
      footer2: "Information comes from FIND Food Bank's public map page and its monthly Mobile Market calendar. Hours can change, so please call before you go.",
      footerSource: 'See the original list',
      footer3: 'This site does not collect any personal information.',
      toTop: 'Back to top',
      docTitle: 'Free Food in the Coachella Valley | comidacoachellavalley',
      count: function (n, total) { return n === total ? 'Showing all ' + total + ' places' : 'Showing ' + n + ' of ' + total + ' places'; },
      none: 'No places match your search.',
      address: 'Address',
      hours: 'Hours',
      contact: 'Contact',
      email: 'Email',
      directions: 'Directions',
      directionsHint: '(opens Google Maps)',
      call: function (num) { return 'Call ' + num; },
      callFind: function (num) { return 'Call FIND Food Bank ' + num; },
      ext: 'ext.',
      noPhone: 'No phone number is listed for this site. FIND Food Bank can help.',
      unclear: function (n) { return n === 1 ? '1 place has hours that do not say which days, so "Open today" hides it.' : n + ' places have hours that do not say which days, so "Open today" hides them.'; },
      loadError: 'Sorry, the list could not load. Please refresh the page.'
    },
    es: {
      skip: 'Ir a la lista',
      siteName: 'comidacoachellavalley',
      title: 'Lugares de comida gratis en el Valle de Coachella',
      lead: 'Despensas de comida, mercados móviles y comidas calientes. Busque o filtre, y luego llame o vea cómo llegar.',
      checkedFind: 'FIND Food Bank: revisado el {date}',
      checkedCommunity: 'Iglesias y grupos: revisado el {date}',
      sourceFrom: 'Información de {org}',
      sourceChecked: 'Revisado el {date}',
      stale: 'No se ha revisado hace tiempo — llame antes de ir',
      callForLocation: 'Llame para saber el lugar',
      callShort: 'Llamar',
      callFindShort: 'Llamar a FIND',
      alertLabel: 'Aviso',
      months: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'],
      shortDate: function (d, m, y) { return d + ' ' + m + ' ' + y; },
      toolsTitle: 'Búsqueda y filtros',
      searchLabel: 'Buscar',
      searchPh: 'Nombre, ciudad o calle',
      cityLabel: 'Ciudad',
      allCities: 'Todas las ciudades',
      typeLabel: 'Tipo',
      allTypes: 'Todos los tipos',
      type_pantry: 'Despensa de comida',
      type_mobile: 'Mercado móvil',
      type_meals: 'Comidas calientes',
      openToday: 'Abierto hoy',
      loading: 'Cargando la lista…',
      clear: 'Borrar filtros',
      contactTitle: '¿Necesita ayuda? Contacte a FIND Food Bank',
      contactLead: 'FIND Food Bank mantiene la lista de lugares y el calendario mensual del Mercado Móvil. Pueden ayudarle si un lugar no tiene número de teléfono o si no sabe a dónde ir.',
      contactCall: 'Llamar al (760) 775-3663',
      contactAddressLabel: 'Dirección',
      contactAddress: '83775 Citrus Ave, Indio, CA 92201',
      contactEmailLabel: 'Correo electrónico',
      contactHours: 'Horario de teléfono: de lunes a viernes, de 8 AM a 4:30 PM.',
      contactCalendar: 'Ver el calendario del Mercado Móvil de FIND',
      footer1: 'Proyecto estudiantil para el Sello Estatal de Compromiso Cívico de California. No lo administra FIND Food Bank.',
      footer2: 'La información viene de la página pública del mapa de FIND Food Bank y de su calendario mensual del Mercado Móvil. Los horarios pueden cambiar, así que por favor llame antes de ir.',
      footerSource: 'Ver la lista original',
      footer3: 'Este sitio no recoge ninguna información personal.',
      toTop: 'Volver arriba',
      docTitle: 'Comida gratis en el Valle de Coachella | comidacoachellavalley',
      count: function (n, total) { return n === total ? 'Mostrando los ' + total + ' lugares' : 'Mostrando ' + n + ' de ' + total + ' lugares'; },
      none: 'Ningún lugar coincide con su búsqueda.',
      address: 'Dirección',
      hours: 'Horario',
      contact: 'Contacto',
      email: 'Correo electrónico',
      directions: 'Cómo llegar',
      directionsHint: '(abre Google Maps)',
      call: function (num) { return 'Llamar al ' + num; },
      callFind: function (num) { return 'Llamar a FIND Food Bank ' + num; },
      ext: 'ext.',
      noPhone: 'No hay número de teléfono para este lugar. FIND Food Bank puede ayudarle.',
      unclear: function (n) { return n === 1 ? '1 lugar tiene un horario que no dice qué días, así que "Abierto hoy" lo oculta.' : n + ' lugares tienen horarios que no dicen qué días, así que "Abierto hoy" los oculta.'; },
      loadError: 'Lo sentimos, la lista no se pudo cargar. Por favor recargue la página.'
    }
  };

  var ICON = {
    pin: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    clock: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    info: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
    phone: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
    nav: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 21 3l-8 18-2-8-8-2z"/></svg>',
    alert: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17v.5"/></svg>',
    user: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    mail: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    doc: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>'
  };
  var TYPES = ['pantry', 'mobile', 'meals'];

  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  var $ = function (id) { return document.getElementById(id); };
  var els = {
    q: $('q'), city: $('city'), type: $('type'), today: $('today'), todayName: $('todayName'),
    count: $('count'), clear: $('clear'), unclear: $('unclearNote'), results: $('results'), notice: $('notice'), checked: $('checked')
  };

  var places = [];
  var info = { calendarMonth: '', closure: null, find: null, notices: [] };
  var lang = document.documentElement.lang === 'es' ? 'es' : 'en';
  // data.json and community.json sit next to app.js, so find them from this script's own address (works on both pages).
  var base = document.currentScript ? document.currentScript.src : location.href;
  var dataUrl = new URL('data.json', base).href;
  var communityUrl = new URL('community.json', base).href;
  var now = testDate() || new Date();

  // For testing only: add ?date=2026-11-21 to the address to pretend it is that day.
  function testDate() {
    var m = /[?&]date=(\d{4})-(\d{2})-(\d{2})/.exec(location.search);
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }

  function iso(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }

  function t(key) { return STR[lang][key]; }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function norm(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

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

  function parseIso(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }

  // Built by hand: older phones format dates differently. "20 nov 2026" / "Nov 20, 2026".
  function shortDate(isoDate) {
    var d = parseIso(isoDate);
    return t('shortDate')(d.getDate(), t('months')[d.getMonth()], d.getFullYear());
  }

  // More than 90 days between the source check and today (or ?date=).
  function isStale(source) {
    var d = parseIso(source.checked_on);
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((today - d) / 864e5) > 90;
  }

  function applyStaticText() {
    document.documentElement.lang = lang;
    document.title = t('docTitle');
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var v = STR[lang][nodes[i].getAttribute('data-i18n')];
      if (typeof v === 'string') nodes[i].textContent = v;
    }
    var ph = document.querySelectorAll('[data-i18n-ph]');
    for (var j = 0; j < ph.length; j++) ph[j].placeholder = t(ph[j].getAttribute('data-i18n-ph'));
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
        btns.appendChild(callTile(tel, t('callShort'), t('call')(formatPhone(tel))));
      });
    } else if (info.find) {
      btns.appendChild(callTile(info.find.phone, t('callFindShort'), t('callFind')(info.find.phone_display)));
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
    return c;
  }

  // community.json: church and group sites, plus corrections to FIND listings. Anything malformed is skipped.
  function str(x) { return typeof x === 'string' && x ? x : null; }
  function strs(a) { return Array.isArray(a) ? a.filter(str) : []; }

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

    els.count.textContent = t('count')(shown.length, places.length);
    els.clear.hidden = !(words.length || city || type || todayOnly);
    els.unclear.hidden = !(todayOnly && hiddenUnclear);
    els.unclear.textContent = hiddenUnclear ? t('unclear')(hiddenUnclear) : '';
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

  function getJson(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }

  // community.json is optional: if it is missing or broken, the FIND list shows as before.
  Promise.all([getJson(dataUrl), getJson(communityUrl).catch(function () { return null; })])
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
      els.count.removeAttribute('data-i18n');
      buildCityOptions();
      showNotices();
      render();
    })
    .catch(function () {
      els.count.textContent = t('loadError');
    });
})();
