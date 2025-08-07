-- Tabela para armazenar os dados do perfil da contratada
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  person_type TEXT NOT NULL CHECK (person_type IN ('cpf', 'cnpj')),
  
  -- Campos para Pessoa Jurídica
  company_name TEXT,
  cnpj TEXT,
  
  -- Campos para Pessoa Física
  full_name TEXT,
  nationality TEXT,
  civil_status TEXT,
  profession TEXT,
  rg TEXT,
  cpf TEXT,
  
  -- Campos comuns
  address TEXT,
  signature TEXT, -- Armazenará a assinatura como uma string longa (Data URL)
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Política de segurança para permitir que os usuários acessem e modifiquem seus próprios perfis
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Os usuários podem visualizar seus próprios perfis."
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Os usuários podem inserir seus próprios perfis."
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Os usuários podem atualizar seus próprios perfis."
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para chamar a função handle_updated_at antes de cada atualização
CREATE TRIGGER on_profile_update
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE PROCEDURE handle_updated_at();
