
-- ### PROFILES TABLE ###
-- Stores public user data. Users can access their own data and read data of other users.
CREATE TABLE
    public.profiles (
        id UUID NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NULL,
        person_type TEXT NULL,
        company_name TEXT NULL,
        cnpj TEXT NULL,
        full_name TEXT NULL,
        nationality TEXT NULL,
        civil_status TEXT NULL,
        profession TEXT NULL,
        rg TEXT NULL,
        cpf TEXT NULL,
        address TEXT NULL,
        signature TEXT NULL,
        is_completed BOOLEAN NULL DEFAULT FALSE,
        CONSTRAINT profiles_pkey PRIMARY KEY (id),
        CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE
    );

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.profiles FOR
SELECT
    USING (TRUE);

CREATE POLICY "Allow individual update access" ON public.profiles FOR
UPDATE
    USING (auth.uid () = id);

-- ### PROPOSTAS TABLE ###
-- Stores service proposal templates created by users.
CREATE TABLE
    public.propostas (
        id UUID NOT NULL DEFAULT gen_random_uuid (),
        user_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NULL,
        name TEXT NOT NULL,
        services TEXT[] NULL,
        payment_type TEXT NULL,
        value NUMERIC NULL,
        value_in_words TEXT NULL,
        payment_day INTEGER NULL,
        payment_method TEXT NULL,
        contract_duration_type TEXT NULL,
        contract_duration_months INTEGER NULL,
        start_date DATE NULL,
        end_date DATE NULL,
        jurisdiction_city TEXT NULL,
        jurisdiction_state TEXT NULL,
        CONSTRAINT propostas_pkey PRIMARY KEY (id),
        CONSTRAINT propostas_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
    );

ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual access" ON public.propostas FOR ALL USING (auth.uid () = user_id);

-- ### CLIENTES TABLE ###
-- Stores client information, linked to a user.
CREATE TABLE
    public.clientes (
        id UUID NOT NULL DEFAULT gen_random_uuid (),
        user_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        client_id TEXT NULL,
        avatar_url TEXT NULL,
        email TEXT NULL,
        person_type TEXT NULL,
        company_name TEXT NULL,
        cnpj TEXT NULL,
        representative_name TEXT NULL,
        representative_rg TEXT NULL,
        representative_cpf TEXT NULL,
        full_name TEXT NULL,
        nationality TEXT NULL,
        civil_status TEXT NULL,
        profession TEXT NULL,
        rg TEXT NULL,
        cpf TEXT NULL,
        phone TEXT NULL,
        address TEXT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NULL,
        billing_status TEXT NOT NULL DEFAULT 'inactive'::TEXT,
        proposal_id UUID NULL,
        value NUMERIC NULL,
        payment_day INTEGER NULL,
        first_charge_date DATE NULL,
        CONSTRAINT clientes_pkey PRIMARY KEY (id),
        CONSTRAINT clientes_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.propostas (id) ON DELETE SET NULL,
        CONSTRAINT clientes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
        CONSTRAINT clientes_client_id_key UNIQUE (client_id)
    );

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual access" ON public.clientes FOR ALL USING (auth.uid () = user_id);

CREATE POLICY "Allow public read access for client portal" ON public.clientes FOR
SELECT
    USING (TRUE);

-- ### CONTRATOS TABLE ###
-- Stores contracts between users and clients.
CREATE TABLE
    public.contratos (
        id UUID NOT NULL DEFAULT gen_random_uuid (),
        user_id UUID NOT NULL,
        cliente_id UUID NOT NULL,
        proposta_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NULL,
        contract_code TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft'::TEXT,
        provider_signature_data JSONB NULL,
        client_signature_data JSONB NULL,
        provider_signature_image_url TEXT NULL,
        client_signature_image_url TEXT NULL,
        full_contract_text TEXT NULL,
        client_signature_otp TEXT NULL,
        client_signature_otp_expires_at TIMESTAMP WITH TIME ZONE NULL,
        CONSTRAINT contratos_pkey PRIMARY KEY (id),
        CONSTRAINT contratos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes (id) ON DELETE CASCADE,
        CONSTRAINT contratos_proposta_id_fkey FOREIGN KEY (proposta_id) REFERENCES public.propostas (id) ON DELETE CASCADE,
        CONSTRAINT contratos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
        CONSTRAINT contratos_contract_code_key UNIQUE (contract_code)
    );

ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual access" ON public.contratos FOR ALL USING (auth.uid () = user_id);

CREATE POLICY "Allow public read access for client portal" ON public.contratos FOR
SELECT
    USING (TRUE);
