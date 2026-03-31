# Schedule Grid Bug Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix schedule grid rendering bugs: weekly view empty, monthly view wrong positioning

**Architecture:** Fix percentage calculation logic for time-to-position mapping, ensure grid height calculation matches content, fix weekly view session filtering

**Tech Stack:** React, TypeScript, Tailwind CSS

---

## Bug Analysis

**Issues identified:**
1. **Weekly view empty**: Sessions may not be matching day index correctly
2. **Monthly view wrong timing**: 8pm classes render at top - percentage calculation likely producing negative values or wrong base
3. **Grid positioning**: `minutesToTopPct` uses `GRID_START_MIN=480` (8am) but CSS positioning may be inverted or container height mismatch

**Root causes to investigate:**
- `minutesToTopPct` returns percentage based on 14-hour range (8am-10pm)
- Grid lines render at `i * 30px` positions (absolute positioning)
- Session blocks use percentage-based `top` - mismatch between px grid lines and % session positions
- Weekly view may have CSS height collapse or session filtering issue

---

## Task 1: Fix Time-to-Percentage Calculation Helper

**Files:**
- Modify: `client/src/lib/scheduleCalendarData.ts`

- [ ] **Step 1: Add debug test to verify current calculation**

```typescript
// Add temporarily to verify
const testPosition = minutesToTopPct(M(20, 0)); // 8pm = 1200 min
console.log('8pm position:', testPosition); // Should be ~85.7%
```

- [ ] **Step 2: Verify GRID constants match actual data range**

Check that all sessions fall within GRID_START_MIN (480) to GRID_END_MIN (1320):
- Girls Fri: 10:00 (600) ✓
- Girls Tue: 14:30 (870) ✓
- Boys Fri: 10:00 (600) ✓
- Boys Tue: 14:30 (870) ✓
- Women Tue: 12:30 (750) ✓
- Women Thu: 20:00 (1200) ✓
- Men Fri: 20:00 (1200) ✓
- Men Sat: 20:00 (1200) ✓

All sessions are within range. Calculation should work.

- [ ] **Step 3: Verify calculation formula**

Current: `((start - GRID_START_MIN) / GRID_RANGE) * 100`
For 8pm: `((1200 - 480) / 840) * 100 = 85.71%`

This is correct. The bug is elsewhere (CSS container height not matching GRID_RANGE).

---

## Task 2: Fix Weekly View CSS Height Mismatch

**Files:**
- Modify: `client/src/pages/Schedule.tsx:187-369`

- [ ] **Step 1: Change grid from absolute px to percentage-based heights**

Current grid uses:
- Time slots at `i * 30px` absolute positions
- Sessions at percentage-based positions
- Container `min-h-[840px]` (28 slots × 30px)

**Fix:** Make everything percentage-based so 840 minutes maps to 100% height.

```tsx
// Replace TIME_SLOTS pixel positioning with percentage-based
// Each 30-min slot = (30/840) * 100 = 3.571%
const SLOT_HEIGHT_PCT = (30 / GRID_RANGE) * 100; // ~3.57%

// In grid body, replace absolute pixel heights:
<div className="relative grid grid-cols-7" style={{ height: '100%' }}>
```

- [ ] **Step 2: Fix time labels positioning**

```tsx
// Current (broken - absolute pixels):
style={{ position: "absolute", top: `${(hourIndex * 60)}px` }}

// Fixed (percentage based):
style={{ position: "absolute", top: `${(hourIndex * 60 / GRID_RANGE) * 100}%` }}
```

- [ ] **Step 3: Fix grid lines positioning**

```tsx
// Current:
style={{ top: `${i * 30}px` }}

// Fixed:
style={{ top: `${(i * 30 / GRID_RANGE) * 100}%` }}
```

- [ ] **Step 4: Fix hour markers in columns**

```tsx
// Current:
<div key={hourIdx} className="h-[60px] border-b border-charcoal/5" />

// Fixed - make percentage based:
<div
  key={hourIdx}
  className="border-b border-charcoal/5"
  style={{ height: `${(60 / GRID_RANGE) * 100}%` }}
/>
```

- [ ] **Step 5: Fix current time indicator positioning**

```tsx
// Current:
const topPosition = ((currentMinutes - GRID_START_MIN) / 30) * 30;
// Returns pixels, not percentage!

// Fixed:
const topPosition = minutesToTopPct(currentMinutes);
// Use: style={{ top: `${topPosition}%` }}
```

---

## Task 3: Fix Weekly View Session Rendering

**Files:**
- Modify: `client/src/pages/Schedule.tsx:304-365`

- [ ] **Step 1: Debug why sessions not appearing**

Add temporary debug output:
```tsx
// In WeeklyCalendarGrid, after sessionsByDay calculation:
console.log('Sessions by day:', Array.from(sessionsByDay.entries()));
console.log('Filtered sessions prop:', sessions);
```

- [ ] **Step 2: Check day index matching**

The issue may be `dayIndex` from session vs calculated `dayIdx` from week anchor.

Current code:
```tsx
const dayIndex = date.getDay(); // 0-6 based on weekAnchor
const daySessions = sessionsByDay.get(dayIndex) ?? [];
```

But `sessionsByDay` is built from `s.dayIndex` which is also 0-6 (Sun-Sat).

This should match. If not, verify `weekAnchor` is being passed correctly.

- [ ] **Step 3: Ensure container has proper height**

The session blocks may be rendering but container collapsed. Add explicit height:

```tsx
// Ensure grid body has defined height
<div className="relative grid grid-cols-7" style={{ height: `${(GRID_RANGE / 30) * 30}px` }}>
// Or simpler: min-h-[840px]
```

---

## Task 4: Fix Monthly View Timing Display

**Files:**
- Modify: `client/src/pages/Schedule.tsx:409-491`

- [ ] **Step 1: Check if monthly view timing issue is same root cause**

Monthly view shows sessions as list items, not positioned grid. The "8pm at top" issue likely refers to sort order, not visual position.

Check current sort:
```tsx
.sort((a, b) => a.startMinutes - b.startMinutes)
```

This should show earliest first. 8pm (1200) should be after 12:30pm (750), etc.

- [ ] **Step 2: Verify monthly view displays all sessions**

Current code limits to 4 sessions with "+X more" - this may be hiding sessions. If user expects to see all, either:
1. Remove the limit
2. Make cells expandable
3. Keep limit but ensure visible sessions are the most relevant

For now, increase limit or remove it:
```tsx
// Current: daySessions.slice(0, 4)
// Fixed: show all
{daySessions.map((session) => ...)}
```

---

## Task 5: Add Visual Polish & Verification

**Files:**
- Modify: `client/src/pages/Schedule.tsx`

- [ ] **Step 1: Add visual debug indicators (temporary)**

Add visible grid lines and time markers to verify positioning:
```tsx
{/* Time slot labels every 2 hours for verification */}
<div className="absolute left-0 w-full border-t border-red-500/30 text-[8px] text-red-500">
  {formatHourLabel(time)}
</div>
```

- [ ] **Step 2: Verify concurrent session layout works**

Test with overlapping sessions (multiple at same time) - column layout should split horizontally.

- [ ] **Step 3: Remove debug code**

Clean up console.logs and visual debug indicators before commit.

---

## Task 6: Manual Testing Checklist

- [ ] Weekly view: All 8 BJJ sessions visible
- [ ] Weekly view: Sessions at correct vertical positions (10am near top, 8pm near bottom)
- [ ] Weekly view: Girls/Boys concurrent sessions (Fri 10am) show side-by-side
- [ ] Monthly view: All days show correct sessions
- [ ] Monthly view: Sessions sorted by time (earliest first)
- [ ] Mobile view: Day selector works, shows correct sessions
- [ ] Filters: Kids/Women/Men/All filters work correctly
- [ ] Today indicator: Shows current time line (if viewing current week)

---

## Verification Commands

```bash
# Run dev server
npm run dev

# Navigate to /schedule
# Verify visually all requirements above

# Run any existing tests
npm test -- Schedule
```

---

## Summary

**Key fixes needed:**
1. Change grid positioning from absolute pixels to percentage-based to match session positioning
2. Ensure container has explicit height so percentage positioning works
3. Verify weekly view session filtering matches day indices correctly
4. Monthly view: either remove 4-session limit or ensure it's clear why some are hidden
