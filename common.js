/* comidacoachellavalley: shared code for every page.
   Reads the strings the build put in the page (<script id="i18n">), and offers small helpers
   (text, dates, DOM, loading JSON) that each page's own script uses through window.CV.
   No libraries, no tracking, nothing saved on the phone. */
(function () {
  'use strict';

  // Next to this file sit data.json, community.json, partners.json and people.json.
  var base = document.currentScript ? document.currentScript.src : location.href;
  var lang = document.documentElement.lang === 'es' ? 'es' : 'en';
  var other = lang === 'es' ? 'en' : 'es';

  var STR = {};
  try { STR = JSON.parse(document.getElementById('i18n').textContent); } catch (e) { STR = { en: {}, es: {} }; }

  // t(name) gives the text; t(name, { n: 3 }) also fills {n} in it. A missing key falls back to the other language.
  function t(key, vars) {
    var v = STR[lang] && STR[lang][key];
    if (v == null) {
      v = STR[other] && STR[other][key];
      if (window.console) console.warn('Missing string "' + key + '" for ' + lang);
    }
    if (v == null) return key;
    if (vars && typeof v === 'string') {
      v = v.replace(/\{(\w+)\}/g, function (m, k) { return k in vars ? vars[k] : m; });
    }
    return v;
  }

  // For testing only: add ?date=2026-11-21 to the address to pretend it is that day.
  function testDate() {
    var m = /[?&]date=(\d{4})-(\d{2})-(\d{2})/.exec(location.search);
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }

  function iso(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }

  function parseIso(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }

  // Built by hand: older phones format dates differently. "20 nov 2026" / "Nov 20, 2026".
  function shortDate(isoDate) {
    var d = parseIso(isoDate);
    return t('shortDate', { d: d.getDate(), m: t('months')[d.getMonth()], y: d.getFullYear() });
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function norm(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function str(x) { return typeof x === 'string' && x ? x : null; }
  function strs(a) { return Array.isArray(a) ? a.filter(str) : []; }
  // A text that comes in both languages: { "en": "...", "es": "..." }. Falls back to whichever exists.
  function text(x) {
    if (typeof x === 'string') return str(x);
    return x && typeof x === 'object' ? str(x[lang]) || str(x.en) || str(x.es) : null;
  }
  function httpUrl(s) { return typeof s === 'string' && /^https?:\/\/\S+$/.test(s) ? s : null; }

  function getJson(file) {
    return fetch(new URL(file, base).href).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }

  // Optional list files (community.json, partners.json, people.json): if the file is missing or broken,
  // the page works as before. Each entry goes through a cleaner; anything malformed is skipped.
  function loadEntries(file, key, clean) {
    return getJson(file).then(function (data) {
      return (data && Array.isArray(data[key]) ? data[key] : []).map(clean).filter(Boolean);
    }).catch(function () { return []; });
  }

  // partners.json: { "partners": [ { "id": "p1", "name": "...", "kind": "school|church|clinic|city|business|other",
  //   "url": "https://...", "note": { "en": "...", "es": "..." } } ] }
  function cleanPartner(p) {
    var name = p && str(p.name);
    if (!name) return null;
    return { id: String(p.id), name: name, kind: str(p.kind) || 'other', url: httpUrl(p.url), note: text(p.note) };
  }

  // people.json: { "people": [ { "id": "n1", "name": "...", "role": { "en": "...", "es": "..." },
  //   "bio": { "en": "...", "es": "..." }, "photo": "images/people/name.webp" } ]  (only with the person's OK)
  function cleanPerson(p) {
    var name = p && str(p.name);
    if (!name) return null;
    var photo = str(p.photo);
    return {
      id: String(p.id), name: name, role: text(p.role), bio: text(p.bio),
      photo: photo && /^images\/[\w\/.-]+$/.test(photo) && photo.indexOf('..') === -1 ? photo : null
    };
  }

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

  window.CV = {
    lang: lang, STR: STR, t: t, now: testDate() || new Date(),
    iso: iso, parseIso: parseIso, shortDate: shortDate, el: el, norm: norm,
    str: str, strs: strs, text: text, httpUrl: httpUrl,
    getJson: getJson, loadEntries: loadEntries, cleanPartner: cleanPartner, cleanPerson: cleanPerson,
    ICON: ICON
  };
})();
