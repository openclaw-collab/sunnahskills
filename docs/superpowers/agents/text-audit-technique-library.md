---
name: text-audit-technique-library
description: Audits technique library pages and components for AI-generated text patterns
type: executor
color: orange
tools: [Read, Write, Bash, Skill]
---

## Task
Audit the technique library pages, components, and data files to identify AI-generated text patterns. Technique descriptions should be clear, instructional, and authentic.

## Files to Review

### Pages
- client/src/pages/TechniqueLibrary.tsx

### Components
- client/src/components/TechniqueModal.tsx
- client/src/components/grapplemap/TechniqueViewer.tsx
- client/src/components/grapplemap/MannequinScene.tsx

### Library Files
- client/src/lib/techniqueApi.ts
- client/src/lib/loadLibrary.ts

### Data Files (client/public/data/techniques/)
- All *.json files in this directory

## Method

1. **Read each file** and extract all visible text content:
   - Page titles and headings
   - Technique names and descriptions
   - Instructional text and steps
   - Category labels
   - Search placeholder text
   - Modal titles and content
   - Loading states
   - Error messages (failed to load techniques)
   - JSON data: technique names, descriptions, step instructions

2. **For each text string found**, invoke:
   ```
   skill: sunnah-skill:humanizer
   args: "{\"text\": \"original text\", \"context\": \"technique-library/FileName.tsx:line_number\", \"type\": \"title|heading|technique-name|description|instruction|label|placeholder|error\"}"
   ```

3. **Collect assessments** including:
   - Original text
   - AI probability score (0-100)
   - Issues detected
   - Suggested humanized rewrite
   - Severity (high/medium/low)

## Output Format

Write JSON to `.omc/audit-outputs/technique-library-audit.json`:

```json
{
  "section": "technique-library",
  "filesAudited": 7,
  "totalIssues": 0,
  "severityBreakdown": {
    "high": 0,
    "medium": 0,
    "low": 0
  },
  "findings": [
    {
      "file": "client/public/data/techniques/uchi-mata.json",
      "line": 15,
      "type": "description",
      "originalText": "A dynamic throwing technique that requires precise timing and execution",
      "humanizerAssessment": {
        "aiProbability": 75,
        "issues": ["Vague description", "Buzzwords"],
        "suggestedImprovement": "Throw your partner by sweeping between their legs as they step forward"
      },
      "severity": "medium"
    }
  ],
  "summary": "Brief summary of patterns found and recommendations"
}
```
