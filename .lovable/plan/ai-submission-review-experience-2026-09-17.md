# AI submission review experience

## Goal
Make the post-submission wait feel active and trustworthy while the system fetches the GitHub change and evaluates it fairly.

## Changes
- Show an animated review panel immediately after a participant submits, with clear stages: validating the GitHub link, fetching PR/commit details, reading changed files, checking quality and verification, and preparing the result.
- Keep the participant’s submitted link visible during analysis, prevent duplicate clicks, and transition cleanly into the final evaluation or human-review state.
- Make the animation polished on desktop and mobile, using the existing Hasoub navy/red styling and a static reduced-motion version for accessibility.
- Strengthen the AI evaluation instructions with an explicit 100-point rubric for relevance, usefulness, scope, verification, and clarity.
- Calibrate scoring so contribution size alone never earns points, small well-tested fixes can score highly, missing evidence lowers confidence, and inaccessible or ambiguous diffs go to human review rather than receiving an invented mark.
- Validate the AI response before saving it, clamp marks to the rubric, and preserve the instructor’s final authority.

## Verification
- Check the submission flow visually at desktop and mobile sizes.
- Confirm reduced-motion behavior, final status transitions, and error handling.
- Confirm the app builds without errors.

## Technical details
The current submission request performs GitHub fetching and AI review before returning. The participant page will therefore render the staged analysis experience from local submission state during that request, while the existing persisted evaluation status continues to support refreshes and instructor re-evaluation.
