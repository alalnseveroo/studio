
-- Habilitar a extensão pgcrypto se ainda não estiver habilitada
create extension if not exists pgcrypto with schema extensions;

/******************/
/*      AUTH      */
/******************/

-- Esta tabela irá espelhar os usuários do serviço de Autenticação da Supabase.
create table public.profiles (
  id uuid not null primary key references auth.users (id) on delete cascade,
  person_type text check (person_type in ('cpf', 'cnpj')),
  company_name text,
  cnpj text,
  full_name text,
  nationality text,
  civil_status text,
  profession text,
  rg text,
  cpf text,
  address text,
  signature text,
  is_completed boolean default false,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- RLS para PROFILES
alter table public.profiles enable row level security;

create policy "Users can view their own profile."
  on public.profiles for select
  using ( auth.uid() = id );

create policy "Users can insert or update their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update their own profile."
  on public.profiles for update
  using ( auth.uid() = id );


/******************/
/*    PROPOSTAS   */
/******************/

create table public.propostas (
  id uuid not null primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  services text[] not null,
  payment_type text check (payment_type in ('fixed', 'hourly', 'project')),
  value numeric(10, 2),
  value_in_words text,
  payment_day integer,
  payment_method text,
  contract_duration_type text check (contract_duration_type in ('indefinite', 'definite')),
  contract_duration_months integer,
  start_date date,
  end_date date,
  jurisdiction_city text,
  jurisdiction_state text,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- RLS para PROPOSTAS
alter table public.propostas enable row level security;

create policy "Users can manage their own proposals."
  on public.propostas for all
  using ( auth.uid() = user_id );


/******************/
/*     CLIENTES    */
/******************/

create table public.clientes (
  id uuid not null primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  client_id text not null unique,
  avatar_url text,
  email text,
  person_type text check (person_type in ('cpf', 'cnpj')),
  company_name text,
  cnpj text,
  representative_name text,
  representative_rg text,
  representative_cpf text,
  full_name text,
  nationality text,
  civil_status text,
  profession text,
  rg text,
  cpf text,
  phone text,
  address text,
  billing_status text check (billing_status in ('active', 'inactive', 'pending_approval')) default 'inactive',
  proposal_id uuid references public.propostas(id) on delete set null,
  value numeric(10, 2),
  payment_day integer,
  first_charge_date date,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- RLS para CLIENTES
alter table public.clientes enable row level security;

create policy "Users can manage their own clients."
  on public.clientes for all
  using ( auth.uid() = user_id );

create policy "Clients can view their own data via portal link."
  on public.clientes for select
  using (true); -- Acesso controlado pela lógica de backend que verifica o ID do cliente.


/******************/
/*    CONTRATOS   */
/******************/

create type contract_status as enum ('draft', 'signed_by_provider', 'signed_by_client');

create table public.contratos (
    id uuid not null primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    cliente_id uuid not null references public.clientes(id) on delete cascade,
    proposta_id uuid not null references public.propostas(id) on delete cascade,
    contract_code text not null unique,
    status contract_status default 'draft',
    provider_signature_data jsonb,
    client_signature_data jsonb,
    provider_signature_image_url text,
    client_signature_image_url text,
    full_contract_text text,
    client_signature_otp text,
    client_signature_otp_expires_at timestamp with time zone,
    updated_at timestamp with time zone,
    created_at timestamp with time zone default now()
);

-- RLS para CONTRATOS
alter table public.contratos enable row level security;

create policy "Users can manage their own contracts."
  on public.contratos for all
  using ( auth.uid() = user_id );
  
create policy "Clients can view their own contracts via portal link."
  on public.contratos for select
  using (true); -- Acesso controlado pela lógica de backend.
