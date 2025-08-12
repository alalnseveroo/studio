
-- Create PROFILES table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    person_type TEXT,
    company_name TEXT,
    cnpj TEXT,
    full_name TEXT,
    nationality TEXT,
    civil_status TEXT,
    profession TEXT,
    rg TEXT,
    cpf TEXT,
    address TEXT,
    signature TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create PROPOSTAS table
CREATE TABLE IF NOT EXISTS propostas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    services TEXT[] NOT NULL,
    payment_type TEXT, -- 'fixed', 'hourly', 'project'
    value NUMERIC(10, 2),
    value_in_words TEXT,
    payment_day INT,
    payment_method TEXT,
    contract_duration_type TEXT, -- 'indefinite', 'definite'
    contract_duration_months INT,
    start_date DATE,
    end_date DATE,
    jurisdiction_city TEXT,
    jurisdiction_state TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create CLIENTES table
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    email TEXT UNIQUE,
    person_type TEXT, -- 'cpf' ou 'cnpj'
    company_name TEXT,
    cnpj TEXT UNIQUE,
    representative_name TEXT,
    representative_rg TEXT,
    representative_cpf TEXT,
    full_name TEXT,
    nationality TEXT,
    civil_status TEXT,
    profession TEXT,
    rg TEXT,
    cpf TEXT UNIQUE,
    phone TEXT,
    address TEXT,
    billing_status TEXT DEFAULT 'inactive', -- 'active', 'inactive', 'pending_approval'
    proposal_id UUID REFERENCES propostas(id) ON DELETE SET NULL,
    value NUMERIC(10, 2),
    payment_day INT,
    first_charge_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create CONTRATOS table
CREATE TABLE IF NOT EXISTS contratos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    proposta_id UUID REFERENCES propostas(id) ON DELETE CASCADE,
    contract_code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'signed_by_provider', 'signed_by_client'
    provider_signature_data JSONB,
    client_signature_data JSONB,
    provider_signature_image_url TEXT,
    client_signature_image_url TEXT,
    full_contract_text TEXT,
    client_signature_otp TEXT,
    client_signature_otp_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- RLS for PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only view their own profile." ON profiles;
CREATE POLICY "Users can only view their own profile."
    ON profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert or update their own profile." ON profiles;
CREATE POLICY "Users can insert or update their own profile."
    ON profiles FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- RLS for PROPOSTAS
ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own proposals." ON propostas;
CREATE POLICY "Users can manage their own proposals."
    ON propostas FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS for CLIENTES
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own clients." ON clientes;
CREATE POLICY "Users can manage their own clients."
    ON clientes FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow public read access to client portal." ON clientes;
CREATE POLICY "Allow public read access to client portal."
    ON clientes FOR SELECT
    USING (true); -- Acesso controlado na query pelo client ID

-- RLS for CONTRATOS
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own contracts." ON contratos;
CREATE POLICY "Users can manage their own contracts."
    ON contratos FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
    
DROP POLICY IF EXISTS "Allow public read access to contract portal." ON contratos;
CREATE POLICY "Allow public read access to contract portal."
    ON contratos FOR SELECT
    USING (true); -- Acesso controlado na query pelo contract ID e client ID
