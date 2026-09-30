-- =====================================================================
-- Study Resource Saver: Row Level Security (RLS)
-- RLS = database rules that decide which rows each logged-in user may
-- read or change. Here: every user can only touch their own rows.
-- Run this file second.
-- =====================================================================

alter table public.categories    enable row level security;
alter table public.tags          enable row level security;
alter table public.resources     enable row level security;
alter table public.resource_tags enable row level security;

-- Logged-out visitors get nothing at all; logged-in users get table access
-- that the policies below then narrow down to their own rows.
revoke all on public.categories, public.tags, public.resources, public.resource_tags from anon;
grant select, insert, update, delete
  on public.categories, public.tags, public.resources, public.resource_tags
  to authenticated;

-- ---------------------------- categories -----------------------------
create policy "categories_select_own" on public.categories
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "categories_insert_own" on public.categories
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "categories_update_own" on public.categories
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "categories_delete_own" on public.categories
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ------------------------------- tags --------------------------------
create policy "tags_select_own" on public.tags
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "tags_insert_own" on public.tags
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "tags_update_own" on public.tags
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "tags_delete_own" on public.tags
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ----------------------------- resources -----------------------------
-- On insert/update the category (if any) must also belong to the user.
create policy "resources_select_own" on public.resources
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "resources_insert_own" on public.resources
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      category_id is null
      or exists (select 1 from public.categories c
                  where c.id = category_id and c.user_id = (select auth.uid()))
    )
  );

create policy "resources_update_own" on public.resources
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      category_id is null
      or exists (select 1 from public.categories c
                  where c.id = category_id and c.user_id = (select auth.uid()))
    )
  );

create policy "resources_delete_own" on public.resources
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- --------------------------- resource_tags ---------------------------
-- This table has no user_id, so ownership is checked through the parent
-- resource (and, when adding, through the tag as well).
create policy "resource_tags_select_own" on public.resource_tags
  for select to authenticated
  using (
    exists (select 1 from public.resources r
             where r.id = resource_id and r.user_id = (select auth.uid()))
  );

create policy "resource_tags_insert_own" on public.resource_tags
  for insert to authenticated
  with check (
    exists (select 1 from public.resources r
             where r.id = resource_id and r.user_id = (select auth.uid()))
    and exists (select 1 from public.tags t
                 where t.id = tag_id and t.user_id = (select auth.uid()))
  );

create policy "resource_tags_delete_own" on public.resource_tags
  for delete to authenticated
  using (
    exists (select 1 from public.resources r
             where r.id = resource_id and r.user_id = (select auth.uid()))
  );
