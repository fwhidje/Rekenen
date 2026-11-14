-- Rekenen — accounts + evidence store (road_to_ai_driven_rekenen.md, step 1)
--
-- Run once in the Supabase SQL editor. Safe to re-read; NOT safe to re-run
-- (it creates tables). Later schema changes get their own numbered file.
--
-- Shape:
--   auth.users          parent account (email + password) — Supabase-owned
--   children            random id per child, owned by one parent
--   child_names         display name, kept apart: the future agent role gets
--                       NO access to this table or to auth.users
--   child_progress      per-skill score + unlock/archive flags (last write wins)
--   answer_events       one row per answer — append-only evidence
--   progress_events     admin overrides (Open hier / Beheerst) — append-only
--
-- Every table has row-level security: a logged-in parent sees and writes only
-- rows of their own children. Not-logged-in visitors can do nothing except
-- call keepalive().

-- ─── Tables ───────────────────────────────────────────────────────────────────

create table public.children (
  id          uuid primary key,                       -- generated on the device (the local profile id)
  parent_id   uuid not null default auth.uid()
              references auth.users (id) on delete cascade,
  school_year text check (char_length(school_year) <= 20),  -- optional, e.g. 'L1'; never a birth date
  created_at  timestamptz not null default now()
);
create index children_parent_idx on public.children (parent_id);

create table public.child_names (
  child_id uuid primary key references public.children (id) on delete cascade,
  name     text not null check (char_length(name) between 1 and 40)
);

create table public.child_progress (
  child_id    uuid not null references public.children (id) on delete cascade,
  skill_id    text not null check (char_length(skill_id) <= 80),
  score       smallint not null check (score between 0 and 100),
  unlocked    boolean not null default false,
  archived    boolean not null default false,
  unlocked_at timestamptz,
  archived_at timestamptz,
  updated_at  timestamptz not null,                   -- device time of the change
  primary key (child_id, skill_id)
);

create table public.answer_events (
  id               uuid primary key,                  -- generated on the device → re-uploads are no-ops
  child_id         uuid not null references public.children (id) on delete cascade,
  occurred_at      timestamptz not null,              -- device time of the answer
  received_at      timestamptz not null default now(),
  session_id       uuid,
  app_version      text check (char_length(app_version) <= 40),  -- build commit, or 'pre-sync'
  skill_id         text not null check (char_length(skill_id) <= 80),
  exercise_id      text not null check (char_length(exercise_id) <= 80),
  tier_id          text check (char_length(tier_id) <= 80),
  variant          text check (char_length(variant) <= 80),
  is_retry         boolean not null default false,
  op               text not null check (char_length(op) <= 10),
  semantic_form    text check (char_length(semantic_form) <= 20),
  problem          jsonb,
  operand_a        integer not null,
  operand_b        integer not null,
  correct_answer   integer not null,
  given_answer     integer,
  correct          boolean not null,
  error_type       text check (char_length(error_type) <= 40),
  score_before     smallint,
  response_time_ms integer,
  tap_count        integer,
  replay_count     integer,
  meta             jsonb,                             -- what was shown (options, distractors)
  constraint answer_events_problem_small check (problem is null or octet_length(problem::text) <= 1000),
  constraint answer_events_meta_small    check (meta is null or octet_length(meta::text) <= 16000)
);
create index answer_events_child_time_idx on public.answer_events (child_id, occurred_at);

create table public.progress_events (
  id          uuid primary key,
  child_id    uuid not null references public.children (id) on delete cascade,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  app_version text check (char_length(app_version) <= 40),
  kind        text not null check (char_length(kind) <= 40),     -- 'override-open' | 'override-mastered' | …
  skill_id    text check (char_length(skill_id) <= 80),
  detail      jsonb,                                             -- per-skill before → after
  constraint progress_events_detail_small check (detail is null or octet_length(detail::text) <= 16000)
);
create index progress_events_child_time_idx on public.progress_events (child_id, occurred_at);

-- ─── Last write wins for progress ─────────────────────────────────────────────
-- Two devices may push the same skill. An update that is older than what is
-- stored is silently dropped, so a stale device can never roll progress back.

create function public.child_progress_keep_newest()
returns trigger
language plpgsql
as $$
begin
  if new.updated_at <= old.updated_at then
    return null;  -- skip this row's update
  end if;
  return new;
end;
$$;

create trigger child_progress_keep_newest
  before update on public.child_progress
  for each row execute function public.child_progress_keep_newest();

-- ─── Row-level security ───────────────────────────────────────────────────────

alter table public.children        enable row level security;
alter table public.child_names     enable row level security;
alter table public.child_progress  enable row level security;
alter table public.answer_events   enable row level security;
alter table public.progress_events enable row level security;

-- Start from nothing, then grant exactly what the app needs.
revoke all on public.children, public.child_names, public.child_progress,
              public.answer_events, public.progress_events
  from anon, authenticated;

grant select, insert, update, delete on public.children       to authenticated;
grant select, insert, update, delete on public.child_names    to authenticated;
grant select, insert, update         on public.child_progress to authenticated;
grant select, insert                 on public.answer_events  to authenticated;  -- append-only
grant select, insert                 on public.progress_events to authenticated; -- append-only

-- children: the parent's own rows.
create policy children_own on public.children
  for all to authenticated
  using (parent_id = (select auth.uid()))
  with check (parent_id = (select auth.uid()));

-- Everything else: rows of a child the parent owns. (The subquery is itself
-- filtered by children_own, so it can only ever see the caller's children.)
create policy child_names_own on public.child_names
  for all to authenticated
  using (child_id in (select id from public.children))
  with check (child_id in (select id from public.children));

create policy child_progress_own on public.child_progress
  for all to authenticated
  using (child_id in (select id from public.children))
  with check (child_id in (select id from public.children));

create policy answer_events_read on public.answer_events
  for select to authenticated
  using (child_id in (select id from public.children));
create policy answer_events_append on public.answer_events
  for insert to authenticated
  with check (child_id in (select id from public.children));

create policy progress_events_read on public.progress_events
  for select to authenticated
  using (child_id in (select id from public.children));
create policy progress_events_append on public.progress_events
  for insert to authenticated
  with check (child_id in (select id from public.children));

-- ─── Keep-alive ───────────────────────────────────────────────────────────────
-- Free projects pause after a week without activity. A scheduled GitHub Action
-- calls this every few days. It reads no data.

create function public.keepalive()
returns integer
language sql
stable
as $$ select 1 $$;

revoke all on function public.keepalive() from public;
grant execute on function public.keepalive() to anon, authenticated;
