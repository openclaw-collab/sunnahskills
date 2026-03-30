# Studio Export Reconciliation

Date: 2026-03-30
Source export: `/Users/muadhsambul/Downloads/sunnah-prot/sunnahskills-studio-1774816552492.json`
Primary page reviewed: `/Users/muadhsambul/Downloads/sunnah-prot/client/src/pages/Home.tsx`

## Summary

The Studio export contains 47 text edits for the homepage. These edits were not applied automatically.

This is expected based on `/Users/muadhsambul/Downloads/sunnah-prot/docs/security.md`, which states:

- Studio edits are stored in `studio_sessions`
- They are not automatically applied to production code
- The export JSON is a review artifact for the developer to apply manually

In the current homepage implementation:

- 11 export strings appear verbatim
- several others were applied as cleaner manual rewrites
- the rest were either skipped, replaced by structured data, or left behind as draft placeholders

## Applied Verbatim

- `Create Your Account`
- `Active Programs`
- `Girls, Boys, Women, Men`
- `Women's Tuesday and Thursday sessions are separate enrollments. Tuesday and Friday youth sessions occur at the same time but are segregated.`
- `Programs at a glance`
- `BJJ Sessions`
- `918 Dundas St. West, Mississauga`
- `Book your FREE trial now!`

## Applied As Rewrites

These changes are present in spirit, but not copied word-for-word from the Studio export.

### Hero subcopy

Studio export:

`Train the body. Shape the character. Brazilian Jiu-Jitsu, Archery, Swimming, Outdoor skills, Self Defense/Bullyproofing all taught through a structured youth centered, sunnah inspired system.`

Code:

`Train the body. Shape the character. Brazilian Jiu-Jitsu, Archery, Swimming, Outdoor skills, Self Defense/Bullyproofing all taught through a structured youth centered, sunnah inspired system.`

Difference:

- same content
- spacing and punctuation normalized

Reference:
- `/Users/muadhsambul/Downloads/sunnah-prot/client/src/pages/Home.tsx:430`

### Technique preview description

Studio export:

`A sneak peek on how technique is taught at Sunnah Skills. Full library on the techniques page.`

Code:

`Review techniques after class with our animated 3D breakdowns. Full library available anytime.`

Difference:

- intent kept
- wording rewritten into stronger product copy

Reference:
- `/Users/muadhsambul/Downloads/sunnah-prot/client/src/pages/Home.tsx:500`

### Session card copy

Studio export stored several session names, time labels, and section fragments as separate text fields.

Current code replaces those with structured data:

- `enrollmentCardMeta`
- `schedulePreviewGroups`
- `BJJ_MARKETING_GROUPS`

References:
- `/Users/muadhsambul/Downloads/sunnah-prot/client/src/pages/Home.tsx:116`
- `/Users/muadhsambul/Downloads/sunnah-prot/client/src/pages/Home.tsx:142`
- `/Users/muadhsambul/Downloads/sunnah-prot/client/src/pages/Home.tsx:582`

## Not Applied

These Studio strings do not currently appear in the homepage code and do not seem to have been cleanly carried over.

### Curriculum card text

- `Ground-based training that teaches leverage, timing, and composure.`
- `+ Age based sessions`
- `A short-series that helps students respond with calmness, clarity and confidence when social pressure rises.`
- `Safety First / Boundaries / awareness`

Likely reason:

- the cards now pull from `PROGRAMS.*` instead of raw Studio text

Reference:
- `/Users/muadhsambul/Downloads/sunnah-prot/client/src/pages/Home.tsx:23`
- `/Users/muadhsambul/Downloads/sunnah-prot/client/src/pages/Home.tsx:185`

### Exact track titles from the export

- `Girls Ages 5–10`
- `Boys Ages 7–13`
- `Teens & Adults Ages 14+`
- `Women & Girls Ages 11+`

Current code uses:

- eyebrow labels like `Ages 5–10`
- group labels from `BJJ_MARKETING_GROUPS`

Likely reason:

- the implementation switched to structured enrollment cards instead of literal text node replacement

Reference:
- `/Users/muadhsambul/Downloads/sunnah-prot/client/src/pages/Home.tsx:120`
- `/Users/muadhsambul/Downloads/sunnah-prot/client/src/pages/Home.tsx:588`

### Exact schedule strings

- `Tuesday 2:30-3:30 PM, Friday 10:00-11:00 AM`
- `Tuesday 12:30-2:00 PM`
- `Thursday 8:00-9:30 PM`
- `Friday 8:00-9:00 PM, Saturday 8:00-9:00 PM`

Current code uses normalized punctuation and different formatting:

- `2:30–3:30 PM`
- `or` for women's options
- split cards/calendar rows instead of one raw text block

Reference:
- `/Users/muadhsambul/Downloads/sunnah-prot/client/src/pages/Home.tsx:123`
- `/Users/muadhsambul/Downloads/sunnah-prot/client/src/pages/Home.tsx:133`
- `/Users/muadhsambul/Downloads/sunnah-prot/client/src/pages/Home.tsx:138`
- `/Users/muadhsambul/Downloads/sunnah-prot/client/src/pages/Home.tsx:142`

### Semester structure labels

- `13-week semester. 1hr class, twice a week.`
- `13-week semester. 1.5hrs each class.`
- `Semester Fees`

Current code instead uses:

- dynamic semester tuition calculation
- `Semester tuition`
- section-level copy rather than repeated literal labels

Reference:
- `/Users/muadhsambul/Downloads/sunnah-prot/client/src/pages/Home.tsx:357`
- `/Users/muadhsambul/Downloads/sunnah-prot/client/src/pages/Home.tsx:617`

### Draft placeholders that should not be applied

- `put Register now button here`
- `Put Register now button here`

These were clearly Studio drafting placeholders and should remain discarded.

## Recommendation

Treat this export as a checklist, not as a patch file.

For the homepage, the next cleanup pass should classify each Studio change into one of three buckets:

1. Keep exactly
2. Keep but rewrite
3. Discard

The safest implementation direction is:

- keep the current structured card/calendar system
- selectively restore missing approved copy from the export
- do not reintroduce draft placeholders or raw fragmented labels just to match the JSON

## High-confidence next fixes

If we want the page to better reflect the Studio export without regressing the current implementation, the best candidates are:

- review the curriculum card descriptions pulled from `PROGRAMS`
- decide whether `Women & Girls Ages 11+` is actually intended, since the current code uses `Ages 11+`
- decide whether the technique preview sentence should use the Studio phrasing or the newer rewrite
- decide whether the BJJ session cards need more explicit semester structure language
