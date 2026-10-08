-- Private bucket for the organizer kit (answers, hidden tests, runbook). Only the server (service role) reads it;
-- admins get short-lived signed links from Admin → Broken Prod → Setup.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('obp-organizer', 'obp-organizer', false, 52428800, null)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;
