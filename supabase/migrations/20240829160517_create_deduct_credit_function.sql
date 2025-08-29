
create or replace function deduct_credit_and_activate_client(p_client_id uuid, p_user_id uuid)
returns void as $$
declare
  current_credits int;
begin
  -- Get current credits in a transaction-safe way
  select credits into current_credits from public.profiles where id = p_user_id for update;

  if current_credits <= 0 then
    raise exception 'Créditos insuficientes. Por favor, compre créditos para ativar este cliente.';
  end if;

  -- Deduct credit
  update public.profiles
  set credits = credits - 1
  where id = p_user_id;

  -- Activate client
  update public.clientes
  set billing_status = 'active'
  where id = p_client_id;
  
end;
$$ language plpgsql;
