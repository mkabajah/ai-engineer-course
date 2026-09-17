# Participant clock and leaderboard page

## Changes
- Enlarge the countdown only on the participant challenge page and raise it slightly on larger screens, while preserving the admin clock size.
- Keep the existing end-of-challenge leaderboard in its current location.
- Add a clear leaderboard button on the participant page that opens `/challenges/1/leaderboard`.
- Build the dedicated leaderboard page with live score updates, ranking, sorting, participant/review details, and a polished podium-style presentation.
- Keep results hidden until the challenge is finished, matching the current leaderboard rule.

## Technical details
- Reuse one shared leaderboard display so sorting, score labels, and status styling remain consistent on both pages.
- Add unique page metadata for the new leaderboard route.
- Verify the participant and leaderboard pages at desktop and mobile sizes, and confirm the admin layout is unchanged.
