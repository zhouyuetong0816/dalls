-- Run once in the project's SQL Editor. Never expose a service-role key to the website.
create table if not exists public.site_admins (user_id uuid primary key references auth.users(id));
alter table public.site_admins enable row level security;
create policy "Read own administrator status" on public.site_admins for select to authenticated using(user_id=auth.uid());
create function public.is_site_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.site_admins where user_id=auth.uid()); $$;
revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to authenticated;
create table public.family_members (
 id text primary key check(id ~ '^[a-f0-9-]{32,36}$'),
 name text not null check(char_length(name) between 1 and 60),
 created bigint not null,
 owner_id uuid not null references auth.users(id),
 object_path text not null check(object_path ~ '^[a-f0-9-]+/[a-f0-9-]+/[a-f0-9-]+\.json$'),
 revision integer not null default 1 check(revision>0)
);
alter table public.family_members enable row level security;
grant select on public.family_members to anon,authenticated;
grant insert,update,delete on public.family_members to authenticated;
grant select on public.site_admins to authenticated;
create policy "Read shared dolls" on public.family_members for select to anon,authenticated using(true);
create policy "Submit own doll" on public.family_members for insert to authenticated with check(owner_id=auth.uid() and revision=1 and split_part(object_path,'/',1)=auth.uid()::text);
create policy "Update own dolls or administrator" on public.family_members for update to authenticated using(owner_id=auth.uid() or public.is_site_admin()) with check((owner_id=auth.uid() or public.is_site_admin()) and split_part(object_path,'/',1)=auth.uid()::text);
create policy "Administrator deletes dolls" on public.family_members for delete to authenticated using(public.is_site_admin());
create function public.check_family_revision() returns trigger language plpgsql set search_path=public as $$
begin
 if new.id<>old.id or new.created<>old.created or new.owner_id<>old.owner_id or new.revision<>old.revision+1 then raise exception 'Immutable identity or invalid revision'; end if;
 return new;
end; $$;
create trigger family_revision before update on public.family_members for each row execute function public.check_family_revision();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('family-designs','family-designs',true,52428800,array['application/json']) on conflict(id) do nothing;
create policy "Upload own design files" on storage.objects for insert to authenticated with check(bucket_id='family-designs' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Read own uploaded files" on storage.objects for select to authenticated using(bucket_id='family-designs' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Remove own unused files" on storage.objects for delete to authenticated using(bucket_id='family-designs' and (storage.foldername(name))[1]=auth.uid()::text and not exists(select 1 from public.family_members f where f.object_path=name));
-- After creating the site's administrator user under Authentication / Users:
-- insert into public.site_admins(user_id) values ('ADMINISTRATOR_USER_UUID');
-- Also enable Anonymous sign-ins under Authentication / Sign In / Providers.
