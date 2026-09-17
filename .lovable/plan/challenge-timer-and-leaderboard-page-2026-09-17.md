# Challenge Timer and Leaderboard Page

## Build
- Move the countdown higher in the Challenge #1 layout and increase its size on desktop and mobile without clipping the final-five-minute animation.
- Remove the embedded leaderboard and replace it with a clear link that appears when the challenge finishes.
- Add `/challenges/1/leaderboard` as a dedicated results experience, reusable for any challenge slug.
- Give the leaderboard a podium-style top three, a polished sortable participant ranking, status and final-score labels, live refresh, and a link back to the challenge.
- Keep results hidden before the challenge finishes so participants cannot see early rankings.

## Technical details
- Add a TanStack route at `src/routes/challenges.$slug.leaderboard.tsx` with unique page metadata.
- Reuse the existing public challenge and leaderboard reads; no database or evaluation changes.
- Preserve reduced-motion behavior and validate desktop/mobile layout, navigation, and build health.
