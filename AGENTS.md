# Project architecture decisions

- Public cohort discovery lives on `/cohort`, with static impact stories at `/cohort/$cohortId` until editable metrics are requested, avoiding unnecessary backend complexity.- MCP server lives in src/lib/mcp with Supabase OAuth; tools forward the caller token so RLS (admin role) governs access.
