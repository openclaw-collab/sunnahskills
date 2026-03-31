# Overnight Work Tracker

Created: 2026-03-31

## Active Goals

- [x] Restore the double-leg scene so it exposes the initial staredown lead-in before the standing wrist-control entry.
- [x] Implement the full schedule redesign plan in `2026-03-30-schedule-redesign.md`.
- [x] Ensure the sequence builder is fully graph-complete, uses the shared extractor/renderer pipeline, and supports editing existing techniques.
- [ ] Push all finished work to `main` and deploy production.

## Sequence Work

- [x] Update the double-leg technique path to allow the staredown opener.
- [x] Regenerate the extracted technique payloads and SQL seed.
- [ ] Verify the live API payload matches the intended opener.

## Schedule Redesign

- [x] Add `SessionDetailModal`.
- [x] Refactor weekly view to stacked day columns.
- [x] Refactor monthly view to compact full-detail cards.
- [x] Update mobile day view to open the detail modal.
- [x] Integrate modal state into the Schedule page.
- [x] Update filter pill styling and labels.
- [x] Verify typecheck, build, and schedule behavior.

## Sequence Builder

- [x] Audit the current AdminSequences behavior against the graph-complete builder goal.
- [x] Ensure start positions, before routes, and after routes come from the full graph dataset.
- [x] Ensure saved techniques can be loaded back into the builder for editing.
- [x] Ensure canonical path specs are preserved on save/load.
- [x] Verify preview uses the same renderer/extractor path as the public technique library.

## Release

- [x] Run validation.
- [ ] Push `main`.
- [ ] Deploy Pages.
- [ ] Sync production D1 if technique payloads changed.
