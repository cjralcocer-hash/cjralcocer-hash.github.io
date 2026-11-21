/* Food Near You / Comida Cerca
   Loads data.json and shows the list. No libraries, no tracking, nothing saved on the phone.
   The Spanish page is /index.html and the English page is /en/index.html. Both use this file.
   The page language comes from <html lang="..."> on each page. */
(function () {
  'use strict';

  var STR = {
    en: {
      skip: 'Skip to the list',
      siteName: 'Food Near You',
      title: 'Free food places in the Coachella Valley',
      lead: 'Food pantries, mobile markets and hot meals. Search or filter, then call or get directions.',
      checkedLine: 'Information from FIND Food Bank. Last checked {date}.',
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
      docTitle: 'Free Food in the Coachella Valley | Food Near You',
      count: function (n, total) { return n === total ? 'Showing all ' + total + ' places' : 'Showing ' + n + ' of ' + total + ' places'; },
      none: 'No places match your search.',
      openTodayBadge: 'Open today',
      address: 'Address',
      hours: 'Hours',
      contact: 'Contact:',
      email: 'Email:',
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
      siteName: 'Comida Cerca',
      title: 'Lugares de comida gratis en el Valle de Coachella',
      lead: 'Despensas de comida, mercados móviles y comidas calientes. Busque o filtre, y luego llame o vea cómo llegar.',
      checkedLine: 'Información de FIND Food Bank. Última revisión: {date}.',
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
      docTitle: 'Comida gratis en el Valle de Coachella | Comida Cerca',
      count: function (n, total) { return n === total ? 'Mostrando los ' + total + ' lugares' : 'Mostrando ' + n + ' de ' + total + ' lugares'; },
      none: 'Ningún lugar coincide con su búsqueda.',
      openTodayBadge: 'Abierto hoy',
      address: 'Dirección',
      hours: 'Horario',
      contact: 'Contacto:',
      email: 'Correo electrónico:',
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
    truck: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/></svg>',
    basket: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h16l-1.5 10h-13z"/><path d="M8 10l3-6M16 10l-3-6"/></svg>',
    bowl: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18a9 9 0 0 1-18 0z"/><path d="M9 8c0-1.5 1-2 1-3.5M14 8c0-1.5 1-2 1-3.5"/></svg>',
    sun: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/></svg>'
  };

  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  var $ = function (id) { return document.getElementById(id); };
  var els = {
    q: $('q'), city: $('city'), type: $('type'), today: $('today'), todayName: $('todayName'),
    count: $('count'), clear: $('clear'), unclear: $('unclearNote'), results: $('results'), notice: $('notice'), checked: $('checked')
  };

  var places = [];
  var info = { calendarMonth: '', closure: null, find: null, notices: [] };
  var lang = document.documentElement.lang === 'es' ? 'es' : 'en';
  // data.json sits next to app.js, so find it from this script's own address (works on both pages).
  var dataUrl = new URL('data.json', document.currentScript ? document.currentScript.src : location.href).href;
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

  // Is this place giving out food on this date? Uses its schedule rules, then the November calendar and closure.
  function openOn(p, date) {
    var today = iso(date);
    var mobile = p.types.indexOf('mobile') !== -1;
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

  function formatDate(isoDate) {
    var p = isoDate.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
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
    els.notice.textContent = '';
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
    var hay = norm([p.name, p.city, p.address, p.hours.join(' '), p.hours_es.join(' '),
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

  function button(href, icon, label, fill, external, hint) {
    var a = el('a', 'btn' + (fill ? ' fill' : ''));
    a.href = href;
    if (external) { a.target = '_blank'; a.rel = 'noopener'; }
    a.innerHTML = icon;
    a.appendChild(document.createTextNode(label));
    if (hint) a.appendChild(el('span', 'sr-only', ' ' + hint));
    return a;
  }

  function card(p, isOpenToday) {
    var c = el('article', 'card');

    var tags = el('div', 'tags');
    var TYPE_ICON = { pantry: ICON.basket, mobile: ICON.truck, meals: ICON.bowl };
    p.types.forEach(function (x) {
      var ty = el('span', 'type');
      ty.innerHTML = TYPE_ICON[x] || '';
      ty.appendChild(document.createTextNode(t('type_' + x)));
      tags.appendChild(ty);
    });
    if (isOpenToday) {
      var b = el('span', 'badge now');
      b.innerHTML = ICON.sun;
      b.appendChild(document.createTextNode(t('openTodayBadge')));
      tags.appendChild(b);
    }
    c.appendChild(tags);

    c.appendChild(el('h2', null, p.name));

    var meta = el('div', 'meta');

    var addr = el('div', 'row');
    addr.innerHTML = ICON.pin;
    var addrText = el('div');
    addrText.appendChild(el('span', 'sr-only', t('address') + ': '));
    addrText.appendChild(document.createTextNode(p.address));
    addr.appendChild(addrText);
    meta.appendChild(addr);

    meta.appendChild(listRow('', ICON.clock, t('hours'), lang === 'es' ? p.hours_es : p.hours));

    var notes = (lang === 'es' ? p.notes_es : p.notes).slice();
    if (p.temp && iso(now) <= p.temp.until) notes.push(p.temp[lang]);
    if (notes.length) meta.appendChild(listRow('note', ICON.info, '', notes));

    var contact = lang === 'es' ? p.contact_es : p.contact;
    if (contact && /[A-Za-zÁÉÍÓÚáéíóúñÑ]{3,}/.test(contact)) {
      // keep phone numbers on one line (non-breaking hyphen)
      meta.appendChild(el('p', 'contact', t('contact') + ' ' + contact.replace(/(\d)-(\d)/g, '$1‑$2').replace(/\) (\d)/g, ') $1')));
    }
    if (p.email) {
      var mail = el('p', 'contact');
      mail.appendChild(document.createTextNode(t('email') + ' '));
      var ma = el('a', 'mail', p.email);
      ma.href = 'mailto:' + p.email;
      mail.appendChild(ma);
      meta.appendChild(mail);
    }
    c.appendChild(meta);

    // Every listing gets a Call button and a Directions button.
    var btns = el('div', 'btns');
    if (p.phones.length) {
      p.phones.forEach(function (tel) {
        btns.appendChild(button('tel:' + tel, ICON.phone, t('call')(formatPhone(tel)), true));
      });
    } else if (info.find) {
      btns.appendChild(button('tel:' + info.find.phone, ICON.phone, t('callFind')(info.find.phone_display), true));
    }
    btns.appendChild(button(directionsUrl(p.address), ICON.nav, t('directions'), false, true, t('directionsHint')));
    c.appendChild(btns);
    if (!p.phones.length) c.appendChild(el('p', 'nophone', t('noPhone')));
    return c;
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

  fetch(dataUrl)
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      info.calendarMonth = data.calendar_month || '';
      info.closure = data.closure || null;
      info.find = data.find || null;
      info.notices = data.notices || [];
      if (data.source && data.source.checked_on && els.checked) {
        els.checked.textContent = t('checkedLine').replace('{date}', formatDate(data.source.checked_on));
      }
      places = data.places.slice().sort(function (a, b) {
        return a.city.localeCompare(b.city) || a.name.localeCompare(b.name);
      });
      els.count.removeAttribute('data-i18n');
      buildCityOptions();
      showNotices();
      render();
    })
    .catch(function () {
      els.count.textContent = t('loadError');
    });
})();
