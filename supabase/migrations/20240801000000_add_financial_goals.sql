
-- Cria a tabela para armazenar as metas financeiras dos usuários
CREATE TABLE public.financial_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    goal_amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT financial_goals_user_id_unique UNIQUE (user_id)
);

-- Ativa a Row Level Security (RLS) na nova tabela
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

-- Permite que os usuários insiram sua própria meta financeira
CREATE POLICY "Allow users to insert their own financial goal"
ON public.financial_goals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Permite que os usuários leiam sua própria meta financeira
CREATE POLICY "Allow users to read their own financial goal"
ON public.financial_goals
FOR SELECT
USING (auth.uid() = user_id);

-- Permite que os usuários atualizem sua própria meta financeira
CREATE POLICY "Allow users to update their own financial goal"
ON public.financial_goals
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Permite que os usuários deletem sua própria meta financeira
CREATE POLICY "Allow users to delete their own financial goal"
ON public.financial_goals
FOR DELETE
USING (auth.uid() = user_id);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_financial_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para chamar a função de atualização em cada UPDATE
CREATE TRIGGER on_financial_goals_updated
BEFORE UPDATE ON public.financial_goals
FOR EACH ROW
EXECUTE FUNCTION public.handle_financial_goals_updated_at();
