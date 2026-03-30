---
name: text-audit-forms-inputs
description: Audits form components and input elements for AI-generated text patterns
type: executor
color: yellow
tools: [Read, Write, Bash, Skill]
---

## Task
Audit form components, input elements, and form labels to identify AI-generated text patterns. Form text should be clear, helpful, and conversational.

## Files to Review

### Form UI Components (client/src/components/ui/)
- form.tsx (form labels, descriptions, error messages)
- label.tsx
- input.tsx (placeholder patterns)

### Registration Form Controls
- client/src/components/registration/FormControls.tsx

### Form Pages
- client/src/pages/Contact.tsx (contact form labels and placeholders)
- client/src/pages/admin/AdminLogin.tsx (login form labels)

### Wizard Steps (also covered in registration audit, but check for form-specific text)
- client/src/components/registration/StepGuardianInfo.tsx (form labels, placeholders)
- client/src/components/registration/StepStudentInfo.tsx (form labels, placeholders)
- client/src/components/registration/StepPayment.tsx (form labels, helper text)

## Method

1. **Read each file** and extract all visible text content:
   - Form field labels
   - Input placeholders
   - Helper text and descriptions
   - Required field indicators and messages
   - Error messages
   - Success/confirmation messages
   - Button labels (submit, reset, save)
   - Checkbox/radio labels
   - Select dropdown options
   - Form section headings

2. **For each text string found**, invoke:
   ```
   skill: sunnah-skill:humanizer
   args: "{\"text\": \"original text\", \"context\": \"forms-inputs/FileName.tsx:line_number\", \"type\": \"label|placeholder|helper|error|success|button|heading|option\"}"
   ```

3. **Collect assessments** including:
   - Original text
   - AI probability score (0-100)
   - Issues detected
   - Suggested humanized rewrite
   - Severity (high/medium/low)

## Output Format

Write JSON to `.omc/audit-outputs/forms-inputs-audit.json`:

```json
{
  "section": "forms-inputs",
  "filesAudited": 8,
  "totalIssues": 0,
  "severityBreakdown": {
    "high": 0,
    "medium": 0,
    "low": 0
  },
  "findings": [
    {
      "file": "client/src/components/registration/StepGuardianInfo.tsx",
      "line": 34,
      "type": "label",
      "originalText": "Please enter your legal first name",
      "humanizerAssessment": {
        "aiProbability": 70,
        "issues": ["Overly formal", "Unnecessary wordiness"],
        "suggestedImprovement": "Your first name"
      },
      "severity": "low"
    }
  ],
  "summary": "Brief summary of patterns found and recommendations"
}
```
