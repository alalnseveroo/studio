-- Drop a função existente para evitar conflitos ao recriá-la.
DROP FUNCTION IF EXISTS deduct_credit_and_activate_client(p_client_id uuid, p_user_id uuid);

-- Cria a função que deduz um crédito e ativa o cliente atomicamente.
CREATE OR REPLACE FUNCTION deduct_credit_and_activate_client(
    p_client_id uuid,
    p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com os privilégios do criador da função
AS $$
DECLARE
    current_credits INT;
BEGIN
    -- Busca o número atual de créditos do usuário
    SELECT credits INTO current_credits FROM public.profiles WHERE id = p_user_id;

    -- Verifica se o usuário tem créditos suficientes
    IF current_credits IS NULL OR current_credits <= 0 THEN
        RAISE EXCEPTION 'Créditos insuficientes para ativar o cliente.';
    END IF;

    -- Deduz um crédito do perfil do usuário
    UPDATE public.profiles
    SET credits = credits - 1
    WHERE id = p_user_id;

    -- Ativa o status de cobrança do cliente
    UPDATE public.clientes
    SET billing_status = 'active'
    WHERE id = p_client_id;
    
    -- Log ou auditoria (opcional)
    -- INSERT INTO audit_log (user_id, action) VALUES (p_user_id, 'deducted 1 credit for client activation ' || p_client_id);
END;
$$;
