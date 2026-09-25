# Public Cohort Journey

## What I’ll build
- Add a public **Cohort** page at `/cohort` and link it from the main navigation.
- Present Cohort 1 as a visual journey rather than a dashboard: current milestone, session timeline, outcomes, teams, and AI-powered challenges.
- Show the confirmed figures prominently:
  - Session 13 of 33, with a 39% progress bar
  - Two sessions per week
  - Final session: 04 December 2026
  - 2 participants hired
  - 39 contributions to well-known public open-source projects
  - 6 teams
  - All challenges are AI-powered
- Add a compact “next milestones” track so visitors can see the journey toward session 33.
- Correct the public homepage cohort end date to 04 December 2026 for consistency.

## Design direction
- Continue the existing HasoubLabs navy/red identity and editorial typography.
- Use a flowing route line, numbered session markers, animated progress, and staggered outcome reveals.
- Keep the page public, mobile-friendly, projection-friendly, and respectful of reduced-motion settings.
- Avoid invented participant counts or performance claims.

## Suggested metrics to track next
These will appear as clearly labeled future measurements, not current claims:
- Active participants and attendance rate
- Projects shipped and demos completed
- AI evaluations completed
- Certifications earned
- Interviews secured
- Open-source pull requests merged
- Mentor hours and employer partners

## Technical details
- Create a dedicated TanStack route with unique social and search metadata.
- Reuse the existing logo, tokens, animation library, and route-safe links.
- Keep the figures static for now because no editable cohort-metrics source exists yet.
- Verify desktop and mobile layouts, navigation, motion fallback, and build health.
