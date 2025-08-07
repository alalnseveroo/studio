
export type Cliente = {
  id: string;
  user_id: string;
  client_id: string;
  avatar_url: string | null;
  email: string | null;
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
  payment_type?: 'fixed' | 'hourly' | 'project';
  value?: number;
  value_in_words?: string;
  payment_day?: number;
  payment_method?: string;
  contract_duration_type?: 'indefinite' | 'definite';
  contract_duration_months?: number;
  start_date?: string;
  end_date?: string;
  jurisdiction_city?: string;
  jurisdiction_state?: string;
};

export type Profile = {
  id: string;
  person_type?: 'cpf' | 'cnpj';
  company_name?: string;
  cnpj?: string;
  full_name?: string;
  nationality?: string;
  civil_status?: string;
  profession?: string;
  rg?: string;
  cpf?: string;
  address?: string;
  signature?: string;
  is_completed?: boolean;
  email?: string;
};

export type Contrato = {
  id: string;
  user_id: string;
  cliente_id: string;
  proposta_id: string;
  contract_code: string;
  status: 'draft' | 'signed_by_provider' | 'signed_by_client';
  provider_signature_data: SignatureData | null;
  client_signature_data: SignatureData | null;
  provider_signature_image_url: string | null;
  client_signature_image_url: string | null;
  full_contract_text: string;
  created_at: string;
  updated_at: string;
  client_signature_otp: string | null;
  client_signature_otp_expires_at: string | null;
  clientes: Cliente; 
  propostas: Proposta;
};

export type SignatureData = {
  signed_at: string;
  ip_address: string;
  user_agent: string;
  email_verified: string;
};
