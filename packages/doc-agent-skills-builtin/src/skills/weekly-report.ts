export const weeklyReportSkill = `---
name: weekly-report
description: Structure and write weekly status reports — accomplishments, metrics, blockers, and next-week plans in a scannable format.
---

# Weekly Report

Use this skill when the user wants a **weekly update**, status report, or team sync document.

## When to Use

- "Write my weekly report"
- "Summarize what I did this week"
- User provides bullet notes or meeting notes to turn into a report

## Default Template

# Weekly Report — [Week of DATE]

## Highlights
- 2–4 top outcomes (impact-oriented, not task lists)

## Completed
- [Area] — what shipped or finished

## In Progress
- [Area] — status, ETA if known

## Blockers / Risks
- Blocker — impact — needed help

## Next Week
- Planned focus items (3–5 max)

## Notes / Links
- Optional references

## Workflow

1. Gather inputs: user message, pasted notes, or prior draft sections
2. If metrics or dates are missing, ask **one** clarifying question or use placeholders [DATE] / [metric]
3. Write highlights first (most important for readers)
4. Convert task dumps into outcome bullets ("Shipped X" not "Worked on X")
5. Save to draft file; keep chat summary to 2–3 sentences

## Style

- Bullets over paragraphs
- Lead with impact ("Reduced latency 40%" before "optimized API")
- Honest blockers — no burying risks at the bottom without context
- Same section order every week for scanability

## Variants

- **Manager report**: add "Team health" and "Hiring/priorities" if relevant
- **Personal log**: lighter template — Highlights / Done / Learned / Next
`;
