export const reviewChecklistSkill = `---
name: review-checklist
description: Systematic document review checklist — clarity, structure, accuracy signals, completeness, and actionable feedback before calling a draft done.
---

# Review Checklist

Use this skill for **quality review** of a draft — or delegate to the reviewer subagent with this checklist in mind.

## When to Use

- User asks to "review", "proofread", or "polish" a draft
- Before marking a writing task complete
- After major revisions

## Review Dimensions

### 1. Clarity
- [ ] Opening states purpose within 2–3 sentences
- [ ] Each paragraph has one main idea
- [ ] No ambiguous "this/that/it" without clear referent
- [ ] Technical terms defined or linked on first use

### 2. Structure
- [ ] Headings match content (no empty sections)
- [ ] Logical flow (context → detail → conclusion)
- [ ] Transitions between major sections
- [ ] Length appropriate for audience

### 3. Completeness
- [ ] All user-requested topics covered
- [ ] Obvious questions answered (who, what, why, how, when)
- [ ] Calls to action or next steps if applicable
- [ ] No placeholder text ([TODO], TBD) unless user approved

### 4. Accuracy & Honesty
- [ ] Flag unsupported claims ("always", "never", unverified stats)
- [ ] Distinguish fact vs opinion vs speculation
- [ ] Note where citations or verification are needed

### 5. Polish
- [ ] Grammar and spelling (light touch — don't rewrite voice)
- [ ] Consistent heading style and list formatting
- [ ] No duplicate sections

## Output Format

Return feedback in chat as:

## Summary
One sentence overall assessment.

## Strengths
- ...

## Issues (priority ordered)
1. [Section] — issue — suggested fix

## Optional improvements
- ...

Apply **concrete edits** via edit_file only when user asks to fix issues — otherwise feedback only.

## Anti-patterns

- Rewriting the entire document in chat
- Style-only nitpicks before structural issues are addressed
- Approving drafts with missing required sections
`;
