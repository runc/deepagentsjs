export const documentStructureSkill = `---
name: document-structure
description: Plan document structure before drafting — choose the right format (article, PRD, report, memo), map sections to reader goals, and produce a scannable outline with headings and bullets.
---

# Document Structure

Use this skill when the user needs to **plan** a document before writing prose — not when they only want a quick paragraph.

## When to Use

- "Write an article about X" (start with structure)
- "Help me plan a PRD / report / memo"
- The draft feels disorganized or missing sections
- User asks for an outline before drafting

## Workflow

1. **Clarify intent** (only if ambiguous):
   - Audience (expert vs newcomer)
   - Goal (inform, persuade, decide, teach)
   - Length (short post vs long report)
   - Constraints (tone, must-include topics)

2. **Pick a document pattern**:
   - **Article / blog**: hook → context → core argument → examples → takeaway
   - **PRD**: problem → goals → non-goals → users → requirements → success metrics → open questions
   - **Report**: executive summary → methodology → findings → recommendations → appendix notes
   - **Memo**: context → decision needed → options → recommendation → next steps

3. **Map sections to reader questions** — each H2 should answer one question the reader has.

4. **Produce outline** in Markdown:
   - H2/H3 headings
   - 2–4 bullets per section (what each section will cover)
   - Optional: estimated length per section

5. **Hand off** to drafting: save outline to the draft file or delegate to the outliner subagent, then write section by section.

## Quality Checks

- Every section has a clear purpose (no "misc" or "other")
- Order matches how readers think (problem before solution)
- Headings are parallel (all noun phrases or all questions — pick one style)
- Executive summary / TL;DR included when doc is long

## Anti-patterns

- Jumping to full paragraphs before structure is agreed
- Flat lists of topics without hierarchy
- Sections that duplicate the same point under different names
`;
