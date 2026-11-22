# Food Near You / Comida Cerca

Static site (GitHub Pages, no build step). The list of places lives in `data.json`. Spanish is the home page (`index.html`), English is `en/index.html`.

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
