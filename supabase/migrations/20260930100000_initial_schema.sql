-- =====================================================================
-- Study Resource Saver: tables, indexes and triggers
-- Run this file first. It is safe to run on a brand-new Supabase project.
-- =====================================================================

-- pg_trgm makes "contains this text" searches fast.
create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------
-- categories: subjects created by each user (C++, Physics, ...)
-- ---------------------------------------------------------------------
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 50),
  created_at timestamptz not null default now()
);

-- One category name per user, ignoring upper/lower case.
create unique index categories_user_name_key on public.categories (user_id, lower(name));

-- ---------------------------------------------------------------------
-- tags: free-form labels created by each user (OOP, Exam, ...)
-- ---------------------------------------------------------------------
create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 30),
  created_at timestamptz not null default now()
);

create unique index tags_user_name_key on public.tags (user_id, lower(name));

-- ---------------------------------------------------------------------
-- resources: the saved links
-- ---------------------------------------------------------------------
create table public.resources (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null check (char_length(btrim(title)) between 1 and 200),
  url         text not null check (url ~* '^https?://' and char_length(url) <= 2048),
  type        text not null default 'website'
              check (type in ('youtube', 'github', 'pdf', 'drive', 'course', 'website', 'other')),
  -- Deleting a category keeps the resource; it simply becomes "Uncategorized".
  category_id uuid references public.categories (id) on delete set null,
  status      text not null default 'to_study'
              check (status in ('to_study', 'in_progress', 'completed')),
  is_favorite boolean not null default false,
  notes       text not null default '' check (char_length(notes) <= 5000),
  -- Title + notes + category name + tag names in one lowercase string.
  -- Kept up to date by triggers so one indexed search covers everything.
  search_text text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index resources_user_created_idx on public.resources (user_id, created_at desc);
create index resources_user_status_idx  on public.resources (user_id, status);
create index resources_category_idx     on public.resources (category_id);
create index resources_search_idx       on public.resources
  using gin (search_text extensions.gin_trgm_ops);

-- ---------------------------------------------------------------------
-- resource_tags: which tags are on which resource (many-to-many)
-- ---------------------------------------------------------------------
create table public.resource_tags (
  resource_id uuid not null references public.resources (id) on delete cascade,
  tag_id      uuid not null references public.tags (id) on delete cascade,
  primary key (resource_id, tag_id)
);

create index resource_tags_tag_idx on public.resource_tags (tag_id);

-- ---------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------

-- Before a resource is saved: refresh updated_at and rebuild search_text.
create function public.resources_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if (new.title, new.url, new.type, new.category_id, new.status, new.is_favorite, new.notes)
       is distinct from
       (old.title, old.url, old.type, old.category_id, old.status, old.is_favorite, old.notes)
    then
      new.updated_at := now();
    else
      new.updated_at := old.updated_at;
    end if;
  end if;

  new.search_text := lower(concat_ws(' ',
    new.title,
    new.notes,
    (select c.name from public.categories c where c.id = new.category_id),
    (select string_agg(t.name, ' ')
       from public.resource_tags rt
       join public.tags t on t.id = rt.tag_id
      where rt.resource_id = new.id)
  ));

  return new;
end;
$$;

create trigger resources_before_write
before insert or update on public.resources
for each row execute function public.resources_before_write();

-- When tags are added to or removed from a resource, rebuild its search_text.
create function public.resource_tags_refresh_search()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    update public.resources set search_text = '' where id = old.resource_id;
    return old;
  end if;
  update public.resources set search_text = '' where id = new.resource_id;
  return new;
end;
$$;

create trigger resource_tags_refresh_search
after insert or delete on public.resource_tags
for each row execute function public.resource_tags_refresh_search();

-- When a category is renamed, rebuild search_text for its resources.
create function public.categories_refresh_search()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.resources set search_text = '' where category_id = new.id;
  return new;
end;
$$;

create trigger categories_refresh_search
after update of name on public.categories
for each row execute function public.categories_refresh_search();

-- When a tag is renamed, rebuild search_text for resources using it.
create function public.tags_refresh_search()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.resources r set search_text = ''
   where exists (select 1 from public.resource_tags rt
                  where rt.resource_id = r.id and rt.tag_id = new.id);
  return new;
end;
$$;

create trigger tags_refresh_search
after update of name on public.tags
for each row execute function public.tags_refresh_search();

-- Trigger functions are only ever run by triggers, never called directly.
revoke execute on function public.resources_before_write()        from public, anon, authenticated;
revoke execute on function public.resource_tags_refresh_search()  from public, anon, authenticated;
revoke execute on function public.categories_refresh_search()     from public, anon, authenticated;
revoke execute on function public.tags_refresh_search()           from public, anon, authenticated;
