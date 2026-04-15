-- Sand-E: agent_memory table
create table if not exists agent_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  context text,
  sessions integer default 0,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table agent_memory enable row level security;

create policy "Users manage their own memory"
  on agent_memory for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Service role full access to memory"
  on agent_memory for all to service_role
  using (true);

-- Sand-E: agent_runs table
create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  goal text not null,
  step_title text,
  tool text,
  result text,
  status text default 'complete',
  created_at timestamptz default now()
);

alter table agent_runs enable row level security;

create policy "Users view their own runs"
  on agent_runs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Service role full access to runs"
  on agent_runs for all to service_role
  using (true);
