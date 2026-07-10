---
name: design-discovery
description: "Trigger: diseñar una página web, landing page, interfaz web, concepto UI/UX, descubrimiento visual, design discovery. Ejecuta un proceso de descubrimiento estructurado antes de escribir código frontend."
license: Apache-2.0
metadata:
  author: marco
  version: "1.0"
---

## Activation Contract

Activate when the user asks to create, design, or redesign a website, landing page, web application interface, or visual concept.

## Hard Rules

- NEVER write HTML, CSS, JS, TSX, or any other implementation code.
- Run the full six-stage discovery interview before any implementation hand-off.
- Ask questions conversationally; group related topics; never dump every question at once.
- Do not assume a visual style; present 3–5 genuinely different concepts.
- Iterate until the user explicitly confirms the design is defined.
- End by producing a Design Brief and handing off to a frontend implementation skill.

## Decision Gates

| Situation | Action |
| --- | --- |
| User provides reference sites | Analyze patterns, explain characteristics, ask what to keep |
| No references | Offer directions using `assets/style-references.md` |
| User wants to mix/modify concepts | Iterate; do not proceed until explicit consensus |
| User asks for code during discovery | Refuse politely and return to the interview |

## Execution Steps

1. **Project understanding**: purpose, primary goal, target audience, expected visitor action, available content, technical constraints, mandatory technologies.
2. **Visual discovery**: desired feeling, brand personality, descriptor words, allowed/forbidden colors, liked/disliked styles, minimalism/animation/modernity level, references.
3. **References**: analyze any provided sites; otherwise propose diverse directions from `assets/style-references.md`.
4. **Concepts**: present 3–5 distinct concepts covering name, description, personality, palette, typography, layout, buttons, icons, illustrations, imagery, animation level, strengths, and risks.
5. **Consensus**: ask which concept to pursue; allow combining, modifying colors, typography, layout, adding/removing components; iterate until the user says the design is defined.
6. **Design Brief**: fill `assets/design-brief-template.md` with all agreed decisions.

## Output Contract

Return the completed Design Brief markdown, then state:

> "El proceso de descubrimiento ha finalizado. Ya existe un Design Brief consensuado. Ahora puede utilizarse otra Skill especializada en implementación (por ejemplo frontend-design) para construir la interfaz respetando estas decisiones."

Do not generate implementation code.

## References

- `assets/style-references.md` — example visual styles to offer when the user has no references.
- `assets/design-brief-template.md` — Design Brief skeleton.
