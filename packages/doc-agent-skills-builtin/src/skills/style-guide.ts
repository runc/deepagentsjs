export const styleGuideSkill = `---
name: style-guide
description: Apply consistent writing style — tone, voice, formatting, and terminology — for technical and business documents in Markdown.
---

# Style Guide

Use this skill when revising drafts for **clarity, tone, and consistency** — not for factual research or structural reorganization.

## Default Voice (adjust per user request)

- **Clear and direct** — short sentences, active voice
- **Professional but approachable** — avoid jargon unless audience expects it
- **Concrete** — prefer examples over abstract claims

## Markdown Conventions

- One H1 title at top; use H2 / H3 for sections
- Bullets for lists; numbered lists only for sequences
- Code blocks with language tags when showing code
- Links with descriptive text, not "click here"
- Bold for emphasis sparingly; avoid ALL CAPS

## Terminology

- Pick one term per concept (e.g. "API" not "api" and "API" mixed)
- Define acronyms on first use in long docs
- Use consistent product/feature naming from the user's draft

## Sentence-Level Rules

- Lead with the main point (BLUF)
- Cut filler: "in order to", "it is important to note", "basically"
- Prefer "use" over "utilize"; "help" over "facilitate"
- Numbers: spell out one–nine in prose if style is formal; use digits for data

## Revision Workflow

1. Read the full draft (or section) from the draft file
2. Note 3–5 style issues (tone drift, inconsistent terms, weak openings)
3. Apply edits with edit_file — preserve meaning, improve readability
4. Summarize changes in chat briefly (don't paste the whole doc)

## When User Specifies Style

- **Technical blog**: slightly conversational, code examples welcome
- **Executive summary**: minimal jargon, outcome-focused
- **Tutorial**: step-by-step, imperative verbs ("Install", "Run", "Verify")
`;
