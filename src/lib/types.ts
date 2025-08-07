export type Cliente = {
  id: string;
  user_id: string;
  client_id: string;
  avatar_url: string | null;
  person_type: 'cpf' | 'cnpj' | null;
  company_name: string | null;
  cnpj: string | null;
  representative_name: string | null;
  representative_rg: string | null;
  representative_cpf: string | null;
  full_name: string | null;
  nationality: string | null;
  civil_status: string | null;
  profession: string | null;
  rg: string | null;
  cpf: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
};

export type Proposta = {
  id: string;
  user_id: string;
  name: string;
  services: string[];
  created_at: string;
  updated_at: string;
};
