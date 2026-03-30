---
name: text-audit-admin
description: Audits admin interface pages and components for AI-generated text patterns
type: executor
color: purple
tools: [Read, Write, Bash, Skill]
---

## Task
Audit all admin interface pages and components to identify AI-generated text patterns. Admin interfaces should be clear, concise, and professional without sounding robotic.

## Files to Review

### Admin Pages (client/src/pages/admin/)
- AdminDashboard.tsx
- AdminLogin.tsx
- AdminUsers.tsx
- AdminSequences.tsx

### Admin Components (client/src/components/admin/)
- AdminShell.tsx
- AdminOverview.tsx
- RegistrationsTable.tsx
- RegistrationDetail.tsx
- PaymentsSummary.tsx
- PricingManager.tsx
- DiscountsManager.tsx
- TrialsManager.tsx
- SessionManager.tsx
- ContactsTable.tsx

## Method

1. **Read each file** and extract all visible text content:
   - Page titles and headings
   - Table column headers
   - Button labels (save, edit, delete, approve, etc.)
   - Status labels and badges
   - Form field labels
   - Helper text and tooltips
   - Empty state messages
   - Confirmation dialog text
   - Error and success notifications
   - Navigation labels

2. **For each text string found**, invoke:
   ```
   skill: sunnah-skill:humanizer
   args: "{\"text\": \"original text\", \"context\": \"admin/ComponentName.tsx:line_number\", \"type\": \"title|heading|button|table-header|status|label|helper|empty-state|dialog\"}"
   ```

3. **Collect assessments** including:
   - Original text
   - AI probability score (0-100)
   - Issues detected
   - Suggested humanized rewrite
   - Severity (high/medium/low)

## Output Format

Write JSON to `.omc/audit-outputs/admin-audit.json`:

```json
{
  "section": "admin",
  "filesAudited": 14,
  "totalIssues": 0,
  "severityBreakdown": {
    "high": 0,
    "medium": 0,
    "low": 0
  },
  "findings": [
    {
      "file": "client/src/components/admin/RegistrationsTable.tsx",
      "line": 67,
      "type": "heading",
      "originalText": "Registration Management Interface",
      "humanizerAssessment": {
        "aiProbability": 78,
        "issues": ["Overly formal", "Unnecessarily wordy"],
        "suggestedImprovement": "Registrations"
      },
      "severity": "low"
    }
  ],
  "summary": "Brief summary of patterns found and recommendations"
}
```
