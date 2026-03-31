# Full Website Text Humanization Audit Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit all visible user-facing text across the Sunnah Skills website and identify sections that sound AI-generated or need humanizing using the `sunnah-skill:humanizer` skill.

**Architecture:** Parallel subagent execution where each subagent specializes in a section (Registration, Public Pages, Admin, etc.). Each subagent reads the relevant files, extracts visible text, applies humanizer skill analysis, and outputs a structured report. A final consolidation subagent combines all findings.

**Tech Stack:** React/TypeScript frontend, Hono/Cloudflare Workers backend, sunnah-skill:humanizer for text auditing.

---

## File Structure

**Subagent Definitions:** `docs/superpowers/agents/text-audit-*.md` (8 specialized subagents)
**Raw Output Directory:** `.omc/audit-outputs/`
**Consolidated Report:** `docs/audit-results/website-text-humanization-report.md`

---

## Pre-Task: Check sunnah-skill:humanizer Availability

- [ ] **Verify humanizer skill is loaded**

Run: `claude skills list | grep -i humanizer`
Expected: Shows `sunnah-skill:humanizer` is available

If not available, load it before proceeding.

---

## Task 1: Create Audit Subagents

**Files:**
- Create: `docs/superpowers/agents/text-audit-registration.md`
- Create: `docs/superpowers/agents/text-audit-public-pages.md`
- Create: `docs/superpowers/agents/text-audit-admin.md`
- Create: `docs/superpowers/agents/text-audit-technique-library.md`
- Create: `docs/superpowers/agents/text-audit-navigation-ui.md`
- Create: `docs/superpowers/agents/text-audit-forms-inputs.md`
- Create: `docs/superpowers/agents/text-audit-error-success.md`
- Create: `docs/superpowers/agents/text-audit-consolidation.md`

- [ ] **Step 1: Create Registration Audit Subagent**

Write `docs/superpowers/agents/text-audit-registration.md`:

```markdown
---
name: text-audit-registration
description: Audit all registration-related text for AI-generated patterns using sunnah-skill:humanizer. Analyzes forms, confirmation messages, error messages, and registration hub content.
type: executor
color: blue
tools: [Read, Write, Bash, Skill]
---

## Task

Audit all registration text for AI-generated patterns using the sunnah-skill:humanizer skill.

## Files to Review

1. `client/src/pages/RegistrationHub.tsx` - Hub page text, section headers, descriptions
2. `client/src/pages/registration/ProgramRegistrationPage.tsx` - Main registration flow text
3. `client/src/pages/registration/BJJRegistration.tsx` - BJJ-specific registration text
4. `client/src/pages/registration/ArcheryRegistration.tsx` - Archery-specific registration text
5. `client/src/pages/registration/BullyproofingRegistration.tsx` - Bullyproofing-specific text
6. `client/src/pages/registration/OutdoorRegistration.tsx` - Outdoor workshops text
7. `client/src/pages/registration/RegistrationSuccess.tsx` - Success page messaging
8. `client/src/pages/registration/RegistrationPending.tsx` - Pending state messaging
9. `client/src/pages/registration/RegistrationCancel.tsx` - Cancellation messaging
10. `client/src/pages/registration/RegistrationWaitlist.tsx` - Waitlist messaging
11. `client/src/pages/registration/CartPage.tsx` - Cart page text
12. `client/src/components/registration/RegistrationWizard.tsx` - Wizard navigation text
13. `client/src/components/registration/StepGuardianInfo.tsx` - Form labels and helper text
14. `client/src/components/registration/StepStudentInfo.tsx` - Student form text
15. `client/src/components/registration/StepPayment.tsx` - Payment step text
16. `client/src/components/registration/StepWaivers.tsx` - Waiver text and descriptions
17. `client/src/components/registration/StepProgramDetails.tsx` - Program details text
18. `client/src/components/registration/ProgramSummaryCard.tsx` - Summary card text
19. `client/src/components/registration/OrderSummaryCard.tsx` - Order summary text
20. `client/src/components/registration/ProgressIndicator.tsx` - Progress labels
21. `client/src/components/registration/ResumeBanner.tsx` - Resume session messaging

## Method

For each file:
1. Read the file content
2. Identify ALL visible text strings:
   - JSX text content between tags: `<h1>Text here</h1>`
   - Button labels: `ButtonText` prop values
   - Form labels: `Label` components
   - Helper text: Helper text under inputs
   - Placeholder text: `placeholder` attributes
   - Error messages: Error validation text
   - Confirmation messages: Success/pending text
3. Use `skill: sunnah-skill:humanizer` with the text content as argument
4. Record the humanizer output for each text section

## Output Format

Write findings to `.omc/audit-outputs/registration-audit.json`:

```json
{
  "section": "Registration",
  "filesAudited": 21,
  "findings": [
    {
      "file": "client/src/pages/RegistrationHub.tsx",
      "line": 45,
      "originalText": "Welcome to our registration portal",
      "humanizerAssessment": "Sounds AI-generated - overly formal and generic",
      "severity": "high",
      "suggestedImprovement": "Ready to get started? Pick your program below."
    }
  ],
  "summary": {
    "totalIssues": 12,
    "highSeverity": 4,
    "mediumSeverity": 5,
    "lowSeverity": 3
  }
}
```

Run the audit and save the JSON file.
```

- [ ] **Step 2: Create Public Pages Audit Subagent**

Write `docs/superpowers/agents/text-audit-public-pages.md`:

```markdown
---
name: text-audit-public-pages
description: Audit all public page content for AI-generated patterns using sunnah-skill:humanizer. Analyzes Home, About, Schedule, Programs pages, and individual program pages.
type: executor
color: green
tools: [Read, Write, Bash, Skill]
---

## Task

Audit all public page text for AI-generated patterns using the sunnah-skill:humanizer skill.

## Files to Review

1. `client/src/pages/Home.tsx` - Homepage hero text, CTAs, feature descriptions
2. `client/src/pages/About.tsx` - About page content, mission statement, team bios
3. `client/src/pages/Schedule.tsx` - Schedule page text, class descriptions
4. `client/src/pages/Programs.tsx` - Programs overview page
5. `client/src/pages/programs/BJJProgram.tsx` - BJJ program description
6. `client/src/pages/programs/ArcheryProgram.tsx` - Archery program description
7. `client/src/pages/programs/BullyproofingProgram.tsx` - Bullyproofing program text
8. `client/src/pages/programs/OutdoorWorkshopsProgram.tsx` - Outdoor workshops text
9. `client/src/pages/Contact.tsx` - Contact page text, form labels
10. `client/src/pages/Testimonials.tsx` - Testimonial content
11. `client/src/pages/TrialPage.tsx` - Trial page messaging
12. `client/src/components/programs/ProgramVisual.tsx` - Program visual descriptions
13. `client/src/components/programs/ProgramPageHeroMedia.tsx` - Hero media text
14. `client/src/components/programs/WaitlistDialog.tsx` - Waitlist dialog text

## Method

For each file:
1. Read the file content
2. Identify ALL visible text strings:
   - Hero headings and subheadings
   - Body paragraphs
   - Call-to-action buttons
   - Program descriptions
   - Feature lists and bullet points
   - Meta descriptions
   - Section headers
3. Use `skill: sunnah-skill:humanizer` with the text content
4. Record the humanizer output for each text section

## Output Format

Write findings to `.omc/audit-outputs/public-pages-audit.json`:

```json
{
  "section": "Public Pages",
  "filesAudited": 14,
  "findings": [
    {
      "file": "client/src/pages/About.tsx",
      "line": 23,
      "originalText": "We are committed to excellence in martial arts education...",
      "humanizerAssessment": "Corporate buzzword soup - sounds templated",
      "severity": "medium",
      "suggestedImprovement": "We've been teaching kids discipline and confidence since 2015."
    }
  ],
  "summary": {
    "totalIssues": 8,
    "highSeverity": 2,
    "mediumSeverity": 4,
    "lowSeverity": 2
  }
}
```

Run the audit and save the JSON file.
```

- [ ] **Step 3: Create Admin Interface Audit Subagent**

Write `docs/superpowers/agents/text-audit-admin.md`:

```markdown
---
name: text-audit-admin
description: Audit all admin dashboard text for AI-generated patterns using sunnah-skill:humanizer. Analyzes admin pages, modals, status messages, and table headers.
type: executor
color: orange
tools: [Read, Write, Bash, Skill]
---

## Task

Audit all admin interface text for AI-generated patterns using the sunnah-skill:humanizer skill.

## Files to Review

1. `client/src/pages/admin/AdminDashboard.tsx` - Dashboard text, stats labels
2. `client/src/pages/admin/AdminLogin.tsx` - Login page text
3. `client/src/pages/admin/AdminUsers.tsx` - User management text
4. `client/src/pages/admin/AdminSequences.tsx` - Sequences page text
5. `client/src/components/admin/AdminShell.tsx` - Admin layout text
6. `client/src/components/admin/AdminOverview.tsx` - Overview dashboard text
7. `client/src/components/admin/RegistrationsTable.tsx` - Table headers, status labels
8. `client/src/components/admin/RegistrationDetail.tsx` - Detail view text
9. `client/src/components/admin/PaymentsSummary.tsx` - Payment summary text
10. `client/src/components/admin/PricingManager.tsx` - Pricing text
11. `client/src/components/admin/DiscountsManager.tsx` - Discount text
12. `client/src/components/admin/TrialsManager.tsx` - Trials text
13. `client/src/components/admin/SessionManager.tsx` - Session management text
14. `client/src/components/admin/ContactsTable.tsx` - Contacts table text

## Method

For each file:
1. Read the file content
2. Identify ALL visible text strings:
   - Page titles and headings
   - Button labels (Add, Edit, Delete, Save)
   - Table column headers
   - Status labels (Active, Inactive, Pending, etc.)
   - Modal titles and content
   - Confirmation dialog text
   - Empty state messages
   - Form labels in admin forms
3. Use `skill: sunnah-skill:humanizer` with the text content
4. Record the humanizer output

## Output Format

Write findings to `.omc/audit-outputs/admin-audit.json`:

```json
{
  "section": "Admin Interface",
  "filesAudited": 14,
  "findings": [
    {
      "file": "client/src/components/admin/RegistrationsTable.tsx",
      "line": 67,
      "originalText": "Manage and oversee all student registrations",
      "humanizerAssessment": "Sounds like a manual - too formal for UI",
      "severity": "low",
      "suggestedImprovement": "View and manage registrations"
    }
  ],
  "summary": {
    "totalIssues": 6,
    "highSeverity": 1,
    "mediumSeverity": 2,
    "lowSeverity": 3
  }
}
```

Run the audit and save the JSON file.
```

- [ ] **Step 4: Create Technique Library Audit Subagent**

Write `docs/superpowers/agents/text-audit-technique-library.md`:

```markdown
---
name: text-audit-technique-library
description: Audit Technique Library text for AI-generated patterns using sunnah-skill:humanizer. Analyzes technique descriptions, labels, and navigation.
type: executor
color: purple
tools: [Read, Write, Bash, Skill]
---

## Task

Audit Technique Library text for AI-generated patterns using the sunnah-skill:humanizer skill.

## Files to Review

1. `client/src/pages/TechniqueLibrary.tsx` - Main library page text
2. `client/src/components/TechniqueModal.tsx` - Modal content text
3. `client/src/components/grapplemap/TechniqueViewer.tsx` - Viewer text
4. `client/src/components/grapplemap/MannequinScene.tsx` - Scene text
5. `client/src/lib/techniqueApi.ts` - Any UI text (if applicable)
6. `client/src/lib/loadLibrary.ts` - Library loading text
7. `client/public/data/techniques/` - All JSON technique files

## Method

For each file:
1. Read the file content
2. Identify ALL visible text strings:
   - Page title and description
   - Technique names and descriptions
   - Navigation labels
   - Filter/sort labels
   - Modal content
   - JSON technique descriptions
   - Step-by-step instructions
3. Use `skill: sunnah-skill:humanizer` with the text content
4. Record the humanizer output

## Output Format

Write findings to `.omc/audit-outputs/technique-library-audit.json`:

```json
{
  "section": "Technique Library",
  "filesAudited": 7,
  "findings": [
    {
      "file": "client/src/pages/TechniqueLibrary.tsx",
      "line": 34,
      "originalText": "Browse our comprehensive collection of martial arts techniques",
      "humanizerAssessment": "Marketing speak - "comprehensive collection" is AI-speak",
      "severity": "medium",
      "suggestedImprovement": "Browse techniques and movements"
    }
  ],
  "summary": {
    "totalIssues": 5,
    "highSeverity": 1,
    "mediumSeverity": 2,
    "lowSeverity": 2
  }
}
```

Run the audit and save the JSON file.
```

- [ ] **Step 5: Create Navigation and UI Audit Subagent**

Write `docs/superpowers/agents/text-audit-navigation-ui.md`:

```markdown
---
name: text-audit-navigation-ui
description: Audit navigation and shared UI components for AI-generated patterns using sunnah-skill:humanizer.
type: executor
color: yellow
tools: [Read, Write, Bash, Skill]
---

## Task

Audit navigation and shared UI text for AI-generated patterns using the sunnah-skill:humanizer skill.

## Files to Review

1. `client/src/components/Navigation.tsx` - Nav menu items, mobile menu text
2. `client/src/components/Footer.tsx` - Footer content, links, copyright
3. `client/src/components/motion/PageMotion.tsx` - Any text content
4. `client/src/components/ui/` - All shadcn/ui components with default text:
   - `button.tsx` - Default button labels (if any)
   - `dialog.tsx` - Default dialog text
   - `alert.tsx` - Alert default messages
   - `toast.tsx` - Toast notification defaults
   - `breadcrumb.tsx` - Breadcrumb labels
   - `pagination.tsx` - Pagination labels

## Method

For each file:
1. Read the file content
2. Identify ALL visible text strings:
   - Navigation menu items
   - Logo/home text
   - Footer links and text
   - Mobile menu labels
   - Loading states
   - Default UI text
3. Use `skill: sunnah-skill:humanizer` with the text content
4. Record the humanizer output

## Output Format

Write findings to `.omc/audit-outputs/navigation-ui-audit.json`:

```json
{
  "section": "Navigation and UI",
  "filesAudited": 8,
  "findings": [
    {
      "file": "client/src/components/Navigation.tsx",
      "line": 45,
      "originalText": "Explore our programs",
      "humanizerAssessment": "Marketing fluff - "explore" is overused AI word",
      "severity": "low",
      "suggestedImprovement": "Programs"
    }
  ],
  "summary": {
    "totalIssues": 4,
    "highSeverity": 0,
    "mediumSeverity": 1,
    "lowSeverity": 3
  }
}
```

Run the audit and save the JSON file.
```

- [ ] **Step 6: Create Forms and Inputs Audit Subagent**

Write `docs/superpowers/agents/text-audit-forms-inputs.md`:

```markdown
---
name: text-audit-forms-inputs
description: Audit all form labels, placeholders, helper text, and validation messages for AI-generated patterns using sunnah-skill:humanizer.
type: executor
color: cyan
tools: [Read, Write, Bash, Skill]
---

## Task

Audit form text for AI-generated patterns using the sunnah-skill:humanizer skill.

## Files to Review (cross-cutting forms)

1. `client/src/components/ui/form.tsx` - Form component labels
2. `client/src/components/ui/label.tsx` - Label defaults
3. `client/src/components/ui/input.tsx` - Input placeholders
4. `client/src/components/registration/FormControls.tsx` - Form control text
5. `client/src/pages/Contact.tsx` - Contact form text
6. `client/src/pages/admin/AdminLogin.tsx` - Login form labels
7. Registration forms (from Task 1):
   - `StepGuardianInfo.tsx`
   - `StepStudentInfo.tsx`
   - `StepPayment.tsx`

Focus specifically on:
- Form labels (`Label` components)
- Placeholder text (`placeholder` attributes)
- Helper text under inputs
- Validation error messages
- Required field indicators
- Select dropdown options
- Checkbox/radio labels

## Method

For each file:
1. Read the file content
2. Extract ALL form-related text:
   - Label text
   - Placeholder text
   - Helper/description text
   - Error validation messages
   - Field hints
3. Use `skill: sunnah-skill:humanizer` with the text content
4. Record the humanizer output

## Output Format

Write findings to `.omc/audit-outputs/forms-inputs-audit.json`:

```json
{
  "section": "Forms and Inputs",
  "filesAudited": 8,
  "findings": [
    {
      "file": "client/src/components/registration/StepGuardianInfo.tsx",
      "line": 89,
      "originalText": "Please enter your full legal name as it appears on official documents",
      "humanizerAssessment": "Too verbose and bureaucratic - sounds like a government form",
      "severity": "medium",
      "suggestedImprovement": "Full name (as shown on ID)"
    }
  ],
  "summary": {
    "totalIssues": 15,
    "highSeverity": 3,
    "mediumSeverity": 8,
    "lowSeverity": 4
  }
}
```

Run the audit and save the JSON file.
```

- [ ] **Step 7: Create Error and Success States Audit Subagent**

Write `docs/superpowers/agents/text-audit-error-success.md`:

```markdown
---
name: text-audit-error-success
description: Audit error messages, success states, toast notifications, and alert text for AI-generated patterns using sunnah-skill:humanizer.
type: executor
color: red
tools: [Read, Write, Bash, Skill]
---

## Task

Audit error and success state text for AI-generated patterns using the sunnah-skill:humanizer skill.

## Files to Review

1. `client/src/components/ui/toast.tsx` - Toast component defaults
2. `client/src/components/ui/toaster.tsx` - Toaster text
3. `client/src/components/ui/alert.tsx` - Alert component text
4. `client/src/components/ui/alert-dialog.tsx` - Dialog confirm/cancel text
5. Search codebase for error message patterns:
   - Run: `grep -r "toast(" client/src --include="*.tsx" | head -50`
   - Run: `grep -r "setError" client/src --include="*.tsx" | head -50`
   - Run: `grep -r "throw new Error" client/src --include="*.tsx" | head -30`
   - Run: `grep -r "ErrorMessage\|errorMessage" client/src --include="*.tsx" | head -30`
6. Search for success messages:
   - Run: `grep -r "success\|Success" client/src --include="*.tsx" | grep -i "toast\|message\|alert" | head -30`

## Method

1. Search for all toast calls and extract their message text
2. Search for all error message displays
3. Search for success confirmation text
4. For each message found:
   - Use `skill: sunnah-skill:humanizer` with the text content
   - Record the humanizer output

## Output Format

Write findings to `.omc/audit-outputs/error-success-audit.json`:

```json
{
  "section": "Error and Success States",
  "filesAudited": 20,
  "findings": [
    {
      "file": "client/src/pages/registration/ProgramRegistrationPage.tsx",
      "line": 156,
      "originalText": "An unexpected error has occurred. Please try again later.",
      "humanizerAssessment": "Generic error message - sounds robotic and unhelpful",
      "severity": "high",
      "suggestedImprovement": "Something went wrong. Give it another try or contact us if this keeps happening."
    }
  ],
  "summary": {
    "totalIssues": 18,
    "highSeverity": 6,
    "mediumSeverity": 8,
    "lowSeverity": 4
  }
}
```

Run the audit and save the JSON file.
```

- [ ] **Step 8: Create Consolidation Subagent**

Write `docs/superpowers/agents/text-audit-consolidation.md`:

```markdown
---
name: text-audit-consolidation
description: Consolidate all audit findings from subagents into a final human-readable report with prioritized action items.
type: executor
color: indigo
tools: [Read, Write, Bash]
---

## Task

Consolidate all audit outputs into a final comprehensive report.

## Input Files (must exist before running)

1. `.omc/audit-outputs/registration-audit.json`
2. `.omc/audit-outputs/public-pages-audit.json`
3. `.omc/audit-outputs/admin-audit.json`
4. `.omc/audit-outputs/technique-library-audit.json`
5. `.omc/audit-outputs/navigation-ui-audit.json`
6. `.omc/audit-outputs/forms-inputs-audit.json`
7. `.omc/audit-outputs/error-success-audit.json`

## Method

1. Read all JSON output files from subagents
2. Combine findings into a single structured report
3. Prioritize by severity (high → medium → low)
4. Group by page/section for easy navigation
5. Calculate totals and statistics
6. Generate actionable checklist

## Output Format

Write final report to `docs/audit-results/website-text-humanization-report.md`:

```markdown
# Website Text Humanization Audit Report

**Date:** YYYY-MM-DD
**Audited by:** sunnah-skill:humanizer via subagent audit

## Executive Summary

- **Total Files Audited:** [N]
- **Total Issues Found:** [N]
- **High Severity:** [N] (Must fix immediately)
- **Medium Severity:** [N] (Should fix soon)
- **Low Severity:** [N] (Nice to have)

## Priority Action Items

### High Priority (Fix First)
1. `[file.tsx:line]` - [Brief description] → [Suggested fix]
2. ...

### Medium Priority
1. `[file.tsx:line]` - [Brief description] → [Suggested fix]
2. ...

### Low Priority
1. `[file.tsx:line]` - [Brief description] → [Suggested fix]
2. ...

## Section Breakdown

### Registration Pages
- Files: [N]
- Issues: [N high, N medium, N low]
- Key problems: [summary]

### Public Pages
...

### Admin Interface
...

### Technique Library
...

### Navigation & UI
...

### Forms & Inputs
...

### Error & Success States
...

## Appendix: Full Findings List

[Complete list of all findings with file paths, line numbers, and humanizer assessments]
```

Read all inputs, generate the report, and save to the output path.
```

- [ ] **Step 9: Create output directory**

Run:
```bash
mkdir -p .omc/audit-outputs docs/superpowers/agents docs/audit-results
```

- [ ] **Step 10: Commit subagent definitions**

```bash
git add docs/superpowers/agents/
git commit -m "feat(audit): create 8 text audit subagents for humanization review"
```

---

## Task 2: Execute Registration Audit (Parallel Task 1)

**Files:**
- Read: `docs/superpowers/agents/text-audit-registration.md`
- Output: `.omc/audit-outputs/registration-audit.json`

- [ ] **Step 1: Dispatch subagent for registration audit**

Run: `claude agent text-audit-registration`

Or use subagent invocation:
```bash
claude run-agent docs/superpowers/agents/text-audit-registration.md
```

Expected: Subagent completes and writes `.omc/audit-outputs/registration-audit.json`

- [ ] **Step 2: Verify output file exists and is valid JSON**

Run:
```bash
cat .omc/audit-outputs/registration-audit.json | jq '.filesAudited'
```
Expected: Returns a number > 0

---

## Task 3: Execute Public Pages Audit (Parallel Task 2)

**Files:**
- Read: `docs/superpowers/agents/text-audit-public-pages.md`
- Output: `.omc/audit-outputs/public-pages-audit.json`

- [ ] **Step 1: Dispatch subagent for public pages audit**

Run: `claude agent text-audit-public-pages`

- [ ] **Step 2: Verify output file exists**

Run:
```bash
cat .omc/audit-outputs/public-pages-audit.json | jq '.filesAudited'
```
Expected: Returns a number > 0

---

## Task 4: Execute Admin Interface Audit (Parallel Task 3)

**Files:**
- Read: `docs/superpowers/agents/text-audit-admin.md`
- Output: `.omc/audit-outputs/admin-audit.json`

- [ ] **Step 1: Dispatch subagent for admin audit**

Run: `claude agent text-audit-admin`

- [ ] **Step 2: Verify output file exists**

Run:
```bash
cat .omc/audit-outputs/admin-audit.json | jq '.filesAudited'
```

---

## Task 5: Execute Technique Library Audit (Parallel Task 4)

**Files:**
- Read: `docs/superpowers/agents/text-audit-technique-library.md`
- Output: `.omc/audit-outputs/technique-library-audit.json`

- [ ] **Step 1: Dispatch subagent for technique library audit**

Run: `claude agent text-audit-technique-library`

- [ ] **Step 2: Verify output file exists**

Run:
```bash
cat .omc/audit-outputs/technique-library-audit.json | jq '.filesAudited'
```

---

## Task 6: Execute Navigation & UI Audit (Parallel Task 5)

**Files:**
- Read: `docs/superpowers/agents/text-audit-navigation-ui.md`
- Output: `.omc/audit-outputs/navigation-ui-audit.json`

- [ ] **Step 1: Dispatch subagent for navigation audit**

Run: `claude agent text-audit-navigation-ui`

- [ ] **Step 2: Verify output file exists**

Run:
```bash
cat .omc/audit-outputs/navigation-ui-audit.json | jq '.filesAudited'
```

---

## Task 7: Execute Forms & Inputs Audit (Parallel Task 6)

**Files:**
- Read: `docs/superpowers/agents/text-audit-forms-inputs.md`
- Output: `.omc/audit-outputs/forms-inputs-audit.json`

- [ ] **Step 1: Dispatch subagent for forms audit**

Run: `claude agent text-audit-forms-inputs`

- [ ] **Step 2: Verify output file exists**

Run:
```bash
cat .omc/audit-outputs/forms-inputs-audit.json | jq '.filesAudited'
```

---

## Task 8: Execute Error & Success States Audit (Parallel Task 7)

**Files:**
- Read: `docs/superpowers/agents/text-audit-error-success.md`
- Output: `.omc/audit-outputs/error-success-audit.json`

- [ ] **Step 1: Dispatch subagent for error/success audit**

Run: `claude agent text-audit-error-success`

- [ ] **Step 2: Verify output file exists**

Run:
```bash
cat .omc/audit-outputs/error-success-audit.json | jq '.filesAudited'
```

---

## Task 9: Wait for All Parallel Audits to Complete

- [ ] **Step 1: Check all 7 output files exist**

Run:
```bash
for f in registration public-pages admin technique-library navigation-ui forms-inputs error-success; do
  if [ -f ".omc/audit-outputs/${f}-audit.json" ]; then
    echo "✓ ${f}-audit.json exists"
  else
    echo "✗ ${f}-audit.json MISSING"
  fi
done
```

Expected: All 7 files show as exists

If any missing, re-run that specific subagent.

---

## Task 10: Run Consolidation Subagent

**Files:**
- Input: All 7 `.omc/audit-outputs/*-audit.json` files
- Output: `docs/audit-results/website-text-humanization-report.md`

- [ ] **Step 1: Verify all inputs ready**

Run:
```bash
ls -la .omc/audit-outputs/
```
Expected: 7 JSON files present

- [ ] **Step 2: Dispatch consolidation subagent**

Run: `claude agent text-audit-consolidation`

- [ ] **Step 3: Verify final report exists**

Run:
```bash
head -50 docs/audit-results/website-text-humanization-report.md
```
Expected: Shows markdown report with executive summary

- [ ] **Step 4: Get report statistics**

Run:
```bash
grep -c "high" docs/audit-results/website-text-humanization-report.md
grep -c "medium" docs/audit-results/website-text-humanization-report.md
grep -c "low" docs/audit-results/website-text-humanization-report.md
```

---

## Task 11: Final Review and Commit

- [ ] **Step 1: Review the final report for completeness**

Read: `docs/audit-results/website-text-humanization-report.md`

Check:
- Executive summary present
- All 7 sections covered
- Priority action items listed
- Statistics calculated

- [ ] **Step 2: Commit audit results**

```bash
git add .omc/audit-outputs/ docs/audit-results/
git commit -m "docs(audit): complete website text humanization audit with sunnah-skill:humanizer

- Audited 7 sections across 70+ files
- Generated prioritized action items
- Full report: docs/audit-results/website-text-humanization-report.md"
```

---

## Post-Execution: Using the Results

The final report provides:

1. **High Priority Issues** - Fix these first for immediate impact
2. **Medium Priority Issues** - Schedule for next sprint
3. **Low Priority Issues** - Address when convenient

To apply fixes:
1. Review each finding in the report
2. Use `skill: sunnah-skill:humanizer` to generate improved text
3. Edit the files using the suggested improvements
4. Test the changes visually
5. Commit with descriptive messages

---

## Spec Coverage Check

✓ Registration pages covered - Task 2
✓ Public pages covered - Task 3
✓ Admin interface covered - Task 4
✓ Technique Library covered - Task 5
✓ Navigation and UI covered - Task 6
✓ Forms and inputs covered - Task 7
✓ Error and success states covered - Task 8
✓ Parallel execution enabled - Tasks 2-8 run simultaneously
✓ Subagent development used - Task 1 creates 8 subagents
✓ sunnah-skill:humanizer used - Each subagent invokes this skill
✓ Clear deliverables defined - JSON outputs + final markdown report
✓ Final consolidation step - Task 10

No placeholders - all tasks include exact file paths, commands, and expected outputs.
