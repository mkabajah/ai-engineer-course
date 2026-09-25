# Project architecture decisions

- Public cohort discovery lives on `/cohort`, with static impact stories at `/cohort/$cohortId` until editable metrics are requested, avoiding unnecessary backend complexity.