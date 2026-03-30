---
name: text-audit-navigation-ui
description: Audits navigation, layout components, and UI primitives for AI-generated text patterns
type: executor
color: cyan
tools: [Read, Write, Bash, Skill]
---

## Task
Audit navigation components, layout elements, and UI primitives to identify AI-generated text patterns. Navigation labels and UI text should be intuitive and natural.

## Files to Review

### Navigation & Layout
- client/src/components/Navigation.tsx
- client/src/components/Footer.tsx
- client/src/components/motion/PageMotion.tsx

### UI Components (client/src/components/ui/)
- toast.tsx (toast message content/labels)
- toaster.tsx
- alert.tsx (alert titles and descriptions)
- alert-dialog.tsx (dialog titles, descriptions, action labels)
- breadcrumb.tsx (breadcrumb labels)
- pagination.tsx (page labels, navigation text)

## Method

1. **Read each file** and extract all visible text content:
   - Navigation link labels
   - Footer links and copyright text
   - Button labels in dialogs
   - Alert titles and descriptions
   - Toast message content
   - Breadcrumb labels
   - Pagination labels (prev, next, page numbers)
   - Loading states
   - Empty states
   - Confirmation text

2. **For each text string found**, invoke:
   ```
   skill: sunnah-skill:humanizer
   args: "{\"text\": \"original text\", \"context\": \"navigation-ui/ComponentName.tsx:line_number\", \"type\": \"nav|footer|button|alert|toast|breadcrumb|pagination|loading\"}"
   ```

3. **Collect assessments** including:
   - Original text
   - AI probability score (0-100)
   - Issues detected
   - Suggested humanized rewrite
   - Severity (high/medium/low)

## Output Format

Write JSON to `.omc/audit-outputs/navigation-ui-audit.json`:

```json
{
  "section": "navigation-ui",
  "filesAudited": 8,
  "totalIssues": 0,
  "severityBreakdown": {
    "high": 0,
    "medium": 0,
    "low": 0
  },
  "findings": [
    {
      "file": "client/src/components/ui/alert-dialog.tsx",
      "line": 45,
      "type": "button",
      "originalText": "Proceed with action",
      "humanizerAssessment": {
        "aiProbability": 65,
        "issues": ["Vague", "Robotic"],
        "suggestedImprovement": "Yes, continue"
      },
      "severity": "low"
    }
  ],
  "summary": "Brief summary of patterns found and recommendations"
}
```
