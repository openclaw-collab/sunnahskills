---
name: text-audit-error-success
description: Searches codebase for error and success messages to audit for AI-generated patterns
type: executor
color: red
tools: [Read, Write, Bash, Grep, Skill]
---

## Task
Search the entire codebase for error messages, success messages, and status notifications to identify AI-generated text patterns. These messages should be helpful and natural-sounding.

## Files to Search

### Search Patterns
Use Grep to find:
- `toast({` or `toast(` calls with message content
- `setError(` calls and error message assignments
- `throw new Error(` with message strings
- `ErrorMessage` components and error display
- `success` or `Success` message strings
- `message:` properties in objects
- Alert/notification content

### Key Areas to Focus
- API error responses
- Form validation messages
- Action success confirmations
- Loading state messages
- Empty state messages
- Error boundary fallback text
- Network failure messages
- Authentication error messages

## Method

1. **Search for text patterns** using Grep:
   ```bash
   grep -r "toast(" client/src/ --include="*.tsx" --include="*.ts"
   grep -r "setError" client/src/ --include="*.tsx" --include="*.ts"
   grep -r "throw new Error" client/src/ --include="*.tsx" --include="*.ts"
   grep -r "message:" client/src/ --include="*.tsx" --include="*.ts"
   ```

2. **Read identified files** to extract full message context

3. **For each message found**, invoke:
   ```
   skill: sunnah-skill:humanizer
   args: "{\"text\": \"original text\", \"context\": \"error-success/FileName.tsx:line_number\", \"type\": \"error|success|toast|alert|loading|empty|validation\"}"
   ```

4. **Collect assessments** including:
   - Original text
   - AI probability score (0-100)
   - Issues detected
   - Suggested humanized rewrite
   - Severity (high/medium/low)

## Output Format

Write JSON to `.omc/audit-outputs/error-success-audit.json`:

```json
{
  "section": "error-success",
  "filesAudited": 0,
  "totalIssues": 0,
  "severityBreakdown": {
    "high": 0,
    "medium": 0,
    "low": 0
  },
  "findings": [
    {
      "file": "client/src/lib/api.ts",
      "line": 23,
      "type": "error",
      "originalText": "An error occurred while processing your request. Please try again later.",
      "humanizerAssessment": {
        "aiProbability": 88,
        "issues": ["Generic", "Robotic", "Unhelpful"],
        "suggestedImprovement": "Something went wrong. Give it another try?"
      },
      "severity": "medium"
    }
  ],
  "summary": "Brief summary of patterns found and recommendations"
}
```
