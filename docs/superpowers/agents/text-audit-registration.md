---
name: text-audit-registration
description: Audits all registration pages and components for AI-generated text patterns that need humanization
type: executor
color: blue
tools: [Read, Write, Bash, Skill]
---

## Task
Audit all registration-related pages and components to identify AI-generated text patterns that should be humanized. Extract all visible text strings and assess them using the humanizer skill.

## Files to Review

### Pages (client/src/pages/registration/)
- RegistrationHub.tsx
- ProgramRegistrationPage.tsx
- BJJRegistration.tsx
- ArcheryRegistration.tsx
- BullyproofingRegistration.tsx
- OutdoorRegistration.tsx
- RegistrationSuccess.tsx
- RegistrationPending.tsx
- RegistrationCancel.tsx
- RegistrationWaitlist.tsx
- CartPage.tsx

### Components (client/src/components/registration/)
- RegistrationWizard.tsx
- StepGuardianInfo.tsx
- StepStudentInfo.tsx
- StepPayment.tsx
- StepWaivers.tsx
- StepProgramDetails.tsx
- ProgramSummaryCard.tsx
- OrderSummaryCard.tsx
- ProgressIndicator.tsx
- ResumeBanner.tsx

## Method

1. **Read each file** and extract all visible text content:
   - Headings (h1, h2, h3, etc.)
   - Button labels and call-to-action text
   - Form labels and field names
   - Helper text and descriptions
   - Input placeholders
   - Error messages
   - Confirmation/success messages
   - Navigation labels (next, back, skip, etc.)
   - Waiver text and legal disclaimers

2. **For each text string found**, invoke:
   ```
   skill: sunnah-skill:humanizer
   args: "{\"text\": \"original text\", \"context\": \"registration/ComponentName.tsx:line_number\", \"type\": \"heading|button|label|helper|error|success|placeholder\"}"
   ```

3. **Collect assessments** including:
   - Original text
   - AI probability score (0-100)
   - Issues detected (generic phrasing, buzzwords, stiff tone, etc.)
   - Suggested humanized rewrite
   - Severity (high/medium/low)

## Output Format

Write JSON to `.omc/audit-outputs/registration-audit.json`:

```json
{
  "section": "registration",
  "filesAudited": 21,
  "totalIssues": 0,
  "severityBreakdown": {
    "high": 0,
    "medium": 0,
    "low": 0
  },
  "findings": [
    {
      "file": "client/src/pages/registration/RegistrationHub.tsx",
      "line": 42,
      "type": "heading",
      "originalText": "Register for Programs",
      "humanizerAssessment": {
        "aiProbability": 85,
        "issues": ["Generic phrasing", "Lacks warmth"],
        "suggestedImprovement": "Let's get your child signed up!"
      },
      "severity": "medium"
    }
  ],
  "summary": "Brief summary of patterns found and recommendations"
}
```
