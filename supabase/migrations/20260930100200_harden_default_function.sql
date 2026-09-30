-- =====================================================================
-- Study Resource Saver: tidy-up recommended by the Supabase security advisor
-- Run this file third.
--
-- New Supabase projects ship with a helper called public.rls_auto_enable()
-- that switches RLS on for every new table. It is only meant to be run by
-- the database itself, so we stop app users from being able to call it.
-- (If your project does not have this helper, this file does nothing.)
-- =====================================================================
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end
$$;
