-- Nestora initial schema.
-- The FastAPI backend talks to these tables with the service-role key (bypasses RLS) and
-- enforces ownership itself. RLS is still on so the public anon key can only ever read a
-- signed-in user's own rows, never anyone else's.

create table public.houses (
  id          text primary key check (id ~ '^[A-Za-z0-9_-]{1,64}$'),
  owner_id    uuid references auth.users (id) on delete cascade,
  -- Hash of the edit token given to an anonymous creator; null once claimed.
  edit_token_hash text,
  status      text not null default 'draft',
  twin        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- Anonymous houses expire after 7 days unless claimed (owner_id set).
  expires_at  timestamptz default (now() + interval '7 days')
);
create index houses_owner_idx on public.houses (owner_id);
create index houses_expires_idx on public.houses (expires_at) where owner_id is null;

-- Every save keeps the previous twin: the versioned history the learned ranker trains on.
create table public.house_versions (
  id         bigint generated always as identity primary key,
  house_id   text not null references public.houses (id) on delete cascade,
  version    int not null,
  twin       jsonb not null,
  created_at timestamptz not null default now(),
  unique (house_id, version)
);

-- Leads for cities/build types we don't serve yet, and architect-review requests.
create table public.waitlist (
  id         bigint generated always as identity primary key,
  email      text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  kind       text not null check (kind in ('city', 'flat_interior', 'renovation', 'architect_review')),
  city       text,
  house_id   text references public.houses (id) on delete set null,
  user_id    uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.houses enable row level security;
alter table public.house_versions enable row level security;
alter table public.waitlist enable row level security;

create policy "owners read their houses" on public.houses
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "owners read their house versions" on public.house_versions
  for select to authenticated using (
    exists (select 1 from public.houses h where h.id = house_id and h.owner_id = (select auth.uid()))
  );
-- waitlist: no client policies; only the backend (service role) reads or writes it.

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger houses_touch before update on public.houses
  for each row execute function public.touch_updated_at();
