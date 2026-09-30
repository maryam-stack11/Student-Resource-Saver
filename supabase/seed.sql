-- =====================================================================
-- OPTIONAL demo data for Study Resource Saver
--
-- You do NOT need this file. It only adds a few example categories, tags
-- and resources to ONE account so the app doesn't look empty in a demo.
--
-- How to use:
--   1. Sign up in the app first (so your account exists).
--   2. Change the email on the line marked  <-- CHANGE THIS  to your email.
--   3. Supabase dashboard → SQL Editor → New query → paste this whole file → Run.
--
-- Running it twice is safe: existing categories/tags are reused, but the
-- example resources would be added a second time.
-- =====================================================================
do $$
declare
  v_email text := 'you@example.com';   -- <-- CHANGE THIS to the email you signed up with
  v_user  uuid;
  v_cpp uuid; v_ai uuid; v_math uuid;
  v_res uuid;
begin
  select id into v_user from auth.users where lower(email) = lower(v_email);
  if v_user is null then
    raise exception 'No account found for "%". Sign up in the app first, then put that email at the top of this file.', v_email;
  end if;

  -- Categories (reuse if they already exist)
  insert into public.categories (user_id, name) values
    (v_user, 'C++'), (v_user, 'AI'), (v_user, 'Mathematics')
  on conflict (user_id, lower(name)) do nothing;
  select id into v_cpp  from public.categories where user_id = v_user and lower(name) = 'c++';
  select id into v_ai   from public.categories where user_id = v_user and lower(name) = 'ai';
  select id into v_math from public.categories where user_id = v_user and lower(name) = 'mathematics';

  -- Tags (reuse if they already exist)
  insert into public.tags (user_id, name) values
    (v_user, 'OOP'), (v_user, 'Pointers'), (v_user, 'Important'), (v_user, 'Exam'), (v_user, 'Assignment')
  on conflict (user_id, lower(name)) do nothing;

  -- Resources
  insert into public.resources (user_id, title, url, type, category_id, status, is_favorite, notes)
  values (v_user, 'C++ reference (cppreference)', 'https://en.cppreference.com/', 'website', v_cpp, 'in_progress', true,
          'Look things up here before asking anyone.')
  returning id into v_res;
  insert into public.resource_tags (resource_id, tag_id)
    select v_res, id from public.tags where user_id = v_user and lower(name) in ('oop', 'important');

  insert into public.resources (user_id, title, url, type, category_id, status, notes)
  values (v_user, 'C++ Core Guidelines (GitHub)', 'https://github.com/isocpp/CppCoreGuidelines', 'github', v_cpp, 'to_study',
          'Read the sections on resource management and pointers.')
  returning id into v_res;
  insert into public.resource_tags (resource_id, tag_id)
    select v_res, id from public.tags where user_id = v_user and lower(name) in ('pointers');

  insert into public.resources (user_id, title, url, type, category_id, status, notes)
  values (v_user, 'Attention Is All You Need (paper)', 'https://arxiv.org/pdf/1706.03762', 'pdf', v_ai, 'to_study',
          'The original Transformer paper. Needed for the assignment.')
  returning id into v_res;
  insert into public.resource_tags (resource_id, tag_id)
    select v_res, id from public.tags where user_id = v_user and lower(name) in ('assignment', 'important');

  insert into public.resources (user_id, title, url, type, category_id, status, is_favorite, notes)
  values (v_user, 'Khan Academy: Linear Algebra', 'https://www.khanacademy.org/math/linear-algebra', 'course', v_math, 'completed', true,
          'Finished. Revise eigenvectors before the exam.')
  returning id into v_res;
  insert into public.resource_tags (resource_id, tag_id)
    select v_res, id from public.tags where user_id = v_user and lower(name) in ('exam');

  insert into public.resources (user_id, title, url, type, status, notes)
  values (v_user, 'MDN Web Docs', 'https://developer.mozilla.org/', 'website', 'to_study',
          'Not in any category yet, so it shows as Uncategorized.');

  raise notice 'Demo data added for %', v_email;
end
$$;
