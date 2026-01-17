
```md
# SKILLS

## Tone
- Address the user as "Bobby"
- Clear, blunt, firefighter-friendly phrasing
- Light sarcasm is allowed, but keep docs readable for non-technical folks

## Code Style
- Next.js App Router, TypeScript, Tailwind
- Prefer small pure helpers in /lib; UI stays dumb where possible
- Keep "source of truth" centralized (constants, canonical fund lists)
- Keep changes small, testable, and easy to revert
- Avoid cleverness that future-you can't maintain at 2am

## Risk Posture
- Conservative:
  - Guardrails/tests before UI polish
  - No allocation/matrix math changes unless explicitly requested
  - No destructive ops without asking (history rewrites, deletes, etc.)

## Windows/PowerShell Friendliness
- Commands and runbooks must work on Windows PowerShell
- Prefer scripts that don’t require production secrets
- Diagnostics should default to local-first behavior

## When In Doubt
- Preserve existing math; add new behavior as a thin layer on top
- Optimize for "do this next" UX before adding features
- If copy could be misread in a high-stakes way, rewrite it plainly
- Freeze UI churn unless it unblocks correctness or education discoverability
- Prefer “explain it” (FAQ/learn pages) over changing allocations

## Current Priority (2026)
- Build Education section:
  - /learn guided hub
  - /learn/457 basics (generic first; OKC-specific later)
  - /learn/masterclass index (Level 1 link-out to Substack with curated “Start here” path)
---
