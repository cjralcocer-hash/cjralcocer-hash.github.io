#!/usr/bin/env node
// Weekly check of data.json against FIND Food Bank's public map page.
// Node 18+, no dependencies.
//
// What it does
//   * Downloads https://findfoodbank.org/map/ (the URL in data.json "source").
//   * For every place in data.json, finds the same name on that page and compares
//     the address, the phone number(s) and the schedule (days, which weeks of the
//     month, and times).
//   * Everything matches for every place -> the only edit is "source.checked_on"
//     (the "Last checked" date on the site). Nothing else in data.json is touched.
//   * Anything differs, is missing, or the page cannot be read -> data.json is NOT
//     changed. A GitHub issue lists what needs a human check.
//   * scripts/known-differences.json lists differences a person has already looked at.
//     An entry is quiet only while FIND's text is exactly what the file records; if FIND
//     changes it, the difference is reported again. FIND listings outside the Coachella
//     Valley are listed there too, so they do not trigger an issue every week.
//   * It never writes hours, addresses or phones into data.json. A person does that.
//
// Usage
//   node scripts/update-data.mjs            run the check, write checked_on if all clear
//   node scripts/update-data.mjs --dry-run  only print the report, change nothing
// In GitHub Actions, GITHUB_TOKEN and GITHUB_REPOSITORY are set and the issue is
// opened for real. Run locally, the issue text is printed instead.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(HERE, '..', 'data.json');
const KNOWN_PATH = join(HERE, 'known-differences.json');
const DRY = process.argv.includes('--dry-run');
const ISSUE_LABEL = 'data-check';
const MIN_RESULTS = 10; // a real page has dozens; fewer means the layout changed or the page is broken
const UA = 'food-near-you-data-check (GitHub Action; checks public listings once a week)';

// ---------- small helpers ----------

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&(?:rsquo|lsquo);/g, '’')
    .replace(/&(?:ndash|mdash);/g, '-');

const textOf = (html) => decode(html.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

const normName = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
const normAddr = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

function phonesOf(s) {
  const out = new Set();
  for (const m of s.matchAll(/\(?(\d{3})\)?[\s.-]*(\d{3})[\s.-]*(\d{4})/g)) out.add(m[1] + m[2] + m[3]);
  return [...out].sort();
}

const DAYS = /\b(monday|mon|tuesday|tues|tue|wednesday|wed|thursday|thurs|thur|thu|friday|fri|saturday|sat|sunday|sun)s?\b/gi;
const WORD_NUM = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5 };

// Reduces an hours description to {days, weeks, times} so "2nd Saturday 9:00am-11:00am"
// and "The 2nd Saturday of each month, 9:00 AM to 11:00 AM." compare equal.
function scheduleOf(s) {
  const times = new Set();
  for (const m of s.matchAll(/(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s*m\b/gi)) {
    times.add(`${Number(m[1])}:${m[2] || '00'}${m[3].toLowerCase()}`);
  }
  const weeks = new Set();
  for (const m of s.matchAll(/\b([1-5])\s*(?:st|nd|rd|th)\b/gi)) weeks.add(Number(m[1]));
  for (const m of s.matchAll(/\b(first|second|third|fourth|fifth)\b/gi)) weeks.add(WORD_NUM[m[1].toLowerCase()]);
  const days = new Set();
  for (const m of s.matchAll(DAYS)) days.add(m[1].toLowerCase().slice(0, 3));
  const sorted = (set) => [...set].sort();
  return { days: sorted(days), weeks: sorted(weeks), times: sorted(times) };
}
const sameSchedule = (a, b) => JSON.stringify(a) === JSON.stringify(b);

async function getPage(url) {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': UA, accept: 'text/html' },
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      lastErr = err;
      if (attempt < 3) await new Promise((r) => setTimeout(r, 3000 * attempt));
    }
  }
  throw lastErr;
}

// ---------- parse FIND's map page ----------
// Each listing is <div class="fwpl-result rN"> with the name in the first
// "fwpl-item" and then paragraphs "Hours of Operation:", "Location:", "Contact:".

function parseFind(html) {
  const results = [];
  for (const chunk of html.split('<div class="fwpl-result').slice(1)) {
    const nameMatch = chunk.match(/<div class="fwpl-item[^"]*">([\s\S]*?)<\/div>/);
    if (!nameMatch) continue;
    const name = textOf(nameMatch[1]);
    const paras = [...chunk.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => textOf(m[1]));
    const pick = (label) => {
      const re = new RegExp('^' + label + '\\s*:?\\s*', 'i');
      const p = paras.find((x) => re.test(x));
      return p ? p.replace(re, '').trim() : '';
    };
    results.push({
      name,
      hours: pick('Hours of Operation'),
      location: pick('Location'),
      contact: pick('Contact'),
    });
  }
  return results;
}

// ---------- compare ----------

// Does FIND's current text match what a person already looked at? Compared without case or punctuation.
const squash = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const pinnedMatches = (pin, c) =>
  squash(pin.hours) === squash(c.hours) && squash(pin.location) === squash(c.location) && squash(pin.contact) === squash(c.contact);

function compare(place, candidates) {
  const mySched = scheduleOf((place.hours || []).join(' '));
  const myAddr = normAddr(place.address || '');
  const myPhones = phonesOf(place.contact || '');

  let best = null;
  for (const c of candidates) {
    const problems = [];
    if (normAddr(c.location) !== myAddr) problems.push(`address: ours "${place.address}", FIND "${c.location}"`);
    const theirPhones = phonesOf(c.contact);
    if (theirPhones.join() !== myPhones.join()) problems.push(`phone: ours "${place.contact}", FIND "${c.contact}"`);
    if (!sameSchedule(scheduleOf(c.hours), mySched)) problems.push(`hours: ours "${(place.hours || []).join(' ')}", FIND "${c.hours}"`);
    if (problems.length === 0) return { ok: true };
    if (!best || problems.length < best.problems.length) best = { problems, candidate: c };
  }
  return { ok: false, problems: best.problems, candidate: best.candidate };
}

// ---------- GitHub issue ----------

async function gh(path, method = 'GET', body) {
  const res = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'user-agent': UA,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`GitHub API ${method} ${path} -> ${res.status} ${await res.text()}`);
  return res.json();
}

async function openIssue(title, body) {
  if (DRY || !process.env.GITHUB_TOKEN || !process.env.GITHUB_REPOSITORY) {
    console.log(`\n--- Issue that would be opened ---\n${title}\n\n${body}\n`);
    return;
  }
  // One open issue at a time: update it instead of piling up a new one every week.
  const open = await gh(`/issues?state=open&labels=${ISSUE_LABEL}&per_page=1`);
  if (open.length > 0) {
    await gh(`/issues/${open[0].number}`, 'PATCH', { title, body });
    console.log(`Updated issue #${open[0].number}`);
  } else {
    const made = await gh('/issues', 'POST', { title, body, labels: [ISSUE_LABEL] });
    console.log(`Opened issue #${made.number}`);
  }
}

// ---------- known differences ----------

function loadKnown() {
  try {
    const k = JSON.parse(readFileSync(KNOWN_PATH, 'utf8'));
    return { differences: Array.isArray(k.differences) ? k.differences : [], not_listed: Array.isArray(k.not_listed) ? k.not_listed : [] };
  } catch (err) {
    console.log(`Could not read scripts/known-differences.json (${err.message}); treating every difference as new.`);
    return { differences: [], not_listed: [] };
  }
}

// ---------- main ----------

async function main() {
  const raw = readFileSync(DATA_PATH, 'utf8');
  const data = JSON.parse(raw);
  const today = new Date().toISOString().slice(0, 10);
  const mapUrl = data.source && data.source.url;
  if (!mapUrl || !Array.isArray(data.places)) throw new Error('data.json is missing source.url or places');

  // 1. Get FIND's pages. If we cannot read them, change nothing and ask a human.
  let found;
  const unreachable = [];
  try {
    found = parseFind(await getPage(mapUrl));
    if (found.length < MIN_RESULTS) {
      unreachable.push(`${mapUrl} loaded but only ${found.length} listings could be read (the page layout may have changed).`);
    }
  } catch (err) {
    unreachable.push(`${mapUrl} could not be read: ${err.message}`);
  }
  const calUrl = data.source.calendar_url;
  if (calUrl && calUrl !== mapUrl) {
    try {
      await getPage(calUrl);
    } catch (err) {
      unreachable.push(`${calUrl} (Mobile Market calendar) could not be read: ${err.message}`);
    }
  }

  if (unreachable.length > 0) {
    const body = [
      'The weekly check could not compare the listings with FIND Food Bank, so **data.json was not changed**.',
      '',
      ...unreachable.map((u) => `- ${u}`),
      '',
      'Open the page in a browser. If it works, re-run the "Update listing data" workflow. If the page changed, `scripts/update-data.mjs` may need a fix.',
    ].join('\n');
    console.log(body);
    await openIssue(`FIND pages could not be checked (${today})`, body);
    return;
  }

  // 2. Compare every place.
  const byName = new Map();
  for (const f of found) {
    const k = normName(f.name);
    if (!byName.has(k)) byName.set(k, []);
    byName.get(k).push(f);
  }
  const knownFile = loadKnown();
  const knownById = new Map(knownFile.differences.map((k) => [String(k.id), k]));
  const review = []; // { name, lines[] }
  let okCount = 0;
  let knownCount = 0;
  const noLongerNeeded = []; // entries in known-differences.json whose difference is gone
  for (const place of data.places) {
    const k = knownById.get(String(place.id));
    const candidates = byName.get(normName(place.name));
    if (!candidates) {
      // Not found under our name. A known entry may point at the name FIND uses now.
      const alt = k && k.find && byName.get(normName(k.find.name));
      if (alt && alt.some((c) => pinnedMatches(k.find, c))) {
        knownCount++;
        continue;
      }
      review.push({ name: place.name, lines: ['not found on the FIND page under this name (renamed, removed, or listed elsewhere, e.g. a different website)'] });
      continue;
    }
    const r = compare(place, candidates);
    if (r.ok) {
      okCount++;
      if (k) noLongerNeeded.push(`${place.name} (id ${place.id})`);
    } else if (k && k.find && pinnedMatches(k.find, r.candidate)) {
      knownCount++;
    } else {
      const lines = r.problems.slice();
      if (k) lines.push("this was a known difference, but FIND's text has changed since it was reviewed");
      review.push({ name: place.name, lines });
    }
  }
  const known = new Set(data.places.map((p) => normName(p.name)));
  // FIND listings that a person already decided not to list (outside the Coachella Valley).
  // A known difference may also point at the name FIND uses today, so that name is not "new" either.
  const notListed = new Set([...knownFile.not_listed.map((n) => normName(n.name)),
    ...knownFile.differences.filter((k) => k.find && k.find.name).map((k) => normName(k.find.name))]);
  const newOnFind = [...new Set(found.filter((f) => !known.has(normName(f.name)) && !notListed.has(normName(f.name))).map((f) => f.name))];
  for (const k of knownFile.differences) {
    if (!data.places.some((p) => String(p.id) === String(k.id))) noLongerNeeded.push(`id ${k.id} (no such place in data.json)`);
  }

  console.log(`FIND listings read: ${found.length}. Places in data.json: ${data.places.length}. Match: ${okCount}. Known differences: ${knownCount}. Need a human: ${review.length}.`);
  if (noLongerNeeded.length > 0) {
    console.log(`Entries in scripts/known-differences.json that can be removed: ${noLongerNeeded.join('; ')}`);
  }

  // 3. Safe change: only the "Last checked" date, and only if nothing needs a human.
  if (review.length === 0) {
    const re = /("checked_on"\s*:\s*")\d{4}-\d{2}-\d{2}(")/g;
    const count = (raw.match(re) || []).length;
    if (count !== 1) {
      console.log(`Skipped the date update: expected one "checked_on" in data.json, found ${count}.`);
    } else if (DRY) {
      console.log(`Dry run: would set source.checked_on to ${today}.`);
    } else {
      const next = raw.replace(re, `$1${today}$2`);
      if (next !== raw) {
        writeFileSync(DATA_PATH, next);
        console.log(`source.checked_on set to ${today}.`);
      } else {
        console.log('source.checked_on is already today.');
      }
    }
  } else {
    console.log('Something needs a human check, so checked_on was left as it is and data.json was not changed.');
  }

  // 4. Ask a human about anything unclear.
  if (review.length > 0 || newOnFind.length > 0 || noLongerNeeded.length > 0) {
    const parts = [
      'The weekly check compared `data.json` with FIND Food Bank\'s public map page. **Nothing below was changed automatically.** Please check each item on the FIND page (and by phone if needed), then edit `data.json` by hand.',
      '',
    ];
    if (review.length > 0) {
      parts.push('### Listings that differ or were not found', '');
      for (const r of review) parts.push(`- **${r.name}**`, ...r.lines.map((l) => `  - ${l}`));
      parts.push('');
    }
    if (newOnFind.length > 0) {
      parts.push('### On the FIND page but not in data.json', '', ...newOnFind.map((n) => `- ${n}`), '');
    }
    if (noLongerNeeded.length > 0) {
      parts.push('### Known differences that are gone (remove them from scripts/known-differences.json)', '', ...noLongerNeeded.map((n) => `- ${n}`), '');
    }
    parts.push(
      'Notes: the site\'s "Last checked" date only moves forward when every listing matches. Some differences are expected, for example where FIND\'s monthly calendar overrides the map page (data.json says the calendar wins).',
    );
    await openIssue(`Food listings need a human check (${today})`, parts.join('\n'));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
