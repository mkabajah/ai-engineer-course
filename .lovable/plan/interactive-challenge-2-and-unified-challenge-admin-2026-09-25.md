# Interactive Challenge #2 and unified challenge admin

## Goal
Make the Claude Code Architect exam feel like a practical simulation rather than a long list of plain questions, and manage it alongside Challenge #1 from one scalable Challenges area.

## Participant experience
- Keep the 90-minute shared timer, autosave, flags, navigation, scoring, and results.
- Replace a meaningful portion of plain multiple-choice items with richer formats: architecture diagrams, terminal/config inspection, ordering workflows, matching concepts, multi-select decisions, and short implementation tasks.
- Present each format with purpose-built interaction and clear visual feedback, while keeping all answers keyboard-friendly and mobile-safe.
- Use lightweight native visuals and code/terminal mockups so questions load reliably without external assets.
- Update question metadata, answer validation, grading, progress, and review explanations to support every format securely.

## Admin experience
- Rename the admin navigation item to **Challenges** and remove the separate **Exam** tab.
- Turn `/admin/challenge` into a challenge library showing Challenge #1 and Challenge #2 as distinct entries with type, duration, state, participation, and an open/manage action.
- Move Challenge #1 controls to a dedicated challenge detail page.
- Move Challenge #2 controls to its own dedicated challenge detail page.
- Keep existing participant URLs working.

## Technical details
- Add typed question variants and server-held correct answers; only participant-safe question data leaves the server.
- Preserve current attempt data compatibility so existing answers and results continue to work.
- Add admin challenge-summary loading with authenticated role checks.
- Create route files matching TanStack route IDs exactly, update all links together, and give every new content route unique metadata.
- Verify builds plus desktop/mobile participant and admin navigation flows.
