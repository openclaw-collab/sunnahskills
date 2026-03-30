---
name: text-audit-public-pages
description: Audits public-facing pages for AI-generated text patterns that need humanization
type: executor
color: green
tools: [Read, Write, Bash, Skill]
---

## Task
Audit all public-facing pages and components to identify AI-generated text patterns that should be humanized. These are the pages visitors see before registering.

## Files to Review

### Main Pages (client/src/pages/)
- Home.tsx
- About.tsx
- Schedule.tsx
- Programs.tsx
- Contact.tsx
- Testimonials.tsx
- TrialPage.tsx

### Program Pages (client/src/pages/programs/)
- BJJProgram.tsx
- ArcheryProgram.tsx
- BullyproofingProgram.tsx
- OutdoorWorkshopsProgram.tsx

### Program Components (client/src/components/programs/)
- ProgramVisual.tsx
- ProgramPageHeroMedia.tsx
- WaitlistDialog.tsx

## Method

1. **Read each file** and extract all visible text content:
   - Hero headlines and taglines
   - Section headings
   - Body copy and descriptions
   - Feature lists and bullet points
   - Call-to-action buttons
   - Testimonial quotes (verify they sound authentic)
   - Program descriptions and benefits
   - Contact form labels and placeholders
   - Waitlist messaging
   - Trial page copy

2. **For each text string found**, invoke:
   ```
   skill: sunnah-skill:humanizer
   args: "{\"text\": \"original text\", \"context\": \"public-pages/PageName.tsx:line_number\", \"type\": \"hero|heading|body|cta|testimonial|feature|label\"}"
   ```

3. **Collect assessments** including:
   - Original text
   - AI probability score (0-100)
   - Issues detected
   - Suggested humanized rewrite
   - Severity (high/medium/low)

## Output Format

Write JSON to `.omc/audit-outputs/public-pages-audit.json`:

```json
{
  "section": "public-pages",
  "filesAudited": 14,
  "totalIssues": 0,
  "severityBreakdown": {
    "high": 0,
    "medium": 0,
    "low": 0
  },
  "findings": [
    {
      "file": "client/src/pages/Home.tsx",
      "line": 23,
      "type": "hero",
      "originalText": "Transform your child's potential into excellence",
      "humanizerAssessment": {
        "aiProbability": 92,
        "issues": ["Buzzword heavy", "Overly grandiose", "Generic"],
        "suggestedImprovement": "Kids thrive here. Simple as that."
      },
      "severity": "high"
    }
  ],
  "summary": "Brief summary of patterns found and recommendations"
}
```
