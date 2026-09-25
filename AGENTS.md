# Project architecture decisions

- Public cohort outcomes live on `/cohort`; keep them static until an editable metrics source is explicitly requested, avoiding unnecessary backend complexity.