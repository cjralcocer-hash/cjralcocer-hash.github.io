# Community food places: how each one was checked

These places are run by churches and community groups, not FIND Food Bank. They live in `community.json`. FIND's list stays in `data.json`, which the weekly check compares with FIND's map.

Last research: **November 21, 2026**. No phone calls; every fact comes from a page we opened and read.

## The rules (a place is listed only if all six are true)

1. **Official source.** The organization's own website, bulletin or official directory says it. Directories like Plentiful, feedam or foodpantries.org, and Facebook-only posts, are only used to find leads.
2. **Specific.** The source says the food is free and gives a street address in the Coachella Valley, plus the days and times.
3. **Current.** The source is dated within the last 12 months, or a second independent, dated source agrees on the day, time and address.
4. **No unresolved conflict** between sources.
5. **Open to the public,** or the eligibility is clearly stated. Client-only, student-only, member-only and delivery-only programs are left out.
6. **Not already on FIND's list,** checked by name and address.

## Listed (3)

| Place | When | Source and proof it's current |
|---|---|---|
| Desert Christian Community Church, 31280 Sierra del Sol, Thousand Palms | 1st Tuesday, 9–11 AM, drive-thru | The Narrow Door's own page: [English](https://www.thenarrowdoor.org/help), [Spanish](https://www.thenarrowdoor.org/ayuda). The site's sitemap shows the page updated Nov 18, 2026 (code comments show edits on Nov 19, 2026), and it lists a December 2026 campaign. It says the food is free and "all are welcome." |
| El Jardin Apartments, 84711 Avenue 51, Coachella | 1st Saturday, 9–10:30 AM, drive-thru, behind the apartments (enter from the side street) | Same pages and dates. |
| Northgate Community Church, 30010 Date Palm Dr, Cathedral City | 4th Saturday, 8–10 AM, drive-thru | Same pages and dates. |

A script compared each address, day and time in `community.json` with the English and Spanish pages on Nov 21, 2026. All matched. The phone number and email are The Narrow Door's office: (760) 775-6200, info@thenarrowdoor.org.

## Corrections to FIND listings (in `community.json` under `updates`, not in `data.json`)

| FIND listing | What changed | Source |
|---|---|---|
| Well in the Desert (id 34) | The Saturday food giveaway was suspended after the group left its North Indian Canyon Drive building. Weekday meals continue through partner churches. The site shows an alert and drops the Saturday hours and the old address's Directions button. | [NBC Palm Springs, Sept 2, 2026](https://www.nbcpalmsprings.com/local-and-community/2026/09/02/well-in-the-desert-suspends-saturday-food-bank-after-palm-springs-move) |

Warning: Well in the Desert's old website address now sends visitors to a gambling site. Never link to it.

## Looked at but not listed

| Lead | Why not |
|---|---|
| Our Lady of Soledad, Coachella | The diocese directory says the parish pantry is closed and sends people to Catholic Charities. |
| Our Lady of Perpetual Help, Indio | The diocese directory says it's closed and sends people to Galilee Center (already on the list). |
| Our Lady of Guadalupe, Palm Springs | The diocese lists Saturday 6–7 AM with Well in the Desert's phone number. This is very likely the Saturday food bank that was suspended. |
| St. Francis of Assisi, La Quinta | Only an undated diocese entry (Tue–Thu) and a 2020 news story. Nothing current. |
| Sanctuary of Our Lady of Guadalupe, Mecca | Only an undated diocese entry (Sunday 8–10 AM). The parish page has no pantry details. |
| Christ of the Desert, Palm Desert | Sources disagree on the address (Palm Desert vs. Indio) and the time. |
| First Assembly of God, Indio | Only an undated FIND location page (not on FIND's current map) and directories. |
| Palm Desert Church of Christ, Bermuda Dunes | Only an undated college resource list. |
| Sacred Heart, Palm Desert | The "every 2nd Saturday" article we found is about a Sacred Heart parish in Phoenix, Arizona, not Palm Desert. |
| Catholic Charities (Coachella / North Shore) | Their hunger-relief page has been removed (404). |
| Hidden Harvest | No current schedule online. Their old program pages are expired. |
| Jewish Family Service of the Desert, DAP Health | No public pantry days or times found. |
| Senior center lunches (Mizell, Indio, Coachella, etc.) | They cost $5, so they aren't free (CV Independent, Mar 17, 2026). |
| Meals on Wheels | Delivery only. |
| College of the Desert pantries | Students only. |
| Southwest Church, Indian Wells | Now listed as Wellspring Church, which is already on the list. |
| Jesus Lives Christian Church, Thousand Palms | A FIND mobile stop, known only from directories. |
| Sikh and Islamic community meals, church Thanksgiving events | No current dates and times published. |

## Things that may be out of date on FIND's list (we didn't change these)

- **The Narrow Door (id 2):** its own site lists only the three drive-thru distributions above and says "No walk-in service." FIND still lists a 2nd-Saturday distribution at its Indio office.
- **St. Elizabeth's Pantry (id 63):** the diocese says Tuesday *and Friday*, 8:30–10:30 AM. FIND says Tuesdays only.
- **St. Theresa's (id 36):** the diocese says Monday 7:30–10:00 AM. FIND says 7:30–11:30 AM.
- **Cathedral City Senior Center (id 69):** CV Independent (Mar 2026) says Mondays 9–11 AM. FIND says 8:30–11 AM.
- **La Quinta Library (id 8):** a City of La Quinta page (we couldn't load it to see its date) mentions a 1st-Friday seniors-only day and a 4th-Saturday day at 8–9 AM.
