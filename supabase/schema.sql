-- 1. Create a new storage bucket 'varcom' with public access enabled
insert into storage.buckets (id, name, public)
values ('varcom', 'varcom', true)
on conflict (id) do update set public = true;

-- 2. Allow public read access (Anyone can view the images without login)
create policy "Public Access"
on storage.objects for select
to public
using ( bucket_id = 'varcom' );

-- 3. Allow authenticated users to insert/upload files
create policy "Authenticated users can upload"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'varcom' );

-- 4. Allow authenticated users to update/overwrite files
create policy "Authenticated users can update"
on storage.objects for update
to authenticated
using ( bucket_id = 'varcom' );

-- 5. Allow authenticated users to delete files
create policy "Authenticated users can delete"
on storage.objects for delete
to authenticated
using ( bucket_id = 'varcom' );


-- 6. Create a table for public profiles
create table public.profiles (
  id uuid not null references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- Set up Row Level Security (RLS) for the profiles table
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- Set up a trigger to automatically create a profile record when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it exists (for idempotency)
drop trigger if exists on_auth_user_created on auth.users;

-- Create the trigger on auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
