-- Run this entire file once in Supabase: SQL Editor -> New query -> Run.
-- It creates an empty RapidLab database and a private report-file bucket.

create table if not exists public.workspace_archive_rows (
  id text primary key,
  archive_id text not null,
  source_table text not null,
  source_key text not null,
  row_json text not null,
  archived_at timestamptz not null
);

create table if not exists public.workspace_reset_state (
  reset_id text primary key,
  archive_id text not null,
  applied_at timestamptz not null
);

create table if not exists public.lab_records (
  id text primary key,
  patient_code text not null,
  patient_name text not null,
  patient_age integer,
  source text not null,
  values_json text not null,
  report_file_key text,
  report_file_name text,
  owner_email text,
  hospital_id text,
  created_by_email text,
  assigned_to_email text,
  status text not null default 'pending',
  verified_by_email text,
  verified_at timestamptz,
  updated_at timestamptz,
  created_at timestamptz not null
);

create table if not exists public.lab_report_files (
  id text primary key,
  record_id text not null,
  hospital_id text not null,
  file_key text not null,
  file_name text not null,
  content_type text not null,
  uploaded_by_email text not null,
  created_at timestamptz not null
);

create table if not exists public.staff_profiles (
  email text primary key,
  name text not null,
  staff_id text not null unique,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.auth_accounts (
  email text primary key,
  password_hash text not null,
  password_salt text not null,
  password_iterations integer not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.auth_sessions (
  token_hash text primary key,
  email text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null
);

create table if not exists public.email_verification_challenges (
  email text primary key,
  name text not null,
  staff_id text not null,
  password_hash text not null,
  password_salt text not null,
  password_iterations integer not null,
  code_hash text not null,
  code_salt text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  resend_after timestamptz not null,
  created_at timestamptz not null
);

create table if not exists public.hospitals (
  id text primary key,
  name text not null,
  code text not null unique,
  created_by_email text not null,
  created_at timestamptz not null
);

create table if not exists public.hospital_members (
  email text primary key,
  hospital_id text not null,
  role text not null default 'nurse',
  status text not null default 'pending',
  joined_at timestamptz not null,
  approved_at timestamptz,
  approved_by_email text
);

create table if not exists public.record_audit (
  id text primary key,
  record_id text,
  hospital_id text not null,
  actor_email text not null,
  actor_name text not null,
  action text not null,
  details text not null,
  created_at timestamptz not null
);

create index if not exists idx_workspace_archive_rows_archive_id on public.workspace_archive_rows (archive_id);
create index if not exists idx_workspace_archive_rows_source_table on public.workspace_archive_rows (source_table);
create index if not exists idx_lab_report_files_hospital_id on public.lab_report_files (hospital_id);
create index if not exists idx_lab_report_files_record_id on public.lab_report_files (record_id);
create index if not exists idx_auth_sessions_email on public.auth_sessions (email);
create index if not exists idx_auth_sessions_expires_at on public.auth_sessions (expires_at);
create index if not exists idx_email_verification_expires_at on public.email_verification_challenges (expires_at);

-- The browser must not access clinical tables through Supabase's public API.
alter table public.workspace_archive_rows enable row level security;
alter table public.workspace_reset_state enable row level security;
alter table public.lab_records enable row level security;
alter table public.lab_report_files enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.auth_accounts enable row level security;
alter table public.auth_sessions enable row level security;
alter table public.email_verification_challenges enable row level security;
alter table public.hospitals enable row level security;
alter table public.hospital_members enable row level security;
alter table public.record_audit enable row level security;

insert into storage.buckets (id, name, public)
values ('lab-reports', 'lab-reports', false)
on conflict (id) do update set public = false;
