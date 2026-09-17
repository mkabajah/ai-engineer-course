# Live challenge energy update

## What will change
- Make the countdown color progress through clear time-based urgency levels, ending in Hasoub red for the final five minutes.
- Add a continuous, non-blocking motivation ticker with AI, MCP, hooks, agents, Kiro Specs, RAG, skills, testing, and shipping prompts.
- Present the supplied ten projects with their “best for,” challenge style, and 45-minute setup guidance.
- Keep the existing option to submit work from any other public GitHub repository.

## Experience and accessibility
- Keep moving words in a dedicated strip so they never cover instructions, projects, forms, or the timer.
- Stop decorative movement when reduced-motion is enabled.
- Preserve the current Hasoub colors, mobile layout, server-synced timer, and submission behavior.

## Technical details
- Use semantic urgency tokens for timer colors rather than hardcoded colors in the page.
- Use lightweight CSS animation for the ticker and existing React state for timer thresholds.
- Keep project guidance as presentation data matched to the administrator-editable repository list.
