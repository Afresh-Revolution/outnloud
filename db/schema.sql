-- Out N Loud. Safe to run in the Supabase SQL editor.
-- The app also creates these tables on first use.

create table if not exists site_settings (
  key text primary key,
  value text not null default ''
);

create table if not exists subscribers (
  id uuid primary key,
  name text not null,
  email text not null unique,
  phone text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists inquiries (
  id uuid primary key,
  intent text not null,
  name text not null,
  email text not null,
  organization text not null default '',
  message text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists lineup_acts (
  id uuid primary key,
  artist text not null,
  stage text not null,
  time_label text not null default '',
  bio text not null default '',
  image_url text not null default '',
  cloudinary_id text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists gallery_items (
  id uuid primary key,
  kind text not null,
  title text not null default '',
  caption text not null default '',
  url text not null,
  cloudinary_id text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists partners (
  id uuid primary key,
  inquiry_id uuid,
  name text not null,
  tier text not null default '',
  website text not null default '',
  logo_url text not null default '',
  cloudinary_id text not null default '',
  created_at timestamptz not null default now()
);
