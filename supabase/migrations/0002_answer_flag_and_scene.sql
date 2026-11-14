-- Rekenen — review flag + scene on answer events
--
-- Run once in the Supabase SQL editor, BEFORE the app version that sends these
-- columns is deployed. (If the app is ahead, uploads stay queued on the device
-- until this has run — nothing is lost, nothing is dropped.) Safe to re-run.
--
-- flag              set when a parent tapped ⚑ while the question was on screen
--                   (app token, never free text; today only 'flagged')
-- scene_*           the theme id + background / counter index KidMode picked —
--                   with problem + meta this reconstructs what was on screen
-- viewport_w / _h   window size in CSS px when answered
--
-- answer_events keeps its table-level grants and RLS policies; new columns are
-- covered by them.

alter table public.answer_events
  add column if not exists flag             text     check (char_length(flag) <= 40),
  add column if not exists scene_theme      text     check (char_length(scene_theme) <= 40),
  add column if not exists scene_background smallint,
  add column if not exists scene_counter    smallint,
  add column if not exists viewport_w       smallint,
  add column if not exists viewport_h       smallint;

-- Flagged answers are few; this keeps "show me what I flagged" cheap.
create index if not exists answer_events_flagged_idx
  on public.answer_events (child_id, occurred_at)
  where flag is not null;
