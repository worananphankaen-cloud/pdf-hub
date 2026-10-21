-- รันทั้งไฟล์ใน Supabase → SQL Editor (รันครั้งเดียว)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('master','admin','user')),
  last_login timestamptz default now()
);
create table categories (
  id uuid primary key default gen_random_uuid(),
  title text not null, description text, image_url text
);
create table manuals (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete cascade,
  title text not null, file_path text not null,
  created_at timestamptz default now()
);
create table notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null, created_at timestamptz default now()
);

create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles(id, email, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'role','user'));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

create function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from profiles where id = auth.uid() and role in ('admin','master'));
$$;

create function touch_login() returns void
language sql security definer set search_path = public as $$
  update profiles set last_login = now() where id = auth.uid();
$$;

create function inactive_users() returns setof profiles
language sql stable security definer set search_path = public as $$
  select * from profiles
  where is_staff() and role = 'user' and last_login < now() - interval '90 days'
  order by last_login;
$$;

alter table profiles enable row level security;
alter table categories enable row level security;
alter table manuals enable row level security;
alter table notifications enable row level security;

create policy "own profile" on profiles for select using (id = auth.uid() or is_staff());
create policy "read cat" on categories for select to authenticated using (true);
create policy "write cat" on categories for all to authenticated using (is_staff()) with check (is_staff());
create policy "read manuals" on manuals for select to authenticated using (true);
create policy "write manuals" on manuals for all to authenticated using (is_staff()) with check (is_staff());
create policy "read noti" on notifications for select to authenticated using (true);
create policy "write noti" on notifications for all to authenticated using (is_staff()) with check (is_staff());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('manuals','manuals', false, 52428800, array['application/pdf']);

create policy "read pdf" on storage.objects for select to authenticated using (bucket_id = 'manuals');
create policy "staff upload pdf" on storage.objects for insert to authenticated
  with check (bucket_id = 'manuals' and is_staff());
create policy "staff delete pdf" on storage.objects for delete to authenticated
  using (bucket_id = 'manuals' and is_staff());

-- หลังสร้าง user แรกที่ Authentication → Users แล้ว ให้รัน (แก้อีเมล):
-- update profiles set role = 'master' where email = 'you@company.com';
