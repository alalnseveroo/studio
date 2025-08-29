
create or replace function get_clients_not_in_squads(p_agency_id uuid)
returns setof clientes as $$
begin
  return query
  select c.*
  from clientes c
  where c.user_id = p_agency_id
    and not exists (
      select 1
      from squad_clients sc
      where sc.client_id = c.id
    );
end;
$$ language plpgsql;
