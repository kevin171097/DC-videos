-- DAYXON: feed publico de videos y permisos del bucket
-- Ejecuta este archivo completo en Supabase > SQL Editor > New query.

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  username text not null default 'Usuario',
  title text not null,
  caption text not null default '',
  video_url text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

alter table public.videos enable row level security;

grant select on public.videos to anon, authenticated;
grant insert, delete on public.videos to anon, authenticated;

drop policy if exists "DAYXON videos publicos" on public.videos;
create policy "DAYXON videos publicos"
on public.videos for select
to anon, authenticated
using (true);

drop policy if exists "DAYXON publicar propio" on public.videos;
create policy "DAYXON publicar propio"
on public.videos for insert
to public
with check (
  coalesce(auth.jwt() ->> 'sub', '') <> ''
  and (auth.jwt() ->> 'sub') = user_id
);

drop policy if exists "DAYXON borrar propio" on public.videos;
create policy "DAYXON borrar propio"
on public.videos for delete
to authenticated
using ((auth.jwt() ->> 'sub') = user_id);

-- El bucket Videos debe existir y estar configurado como Public.
drop policy if exists "DAYXON leer bucket Videos" on storage.objects;
create policy "DAYXON leer bucket Videos"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'Videos');

drop policy if exists "DAYXON subir bucket Videos" on storage.objects;
create policy "DAYXON subir bucket Videos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'Videos'
  and (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
);

drop policy if exists "DAYXON borrar bucket propio" on storage.objects;
create policy "DAYXON borrar bucket propio"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'Videos'
  and (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
);
