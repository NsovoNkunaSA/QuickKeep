create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('link', 'file')),
  name text not null,
  description text not null default '',
  url text,
  file_name text,
  file_path text,
  created_at timestamptz not null default now(),
  constraint saved_items_content_matches_kind check (
    (kind = 'link' and url is not null and file_path is null and file_name is null)
    or (kind = 'file' and url is null and file_path is not null and file_name is not null)
  )
);

create index if not exists saved_items_user_created_idx
  on public.saved_items (user_id, created_at desc);

alter table public.saved_items enable row level security;

grant select, insert, update, delete on public.saved_items to authenticated;

drop policy if exists "Users can read their own saved items" on public.saved_items;
create policy "Users can read their own saved items"
  on public.saved_items for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own saved items" on public.saved_items;
create policy "Users can create their own saved items"
  on public.saved_items for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own saved items" on public.saved_items;
create policy "Users can update their own saved items"
  on public.saved_items for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own saved items" on public.saved_items;
create policy "Users can delete their own saved items"
  on public.saved_items for delete to authenticated
  using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit)
values ('quickkeep-files', 'quickkeep-files', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

drop policy if exists "Users can read files in their own folder" on storage.objects;
create policy "Users can read files in their own folder"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'quickkeep-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can upload files to their own folder" on storage.objects;
create policy "Users can upload files to their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'quickkeep-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can update files in their own folder" on storage.objects;
create policy "Users can update files in their own folder"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'quickkeep-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'quickkeep-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can delete files in their own folder" on storage.objects;
create policy "Users can delete files in their own folder"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'quickkeep-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );