

export type Tag = {
  value: string;
  label: string;
};

export type Testimonial = {
  client: string;
  text: string;
};

export type Certification = {
  text: string;
};

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
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  nationality: string | null;
  civil_status: string | null;
  profession: string | null;
  rg: string | null;
  cpf: string | null;
  phone?: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
  sex: 'male' | 'female';
  
  billing_status: 'active' | 'inactive';
  proposal_id: string | null;
  value?: number | null;
  payment_day?: number | null;
  first_charge_date?: string | null;

  asaas_customer_id?: string | null;

  propostas?: Proposta; 
  Cobranca?: Cobranca[];
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
  civil_status?: string | null;
  profession?: string | null;
  rg?: string | null;
  cpf?: string;
  address?: string;
  signature?: string;
  is_completed?: boolean;
  email?: string;
  plan_type: 'free' | 'assistente' | 'squad' | 'agencia' | 'trial';
  credits: number;
  sex: 'male' | 'female';
  avatar_url: string | null;
  phone?: string | null;
  asaas_customer_id?: string | null;
  pix_key?: string | null;
  is_agency?: boolean; 

  // Public Profile Fields
  slug?: string;
  title?: string;
  location?: string;
  availability?: 'Disponível' | 'Vagas Limitadas';
  responseTime?: string;
  bio?: string;
  specialties?: Tag[];
  services?: Tag[];
  tools?: Tag[];
  certifications?: Certification[];
  testimonials?: Testimonial[];
  public_profile_completed?: boolean;
  horasTrabalho?: number;
  clientesAtendidos?: number;
  avaliacaoMedia?: number;
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

export type Cobranca = {
    id: string;
    created_at: string;
    user_id: string;
    cliente_id: string;
    due_date: string;
    value: number;
    status: 'pendente' | 'pago' | 'atrasado';
    paid_at: string | null;
    invoice_url: string | null;
    updated_at: string | null;
    download_otp: string | null;
    download_otp_expires_at: string | null;
    
    asaas_payment_id?: string | null;

    clientes: Cliente; // Join com clientes
}

export type Holiday = {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  type: string;
};

export type DayOff = {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  created_at: string;
};

export type FinancialGoal = {
  id: string;
  user_id: string;
  goal_amount: number;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  user_id: string;
  client_id: string;
  description: string;
  is_completed: boolean;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  clientes: Cliente; // Join com clientes
};

export type SquadClient = {
  squad_id: string;
  client_id: string;
  clientes: Cliente;
};

export type Squad = {
    id: string;
    agency_id: string;
    name: string;
    assistant_id: string | null;
    created_at: string;
    updated_at: string | null;
    squad_clients: SquadClient[];
}
