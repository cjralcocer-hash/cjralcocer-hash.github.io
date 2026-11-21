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
