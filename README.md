# comidacoachellavalley

Static site on GitHub Pages. Visitors get plain files; no build runs on the server. The list of places lives in `data.json`. Spanish is the home page (`index.html`), English is `en/index.html`.

## How the pages are made

`index.html`, `en/index.html` and `sitemap.xml` are **generated**. Do not edit them by hand. Edit the sources, then run the build and commit the result:

```
python3 scripts/build.py          # writes the generated files (Python 3.9+, nothing to install)
python3 scripts/check.py          # the same checks CI runs
```

The home page also contains the list of places written out as plain HTML, plus schema.org JSON-LD, so it works without JavaScript and search engines can read it (`scripts/places.py`; `list.js` still draws the live list with "Open today"). It is built from `data.json` and `community.json`, so **after editing either file, run the build** or CI will fail. Each card has a "Report a problem" link that opens a prefilled GitHub issue; the repository comes from `repo` in `src/pages.json`.

| What you want to change | Where |
| --- | --- |
| Any visible text (both languages) | `i18n/es.json` and `i18n/en.json`: one key per string, same keys in both |
| Header, language bar, footer, `<head>` tags | `src/layout.html` |
| What a page contains | `src/pages/<id>.html`, in sections `<!--@header-->`, `<!--@main-->`, `<!--@band-->` |
| The list of pages, their scripts and menu entry | `src/pages.json` |

In `src/` files, `{{t:key}}` inserts a string, `{{p:docTitle}}` a page string (`<page id>.docTitle`, also `description`, `ogTitle`, `ogDescription`, `ogImageAlt`), and `{{v:root}}` the path back to the site root.

**Adding a page:** add its entry to `src/pages.json` (give it `"nav": "nav.<id>"` to put it in the menu, which appears once two pages have one), create `src/pages/<id>.html`, add its strings to both language files, and run the build. The page gets the shared header, footer, language switch, hreflang tags and a sitemap entry automatically.

`check.py` runs in GitHub Actions (`.github/workflows/check.yml`) on every push and pull request. It fails if the two languages have different strings, a page uses a missing string, a local link or image is broken, or the generated files do not match their sources.

Scripts: `common.js` (strings, dates and helpers every page can use, as `window.CV`) and `list.js` (search, filters and cards; it does nothing on pages without the list).

### Partners and people (not shown on any page yet)

`partners.json` and `people.json` are empty lists the next pages can fill. Like `community.json`, bad entries are skipped rather than breaking the page, and `check.py` validates them. Text that needs both languages is written as `{ "en": "...", "es": "..." }`.

- partner: `id`, `name`, `kind` (`school`, `church`, `clinic`, `city`, `business` or `other`), `url` (optional), `note` (optional)
- person: `id`, `name`, `role` (optional), `bio` (optional), `photo` (optional, a file under `images/`). Add someone only with their permission.


## Printable flyer

`/flyer/` (Spanish) and `/en/flyer/` (English) show a one-page US Letter flyer with a QR code, the FIND Food Bank phone number and tear-off strips. A partner opens the page and presses Print. The sheet is bilingual on paper, so both URLs print the same sheet. The page is not in the site menu; it is linked from the footer.

- The page is `src/pages/flyer.html`. Its text is in `i18n/` under the `flyer*` keys (the page around the sheet) and the `sheet*` keys (the sheet itself). The sheet also reuses `footer1`, and the phone number and hours come from `find` in `data.json`.
- In `src/` files, `{{es:key}}` and `{{en:key}}` give a string in that language whatever language the page is in.
- The QR code is `images/qr-site.svg`. It is generated from `site` in `src/pages.json` by `scripts/qr.py` (a small encoder, no packages), so changing the domain and running `python3 scripts/build.py` regenerates it. `python3 scripts/check.py` fails if it is out of date.
- To prove the QR code still scans, run `python3 scripts/verify_qr.py`. It decodes test codes with Apple's QR detector through Swift, so it only runs on a Mac.
- The printing rules are the last block of `styles.css` and only affect the flyer page; printing the home page is unchanged.

## Weekly data check

A GitHub Action (`.github/workflows/update-data.yml`) runs `scripts/update-data.mjs` every Monday and on demand. The script needs Node 18 or newer and has no dependencies.

What it does:

1. Downloads FIND Food Bank's public map page (the URL in `data.json` under `source`).
2. For each place in `data.json`, finds the same name on that page and compares the address, phone number and schedule (days, weeks of the month, times).
3. If **everything matches**, it changes one thing: `source.checked_on`, the "Last checked" date shown on the site. The workflow commits that.
4. If **anything differs**, a place is missing, or FIND's page can't be read, it changes **nothing** in `data.json`. It opens (or updates) one GitHub issue labeled `data-check` that lists what needs a human check. A person then edits `data.json` by hand.

It never writes hours, addresses or phones itself. Some differences are expected (for example where FIND's monthly calendar overrides the map page, or Joslyn Community Food Bank, which is checked on its own site). Those keep showing up in the issue, and the "Last checked" date stays put until every listing matches.

### Run it manually

- On GitHub: Actions tab, "Update listing data", "Run workflow".
- On your computer (Node 18+): `node scripts/update-data.mjs --dry-run` prints the report and changes nothing. Without `--dry-run` it also updates `checked_on` if everything matches; the issue text is printed instead of opened.

### One-time setup

In the repository: Settings, Actions, General, Workflow permissions, choose "Read and write permissions". If `main` has branch protection that blocks pushes from Actions, the date commit will fail; allow it or remove that rule.

## Community places (`community.json`)

Places run by churches and community groups (not FIND Food Bank) live in `community.json`, with the evidence for each one in `community-sources.md`. The weekly check above does **not** read this file, so a person re-checks it.

`community.json` also has an `updates` list. Each entry corrects one FIND listing (by its `id` in `data.json`) without editing `data.json`, for example a suspended distribution. The page shows the alert and uses the replacement hours and schedule.

### Monthly re-check (about 15 minutes)

1. Open each `source.url` in `community.json` and compare the address, days and times with what the file says.
2. If they still match, set that place's `source.checked_on` (and the top-level `checked_on`) to today's date.
3. If something changed, update the English and Spanish lines and the `schedule` to match the source, and note it in `community-sources.md`.
4. If the organization no longer lists the distribution, delete the place from `community.json` and add it to "Looked at but not listed" in `community-sources.md` with the reason.
5. For each entry in `updates`, check whether its source is still true (for example, whether the suspended distribution has started again). Remove the entry when it no longer applies.

The site warns "not re-checked recently, call first" on any community place whose `source.checked_on` is more than 90 days old.

### Adding a new place

Add it only if it passes all six rules at the top of `community-sources.md`: an official source, free food with a street address, days and times, current (dated within 12 months or confirmed by a second dated source), no conflicts, open to the public (or eligibility clearly stated), and not already in `data.json`. Use the next free id (`c4`, `c5`, and so on) and write the hours in the same plain-words style in both languages.
