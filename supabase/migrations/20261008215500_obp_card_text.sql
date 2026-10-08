-- Card text in Admin → Challenges: the Arena is now a 54-question, 40-minute exam and the event runs 3 h 10 min.
update public.challenges
set description = 'A 3-hour solo mission (3 h 10 min with awards). Bug Bounty: fix 15 production bugs with your agents while hidden tests verify every snapshot live. The Arena: a 54-question, 40-minute certification-style exam plus a 10-minute build sprint. The Forge: hooks, skills, agents and MCP, judged by AI. Ship It: a full feature end to end, with a plot twist.',
    duration_minutes = 190
where slug = 'broken-prod';
