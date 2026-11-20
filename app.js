/* Food Near You / Comida Cerca
   Loads data.json and shows the list. No libraries, no tracking, nothing saved on the phone.
   The English page is /index.html and the Spanish page is /es/index.html. Both use this file.
   The page language comes from <html lang="..."> on each page. */
(function () {
  'use strict';

  var STR = {
    en: {
      skip: 'Skip to the list',
      draftTitle: 'Draft:',
      draftText: 'hours are not checked yet. Please call before you go.',
      siteName: 'Food Near You',
      title: 'Free food places in the Coachella Valley',
      lead: 'Food pantries, mobile markets and hot meals. Search or filter, then call or get directions.',
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
      footer1: 'A student project for the California State Seal of Civic Engagement. Not run by FIND Food Bank.',
      footer2: "Information was copied from FIND Food Bank's public map page on November 19, 2026. Hours can change, so please call before you go.",
      footerSource: 'See the original list',
      footer3: 'This site does not collect any personal information.',
      toTop: 'Back to top',
      docTitle: 'Free Food in the Coachella Valley | Food Near You',
      count: function (n, total) { return n === total ? 'Showing all ' + total + ' places' : 'Showing ' + n + ' of ' + total + ' places'; },
      none: 'No places match your search.',
      notConfirmed: 'Not confirmed yet',
      confirmedOn: function (d) { return 'Confirmed by phone on ' + d; },
      openTodayBadge: 'Open today',
      address: 'Address',
      hours: 'Hours',
      note: 'Note',
      contact: 'Contact:',
      map: 'Open map',
      mapHint: '(opens Google Maps)',
      call: function (num) { return 'Call ' + num; },
      ext: 'ext.',
      noPhone: 'No phone number listed',
      unclear: function (n) { return n === 1 ? '1 place has hours that do not say which days, so "Open today" hides it.' : n + ' places have hours that do not say which days, so "Open today" hides them.'; },
      loadError: 'Sorry, the list could not load. Please refresh the page.'
    },
    es: {
      skip: 'Ir a la lista',
      draftTitle: 'Borrador:',
      draftText: 'los horarios aún no se han verificado. Por favor llame antes de ir.',
      siteName: 'Comida Cerca',
      title: 'Lugares de comida gratis en el Valle de Coachella',
      lead: 'Despensas de comida, mercados móviles y comidas calientes. Busque o filtre, y luego llame o vea cómo llegar.',
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
      footer1: 'Proyecto estudiantil para el Sello Estatal de Compromiso Cívico de California. No lo administra FIND Food Bank.',
      footer2: 'La información se copió de la página pública del mapa de FIND Food Bank el 19 de noviembre de 2026. Los horarios pueden cambiar, así que por favor llame antes de ir.',
      footerSource: 'Ver la lista original',
      footer3: 'Este sitio no recoge ninguna información personal.',
      toTop: 'Volver arriba',
      docTitle: 'Comida gratis en el Valle de Coachella | Comida Cerca',
      count: function (n, total) { return n === total ? 'Mostrando los ' + total + ' lugares' : 'Mostrando ' + n + ' de ' + total + ' lugares'; },
      none: 'Ningún lugar coincide con su búsqueda.',
      notConfirmed: 'Aún no confirmado',
      confirmedOn: function (d) { return 'Confirmado por teléfono el ' + d; },
      openTodayBadge: 'Abierto hoy',
      address: 'Dirección',
      hours: 'Horario',
      note: 'Nota',
      contact: 'Contacto:',
      map: 'Ver mapa',
      mapHint: '(abre Google Maps)',
      call: function (num) { return 'Llamar al ' + num; },
      ext: 'ext.',
      noPhone: 'No hay número de teléfono',
      unclear: function (n) { return n === 1 ? '1 lugar tiene un horario que no dice qué días, así que "Abierto hoy" lo oculta.' : n + ' lugares tienen horarios que no dicen qué días, así que "Abierto hoy" los oculta.'; },
      loadError: 'Lo sentimos, la lista no se pudo cargar. Por favor recargue la página.'
    }
  };

  var ICON = {
    pin: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    clock: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    info: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
    phone: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
    map: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>',
    warn: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 3 2 21h20L12 3z"/><path d="M12 10v5M12 18v.5"/></svg>',
    check: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>',
    sun: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/></svg>'
  };

  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  var $ = function (id) { return document.getElementById(id); };
  var els = {
    q: $('q'), city: $('city'), type: $('type'), today: $('today'), todayName: $('todayName'),
    count: $('count'), clear: $('clear'), unclear: $('unclearNote'), results: $('results')
  };

  var places = [];
  var lang = document.documentElement.lang === 'es' ? 'es' : 'en';
  // data.json sits next to app.js, so find it from this script's own address (works on both pages).
  var dataUrl = new URL('data.json', document.currentScript ? document.currentScript.src : location.href).href;
  var now = testDate() || new Date();

  // For testing only: add ?date=2026-11-21 to the address to pretend it is that day.
  function testDate() {
    var m = /[?&]date=(\d{4})-(\d{2})-(\d{2})/.exec(location.search);
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }

  // On the English page, if the phone is set to Spanish, show a link to the Spanish page. No automatic redirect.
  function showSpanishHint() {
    var hint = document.getElementById('langHint');
    var list = navigator.languages || [navigator.language || 'en'];
    if (hint && lang === 'en' && /^es\b/i.test(list[0] || '')) hint.hidden = false;
  }

  function t(key) { return STR[lang][key]; }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function norm(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  // Is this place giving out food on this date, based on its schedule rules?
  function openOn(p, date) {
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
      if (r.months && r.months.indexOf(month) === -1) return false;
      return true;
    });
  }

  function formatPhone(tel) {
    var m = /^\+1(\d{3})(\d{3})(\d{4})(?:,(\d+))?$/.exec(tel);
    if (!m) return tel;
    return '(' + m[1] + ') ' + m[2] + '-' + m[3] + (m[4] ? ' ' + t('ext') + ' ' + m[4] : '');
  }

  function mapUrl(address) {
    var a = address.slice(Math.max(0, address.search(/\d/)));
    var m = /^(.*?\bCA,?\s+\d{5})/.exec(a);
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(m ? m[1] : a);
  }

  function formatDate(iso) {
    var p = iso.split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return d.toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
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

  function card(p, isOpenToday) {
    var c = el('article', 'card');

    var tags = el('div', 'tags');
    tags.appendChild(el('span', 'type', p.types.map(function (x) { return t('type_' + x); }).join(' · ')));
    if (isOpenToday) {
      var b = el('span', 'badge now');
      b.innerHTML = ICON.sun;
      b.appendChild(document.createTextNode(t('openTodayBadge')));
      tags.appendChild(b);
    }
    c.appendChild(tags);

    c.appendChild(el('h2', null, p.name));

    var flag = el('span', p.confirmed ? 'badge ok' : 'badge warn');
    flag.innerHTML = p.confirmed ? ICON.check : ICON.warn;
    flag.appendChild(document.createTextNode(p.confirmed && p.confirmed_on ? t('confirmedOn')(formatDate(p.confirmed_on)) : t('notConfirmed')));
    c.appendChild(flag);

    var meta = el('div', 'meta');

    var addr = el('div', 'row');
    addr.innerHTML = ICON.pin;
    var addrText = el('div');
    addrText.appendChild(el('span', 'sr-only', t('address') + ': '));
    addrText.appendChild(document.createTextNode(p.address));
    addr.appendChild(addrText);
    meta.appendChild(addr);

    var hrs = el('div', 'row');
    hrs.innerHTML = ICON.clock;
    var hrsBox = el('div');
    hrsBox.appendChild(el('span', 'sr-only', t('hours') + ': '));
    var ul = el('ul');
    (lang === 'es' ? p.hours_es : p.hours).forEach(function (h) { ul.appendChild(el('li', null, h)); });
    hrsBox.appendChild(ul);
    hrs.appendChild(hrsBox);
    meta.appendChild(hrs);

    var notes = lang === 'es' ? p.notes_es : p.notes;
    if (notes.length) {
      var nr = el('div', 'row note');
      nr.innerHTML = ICON.info;
      var nul = el('ul');
      notes.forEach(function (n) { nul.appendChild(el('li', null, n)); });
      nr.appendChild(nul);
      meta.appendChild(nr);
    }

    var contact = lang === 'es' ? p.contact_es : p.contact;
    if (contact && /[A-Za-zÁÉÍÓÚáéíóúñÑ]{3,}/.test(contact)) {
      // keep phone numbers on one line (non-breaking hyphen)
      meta.appendChild(el('p', 'contact', t('contact') + ' ' + contact.replace(/(\d)-(\d)/g, '$1\u2011$2').replace(/\) (\d)/g, ')\u00a0$1')));
    }
    c.appendChild(meta);

    var btns = el('div', 'btns');
    p.phones.forEach(function (tel) {
      var a = el('a', 'btn fill');
      a.href = 'tel:' + tel;
      a.innerHTML = ICON.phone;
      a.appendChild(document.createTextNode(t('call')(formatPhone(tel))));
      btns.appendChild(a);
    });
    var m = el('a', 'btn');
    m.href = mapUrl(p.address);
    m.target = '_blank';
    m.rel = 'noopener';
    m.innerHTML = ICON.map;
    m.appendChild(document.createTextNode(t('map')));
    m.appendChild(el('span', 'sr-only', ' ' + t('mapHint')));
    btns.appendChild(m);
    if (!p.phones.length) btns.appendChild(el('p', 'nophone', t('noPhone')));
    c.appendChild(btns);
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
  showSpanishHint();

  fetch(dataUrl)
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      places = data.places.slice().sort(function (a, b) {
        return a.city.localeCompare(b.city) || a.name.localeCompare(b.name);
      });
      els.count.removeAttribute('data-i18n');
      buildCityOptions();
      render();
    })
    .catch(function () {
      els.count.textContent = t('loadError');
    });
})();
