
-- Habilita a RLS (Row-Level Security) na tabela, se ainda não estiver habilitada.
-- Isso é uma boa prática de segurança.
alter table public.profiles enable row level security;
alter table public.clientes enable row level security;
alter table public.cobrancas enable row level security;

-- Permite que usuários autenticados leiam seus próprios perfis.
create policy "Authenticated users can select their own profile"
on public.profiles for select
using ( auth.uid() = id );

-- Permite que usuários autenticados atualizem seus próprios perfis.
create policy "Authenticated users can update their own profile"
on public.profiles for update
using ( auth.uid() = id );

-- Permite que usuários autenticados gerenciem (leiam, insiram, atualizem) clientes associados a eles.
create policy "Users can manage their own clients"
on public.clientes for all
using ( auth.uid() = user_id );

-- Permite que usuários autenticados gerenciem (leiam, insiram, atualizem) cobranças associadas a eles.
create policy "Users can manage their own charges"
on public.cobrancas for all
using ( auth.uid() = user_id );

-- Permite que o portal do cliente (sem autenticação de user) leia as cobranças de um cliente específico.
-- A segurança aqui é baseada no fato de que o ID do cliente é um UUID, difícil de adivinhar.
create policy "Allow public read access to charges for client portal"
on public.cobrancas for select
using ( true );


-- Função para deduzir crédito e ativar cliente
create or replace function public.deduct_credit_and_activate_client(p_user_id uuid, p_client_id uuid)
returns void
language plpgsql
security definer -- Executa com os privilégios do dono da função
as $$
declare
  v_credits int;
begin
  -- Verifica se o usuário tem créditos
  select credits into v_credits from public.profiles where id = p_user_id;

  if v_credits > 0 then
    -- Deduz um crédito do perfil do usuário
    update public.profiles
    set credits = credits - 1
    where id = p_user_id;

    -- Ativa o status de cobrança do cliente
    update public.clientes
    set billing_status = 'active'
    where id = p_client_id and user_id = p_user_id;
    
    -- Log para debug (opcional)
    -- raise notice 'Credit deducted for user % and client % activated.', p_user_id, p_client_id;
  else
    -- Se não há créditos, lança um erro que pode ser capturado pelo frontend
    raise exception 'Créditos insuficientes para ativar o cliente.';
  end if;
end;
$$;

-- Garante que o usuário autenticado possa chamar esta função
grant execute on function public.deduct_credit_and_activate_client(uuid, uuid) to authenticated;
